import { getPatientContract, getDoctorContract } from '../utils/contract';
import { sendTx } from '../utils/web3';

/**
 * Patient Service
 * Real blockchain implementation for patient operations
 */
class PatientService {
  /**
   * Register a new patient on blockchain
   * @param {string} name - Patient's full name
   * @param {string} dateOfBirth - Date of birth
   * @param {string} bloodGroup - Blood group
   * @returns {Promise<Object>} Registration result
   */
  async registerPatient(name, dateOfBirth, bloodGroup) {
    try {
      const contract = await getPatientContract();
      const tx = await contract.registerPatient(name, dateOfBirth, bloodGroup);
      const receipt = await sendTx(Promise.resolve(tx));
      
      return {
        success: true,
        receipt,
        message: 'Patient registered successfully on blockchain'
      };
    } catch (error) {
      console.error('Patient Service - Register Error:', error);
      throw error;
    }
  }

  /**
   * Get patient's own medical records from blockchain
   * @param {string} patientAddress - Patient's wallet address
   * @returns {Promise<Array>} List of medical record IDs
   */
  async getMyRecords(patientAddress) {
    try {
      const contract = await getPatientContract();
      const recordIds = await contract.getMyRecords();
      
      // Fetch full record details for each ID
      const doctorContract = await getDoctorContract();
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
      
      return {
        success: true,
        records: validRecords,
        count: validRecords.length
      };
    } catch (error) {
      console.error('Patient Service - Get My Records Error:', error);
      throw error;
    }
  }

  /**
   * Get patient's prescriptions from medical records
   * @param {string} patientAddress - Patient's wallet address
   * @returns {Promise<Array>} List of prescriptions
   */
  async getMyPrescriptions(patientAddress) {
    try {
      const records = await this.getMyRecords(patientAddress);
      
      // Extract prescriptions from records
      const prescriptions = records.records
        .filter(record => record.prescription)
        .map(record => ({
          id: record.id,
          prescription: record.prescription,
          doctor: record.doctorName,
          date: record.date,
          diagnosis: record.diagnosis
        }));
      
      return {
        success: true,
        prescriptions,
        count: prescriptions.length
      };
    } catch (error) {
      console.error('Patient Service - Get My Prescriptions Error:', error);
      throw error;
    }
  }

  /**
   * Grant access to a doctor/address
   * @param {string} addressToGrant - Address to grant access to
   * @returns {Promise<Object>} Grant access result
   */
  async grantAccess(addressToGrant) {
    try {
      if (!addressToGrant || !addressToGrant.startsWith('0x')) {
        throw new Error('Invalid wallet address');
      }

      const contract = await getPatientContract();
      const tx = await contract.grantAccess(addressToGrant);
      const receipt = await sendTx(Promise.resolve(tx));
      
      return {
        success: true,
        receipt,
        message: 'Access granted successfully'
      };
    } catch (error) {
      console.error('Patient Service - Grant Access Error:', error);
      throw error;
    }
  }

  /**
   * Revoke access from an address
   * @param {string} addressToRevoke - Address to revoke access from
   * @returns {Promise<Object>} Revoke access result
   */
  async revokeAccess(addressToRevoke) {
    try {
      const contract = await getPatientContract();
      const tx = await contract.revokeAccess(addressToRevoke);
      const receipt = await sendTx(Promise.resolve(tx));
      
      return {
        success: true,
        receipt,
        message: 'Access revoked successfully'
      };
    } catch (error) {
      console.error('Patient Service - Revoke Access Error:', error);
      throw error;
    }
  }

  /**
   * Check if an address has access to patient data
   * @param {string} requesterAddress - Address requesting access
   * @param {string} patientAddress - Patient's address
   * @returns {Promise<boolean>} Whether access is granted
   */
  async hasAccess(requesterAddress, patientAddress) {
    try {
      const contract = await getPatientContract();
      const hasAccess = await contract.hasAccess(requesterAddress, patientAddress);
      return hasAccess;
    } catch (error) {
      console.error('Patient Service - Check Access Error:', error);
      return false;
    }
  }

  /**
   * Get patient profile from blockchain
   * @param {string} patientAddress - Patient's wallet address
   * @returns {Promise<Object>} Patient profile data
   */
  async getMyProfile(patientAddress) {
    try {
      const contract = await getPatientContract();
      const profile = await contract.getPatientDetails(patientAddress);
      
      // Get records count
      const records = await this.getMyRecords(patientAddress);
      
      return {
        success: true,
        profile: {
          name: profile.name,
          dateOfBirth: profile.dateOfBirth,
          bloodGroup: profile.bloodGroup,
          walletAddress: patientAddress,
          registeredDate: new Date(Number(profile.registeredDate) * 1000).toISOString(),
          isActive: profile.isActive,
          totalRecords: records.count,
          totalPrescriptions: (await this.getMyPrescriptions(patientAddress)).count
        }
      };
    } catch (error) {
      console.error('Patient Service - Get My Profile Error:', error);
      throw error;
    }
  }

  /**
   * Format blockchain record to frontend format
   * @param {Object} record - Raw blockchain record
   * @param {string} recordId - Record ID
   * @returns {Object} Formatted record
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
export default new PatientService();

// Named exports for backward compatibility
export const grantAccessOnChain = (address) => new PatientService().grantAccess(address);
export const revokeAccessOnChain = (address) => new PatientService().revokeAccess(address);
export const getMyRecordsOnChain = (patientAddress) => new PatientService().getMyRecords(patientAddress);
export const getMyPrescriptionsOnChain = (patientAddress) => new PatientService().getMyPrescriptions(patientAddress);
