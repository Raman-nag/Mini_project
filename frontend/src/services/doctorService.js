// Doctor service for managing doctor-related operations
import { mockMedicalRecords, mockPatients } from '../data/mockData';
import { uploadToIPFS } from '../utils/ipfs';
import { getDoctorContract } from '../utils/contract';
import { sendTx } from '../utils/web3';

/**
 * Doctor Service
 * Mock implementation for doctor medical record operations
 */
class DoctorService {
  constructor() {
    this.records = [...mockMedicalRecords];
    this.patients = [...mockPatients];
  }

  /**
   * Create a new medical record
   * @param {string} patientAddress - Patient's wallet address
   * @param {Object} recordData - Medical record data
   * @returns {Promise<Object>} Created record data
   */
  async createRecord(patientAddress, recordData) {
    try {
      // TODO: Replace with actual blockchain/API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Validate required fields
      if (!recordData.diagnosis || !recordData.symptoms || !recordData.treatment) {
        throw new Error('Missing required fields: diagnosis, symptoms, treatment');
      }

      // Find patient by address
      const patient = this.patients.find(p => p.walletAddress === patientAddress);
      
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Create new medical record
      const newRecord = {
        id: `rec_${Date.now()}`,
        patientId: patient.id,
        patientAddress: patientAddress,
        doctorId: recordData.doctorId || 'doc_001',
        doctorName: recordData.doctorName || 'Dr. Sarah Johnson',
        hospitalId: recordData.hospitalId || 'hosp_001',
        hospitalName: recordData.hospitalName || 'City General Hospital',
        date: new Date().toISOString().split('T')[0],
        diagnosis: recordData.diagnosis,
        symptoms: Array.isArray(recordData.symptoms) ? recordData.symptoms : [recordData.symptoms],
        treatment: recordData.treatment,
        doctorNotes: recordData.doctorNotes || '',
        attachments: recordData.attachments || [],
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // Add to records list
      this.records.push(newRecord);

      console.log('[Mock Doctor Service] Record created:', newRecord);

      return {
        success: true,
        record: newRecord,
        message: 'Medical record created successfully'
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
   * @returns {Promise<Object>} Updated record data
   */
  async updateRecord(recordId, updateData) {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find record
      const recordIndex = this.records.findIndex(record => record.id === recordId);

      if (recordIndex === -1) {
        throw new Error('Medical record not found');
      }

      // Update record data
      this.records[recordIndex] = {
        ...this.records[recordIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      console.log('[Mock Doctor Service] Record updated:', this.records[recordIndex]);

      return {
        success: true,
        record: this.records[recordIndex],
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
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Filter records by patient address
      const patientRecords = this.records.filter(
        record => record.patientAddress === patientAddress
      );

      // Sort by date (most recent first)
      patientRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('[Mock Doctor Service] Patient history retrieved:', patientRecords.length);

      return {
        success: true,
        records: patientRecords,
        count: patientRecords.length
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
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 600));

      // For mock implementation, return all patients
      // In production, this would filter by assigned doctor
      const myPatients = this.patients.map(patient => ({
        ...patient,
        lastVisitDate: this.getLastVisitDate(patient.id),
        totalRecords: this.getTotalRecords(patient.id)
      }));

      console.log('[Mock Doctor Service] My patients retrieved:', myPatients.length);

      return {
        success: true,
        patients: myPatients,
        count: myPatients.length
      };
    } catch (error) {
      console.error('Doctor Service - Get My Patients Error:', error);
      throw error;
    }
  }

  /**
   * Helper method to get last visit date for a patient
   * @param {string} patientId - Patient ID
   * @returns {string|null} Last visit date
   */
  getLastVisitDate(patientId) {
    const patientRecords = this.records.filter(r => r.patientId === patientId);
    
    if (patientRecords.length === 0) return null;

    const dates = patientRecords.map(r => new Date(r.date));
    return new Date(Math.max(...dates)).toISOString().split('T')[0];
  }

  /**
   * Helper method to get total records for a patient
   * @param {string} patientId - Patient ID
   * @returns {number} Total records count
   */
  getTotalRecords(patientId) {
    return this.records.filter(r => r.patientId === patientId).length;
  }

  /**
   * Get a specific medical record by ID
   * @param {string} recordId - Record ID
   * @returns {Promise<Object>} Medical record data
   */
  async getRecordById(recordId) {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const record = this.records.find(r => r.id === recordId);

      if (!record) {
        throw new Error('Medical record not found');
      }

      return {
        success: true,
        record
      };
    } catch (error) {
      console.error('Doctor Service - Get Record Error:', error);
      throw error;
    }
  }

  /**
   * Delete a medical record
   * @param {string} recordId - Record ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteRecord(recordId) {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const recordIndex = this.records.findIndex(r => r.id === recordId);

      if (recordIndex === -1) {
        throw new Error('Medical record not found');
      }

      const deletedRecord = this.records[recordIndex];
      this.records.splice(recordIndex, 1);

      console.log('[Mock Doctor Service] Record deleted:', deletedRecord);

      return {
        success: true,
        record: deletedRecord,
        message: 'Medical record deleted successfully'
      };
    } catch (error) {
      console.error('Doctor Service - Delete Record Error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new DoctorService();

// Blockchain-backed functions (named exports)
export const createMedicalRecord = async (patientAddress, recordData, files = []) => {
  const ipfsHash = files && files.length ? await uploadToIPFS(files) : '';
  const contract = await getDoctorContract();
  const receipt = await sendTx(
    contract.createMedicalRecord(
      patientAddress,
      recordData.diagnosis,
      recordData.symptoms,
      recordData.prescription,
      recordData.treatmentPlan,
      ipfsHash
    )
  );
  return receipt;
};

export const getPatientHistory = async (patientAddress) => {
  const contract = await getDoctorContract();
  const records = await contract.getPatientRecords(patientAddress);
  return records;
};

