import { getDoctorContract, getPatientContract } from '../utils/contract';
import { sendTx } from '../utils/web3';
import { uploadToIPFS } from '../utils/ipfs';

/**
 * Doctor Service
 * Real blockchain implementation for doctor medical record operations
 */
class DoctorService {
  /**
   * Update doctor profile (name and specialization)
   * @param {string} name - Doctor's name
   * @param {string} specialization - Doctor's specialization
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(name, specialization) {
    try {
      const contract = await getDoctorContract();
      const tx = await contract.updateProfile(name, specialization);
      const receipt = await sendTx(Promise.resolve(tx));
      
      return {
        success: true,
        receipt,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Doctor Service - Update Profile Error:', error);
      throw error;
    }
  }

  /**
   * Get prescriptions authored by a specific doctor, scanning recent records
   * @param {string} doctorAddress
   * @param {number} maxScan - maximum number of latest records to scan
   * @returns {Promise<{success:boolean, count:number, prescriptions:Array}>}
   */
  async getDoctorPrescriptions(doctorAddress, maxScan = 1000) {
    try {
      const contract = await getDoctorContract();
      let total = 0;
      try {
        const rc = await contract.recordCount();
        total = Number(rc) || 0;
      } catch {
        total = 0;
      }

      const target = (doctorAddress || '').toLowerCase();
      const prescriptions = [];
      const scan = Math.max(0, Math.min(maxScan, total));
      for (let i = total - 1; i >= 0 && (total - 1 - i) < scan; i--) {
        try {
          const record = await contract.getRecordById(i);
          const doc = (record?.doctorAddress || '').toLowerCase();
          const prescription = record?.prescription || '';
          if (doc === target && prescription.trim().length > 0) {
            prescriptions.push(this.formatRecord(record, i));
          }
        } catch {
        }
      }
      prescriptions.sort((a, b) => b.timestamp - a.timestamp);
      return { success: true, count: prescriptions.length, prescriptions };
    } catch (error) {
      console.error('Doctor Service - Get Doctor Prescriptions Error:', error);
      throw error;
    }
  }

  /**
   * Create a new medical record on blockchain
   * @param {string} patientAddress - Patient's wallet address
   * @param {Object} recordData - Medical record data
   * @param {File[]} files - Files to upload to IPFS
   * @returns {Promise<Object>} Created record data
   */
  async createRecord(patientAddress, recordData, files = []) {
    try {
      // Validate required fields
      if (!recordData.diagnosis) {
        throw new Error('Diagnosis is required');
      }

      // Prefer an IPFS hash passed in recordData; fall back to uploading files
      let ipfsHash = (recordData && recordData.ipfsHash) || '';
      if (!ipfsHash && files && files.length > 0) {
        try {
          ipfsHash = await uploadToIPFS(files);
          console.log('Files uploaded to IPFS:', ipfsHash);
        } catch (ipfsError) {
          console.error('IPFS upload error:', ipfsError);
          throw new Error('Failed to upload files to IPFS');
        }
      }

      if (!ipfsHash || typeof ipfsHash !== 'string' || ipfsHash.trim().length === 0) {
        throw new Error('IPFS hash required');
      }

      // Prepare data for blockchain
      const symptoms = Array.isArray(recordData.symptoms) 
        ? recordData.symptoms 
        : (recordData.symptoms ? [recordData.symptoms] : []);
      
      const prescription = recordData.prescription || recordData.treatment || '';
      const treatmentPlan = recordData.treatmentPlan || recordData.treatment || '';

      // Create record on blockchain
      const contract = await getDoctorContract();
      const tx = await contract.createMedicalRecord(
        patientAddress,
        recordData.diagnosis,
        symptoms,
        prescription,
        treatmentPlan,
        ipfsHash,
        { gasLimit: 5_000_000 }
      );
      
      const receipt = await sendTx(Promise.resolve(tx));
      
      // Extract record ID from events
      let recordId = null;
      if (receipt.logs) {
        const event = receipt.logs.find(log => {
          try {
            return log.topics && log.topics.length > 0;
          } catch {
            return false;
          }
        });
        if (event) {
          // Record ID is typically in the event data
          recordId = receipt.logs.length - 1; // Fallback to index
        }
      }

      // Fetch the created record
      const recordCount = await contract.recordCount();
      recordId = Number(recordCount) - 1;

      const createdRecord = await contract.getRecordById(recordId);
      
      // Best-effort: update patient's diseases list for research summaries
      try {
        const diseaseCategory = (recordData && (recordData.diseaseCategory || recordData.diagnosis)) || '';
        if (diseaseCategory && diseaseCategory.trim().length > 0) {
          const patientContract = await getPatientContract();
          const txDisease = await patientContract.addDiseaseForPatient(patientAddress, diseaseCategory);
          await sendTx(Promise.resolve(txDisease));
        }
      } catch (helperErr) {
        console.warn('Doctor Service - addDiseaseForPatient helper failed (non-fatal):', helperErr);
      }

      return {
        success: true,
        record: this.formatRecord(createdRecord, recordId),
        receipt,
        message: 'Medical record created successfully on blockchain'
      };
    } catch (error) {
      console.error('Doctor Service - Create Record Error:', error);
      throw error;
    }
  }

  /**
   * Update an existing medical record
   * @param {string} recordId - Record ID
   * @param {Object} updateData - Data to update
   * @param {File[]} files - New files to upload
   * @returns {Promise<Object>} Updated record data
   */
  async updateRecord(recordId, updateData, files = []) {
    try {
      const contract = await getDoctorContract();
      
      // Get existing record
      const existingRecord = await contract.getRecordById(recordId);
      
      // Upload new files if provided
      let ipfsHash = existingRecord.ipfsHash;
      if (files && files.length > 0) {
        try {
          ipfsHash = await uploadToIPFS(files);
          console.log('New files uploaded to IPFS:', ipfsHash);
        } catch (ipfsError) {
          console.error('IPFS upload error:', ipfsError);
          throw new Error('Failed to upload files to IPFS');
        }
      }

      // Prepare update data
      const diagnosis = updateData.diagnosis || existingRecord.diagnosis;
      const symptoms = updateData.symptoms 
        ? (Array.isArray(updateData.symptoms) ? updateData.symptoms : [updateData.symptoms])
        : existingRecord.symptoms;
      const prescription = updateData.prescription || existingRecord.prescription;
      const treatmentPlan = updateData.treatmentPlan || existingRecord.treatmentPlan;

      // Update record on blockchain
      const tx = await contract.updateMedicalRecord(
        recordId,
        diagnosis,
        symptoms,
        prescription,
        treatmentPlan,
        ipfsHash
      );
      
      const receipt = await sendTx(Promise.resolve(tx));
      
      // Fetch updated record
      const updatedRecord = await contract.getRecordById(recordId);
      
      return {
        success: true,
        record: this.formatRecord(updatedRecord, recordId),
        receipt,
        message: 'Medical record updated successfully'
      };
    } catch (error) {
      console.error('Doctor Service - Update Record Error:', error);
      throw error;
    }
  }

  /**
   * Get patient's medical history
   * @param {string} patientAddress - Patient's wallet address
   * @returns {Promise<Array>} List of medical records
   */
  async getPatientHistory(patientAddress) {
    try {
      // Get doctor address from signer
      const doctorContract = await getDoctorContract();
      const signer = await doctorContract.signer;
      const doctorAddress = await signer.getAddress();
      
      // Check if doctor has access (if not the patient themselves)
      let hasAccess = false;
      if (doctorAddress.toLowerCase() !== patientAddress.toLowerCase()) {
        const patientContract = await getPatientContract();
        hasAccess = await patientContract.hasAccess(doctorAddress, patientAddress).catch(() => false);
      } else {
        hasAccess = true; // Doctor is viewing their own record
      }
      
      // Check if we're the patient or have access
      if (doctorAddress.toLowerCase() !== patientAddress.toLowerCase() && !hasAccess) {
        throw new Error('You do not have access to this patient\'s records. Please request access from the patient.');
      }

      // Get patient records
      const recordIds = await doctorContract.getPatientRecords(patientAddress);
      
      // Fetch full records
      const records = await Promise.all(
        recordIds.map(async (id) => {
          try {
            const record = await doctorContract.getRecordById(id);
            return this.formatRecord(record, id);
          } catch (err) {
            console.error(`Error fetching record ${id}:`, err);
            return null;
          }
        })
      );
      
      const validRecords = records.filter(r => r !== null);
      validRecords.sort((a, b) => b.timestamp - a.timestamp);
      
      return {
        success: true,
        records: validRecords,
        count: validRecords.length
      };
    } catch (error) {
      console.error('Doctor Service - Get Patient History Error:', error);
      throw error;
    }
  }

  /**
   * Get all patients assigned to this doctor
   * @returns {Promise<Array>} List of patients
   */
  async getMyPatients() {
    try {
      const contract = await getDoctorContract();
      const patientAddresses = await contract.getDoctorPatients();
      
      // Fetch patient details
      const patientContract = await getPatientContract();
      const patients = await Promise.all(
        patientAddresses.map(async (address) => {
          try {
            const details = await patientContract.getPatientDetails(address);
            const recordIds = await contract.getPatientRecords(address);
            
            return {
              walletAddress: address,
              name: details.name,
              dateOfBirth: details.dateOfBirth,
              bloodGroup: details.bloodGroup,
              totalRecords: recordIds.length,
              lastVisitDate: recordIds.length > 0 
                ? await this.getLastVisitDate(recordIds, contract)
                : null
            };
          } catch (err) {
            console.error(`Error fetching patient ${address}:`, err);
            return null;
          }
        })
      );
      
      const validPatients = patients.filter(p => p !== null);
      
      return {
        success: true,
        patients: validPatients,
        count: validPatients.length
      };
    } catch (error) {
      console.error('Doctor Service - Get My Patients Error:', error);
      throw error;
    }
  }

  /**
   * Get a specific medical record by ID
   * @param {string} recordId - Record ID
   * @returns {Promise<Object>} Medical record data
   */
  async getRecordById(recordId) {
    try {
      const contract = await getDoctorContract();
      const record = await contract.getRecordById(recordId);
      
      return {
        success: true,
        record: this.formatRecord(record, recordId)
      };
    } catch (error) {
      console.error('Doctor Service - Get Record Error:', error);
      throw error;
    }
  }

  /**
   * Helper to get last visit date
   */
  async getLastVisitDate(recordIds, contract) {
    if (recordIds.length === 0) return null;
    
    try {
      const timestamps = await Promise.all(
        recordIds.map(async (id) => {
          const record = await contract.getRecordById(id);
          return Number(record.timestamp);
        })
      );
      
      const maxTimestamp = Math.max(...timestamps);
      return new Date(maxTimestamp * 1000).toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * Format blockchain record to frontend format
   */
  formatRecord(record, recordId) {
    return {
      id: recordId.toString(),
      patientAddress: record.patientAddress,
      doctorAddress: record.doctorAddress,
      diagnosis: record.diagnosis,
      symptoms: record.symptoms || [],
      prescription: record.prescription,
      treatmentPlan: record.treatmentPlan,
      ipfsHash: record.ipfsHash,
      timestamp: Number(record.timestamp),
      date: new Date(Number(record.timestamp) * 1000).toISOString().split('T')[0],
      isActive: record.isActive,
      doctorName: record.doctorAddress ? `${record.doctorAddress.slice(0, 6)}...${record.doctorAddress.slice(-4)}` : 'Unknown'
    };
  }
}

// Export singleton instance
export default new DoctorService();

// Named exports for backward compatibility
export const createMedicalRecord = (patientAddress, recordData, files) => 
  new DoctorService().createRecord(patientAddress, recordData, files);

export const getPatientHistory = (patientAddress) => 
  new DoctorService().getPatientHistory(patientAddress);
