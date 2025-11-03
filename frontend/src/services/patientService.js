import { mockMedicalRecords, mockPrescriptions, mockPatients } from '../data/mockData';
import { getPatientContract } from '../utils/contract';
import { sendTx } from '../utils/web3';

/**
 * Patient Service
 * Mock implementation for patient operations
 */
class PatientService {
  constructor() {
    this.records = [...mockMedicalRecords];
    this.prescriptions = [...mockPrescriptions];
    this.patients = [...mockPatients];
    this.accessList = [];
  }

  /**
   * Get patient's own medical records
   * @param {string} patientAddress - Patient's wallet address
   * @returns {Promise<Array>} List of medical records
   */
  async getMyRecords(patientAddress) {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Find patient by address
      const patient = this.patients.find(p => p.walletAddress === patientAddress);
      
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Filter records by patient ID
      const myRecords = this.records.filter(record => record.patientId === patient.id);

      // Sort by date (most recent first)
      myRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('[Mock Patient Service] My records retrieved:', myRecords.length);

      return {
        success: true,
        records: myRecords,
        count: myRecords.length
      };
    } catch (error) {
      console.error('Patient Service - Get My Records Error:', error);
      throw error;
    }
  }

  /**
   * Get patient's prescriptions
   * @param {string} patientAddress - Patient's wallet address
   * @returns {Promise<Array>} List of prescriptions
   */
  async getMyPrescriptions(patientAddress) {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 600));

      // Find patient by address
      const patient = this.patients.find(p => p.walletAddress === patientAddress);
      
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Filter prescriptions by patient ID
      const myPrescriptions = this.prescriptions.filter(
        prescription => prescription.patientId === patient.id
      );

      // Sort by date (most recent first)
      myPrescriptions.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('[Mock Patient Service] My prescriptions retrieved:', myPrescriptions.length);

      return {
        success: true,
        prescriptions: myPrescriptions,
        count: myPrescriptions.length
      };
    } catch (error) {
      console.error('Patient Service - Get My Prescriptions Error:', error);
      throw error;
    }
  }

  /**
   * Grant access to a third party
   * @param {string} address - Third party wallet address
   * @param {Object} accessOptions - Access options
   * @returns {Promise<Object>} Grant access result
   */
  async grantAccess(address, accessOptions = {}) {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate address
      if (!address || !address.startsWith('0x')) {
        throw new Error('Invalid wallet address');
      }

      // Check if access already granted
      const existingAccess = this.accessList.find(access => access.address === address);
      
      if (existingAccess) {
        throw new Error('Access already granted to this address');
      }

      // Create access record
      const accessRecord = {
        id: `acc_${Date.now()}`,
        address: address,
        type: accessOptions.type || 'third_party',
        provider: accessOptions.provider || 'Unknown Provider',
        grantedAt: new Date().toISOString(),
        expiresAt: accessOptions.expiresAt || null,
        status: 'active',
        permissions: accessOptions.permissions || ['read'],
        purpose: accessOptions.purpose || 'Medical records access'
      };

      // Add to access list
      this.accessList.push(accessRecord);

      console.log('[Mock Patient Service] Access granted:', accessRecord);

      return {
        success: true,
        access: accessRecord,
        message: 'Access granted successfully'
      };
    } catch (error) {
      console.error('Patient Service - Grant Access Error:', error);
      throw error;
    }
  }

  /**
   * Revoke access from a third party
   * @param {string} address - Third party wallet address
   * @returns {Promise<Object>} Revoke access result
   */
  async revokeAccess(address) {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find access record
      const accessIndex = this.accessList.findIndex(access => access.address === address);

      if (accessIndex === -1) {
        throw new Error('Access not found');
      }

      const revokedAccess = this.accessList[accessIndex];
      this.accessList.splice(accessIndex, 1);

      console.log('[Mock Patient Service] Access revoked:', revokedAccess);

      return {
        success: true,
        access: revokedAccess,
        message: 'Access revoked successfully'
      };
    } catch (error) {
      console.error('Patient Service - Revoke Access Error:', error);
      throw error;
    }
  }

  /**
   * Get list of granted access
   * @returns {Promise<Array>} List of access records
   */
  async getAccessList() {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[Mock Patient Service] Access list retrieved:', this.accessList.length);

      return {
        success: true,
        accessList: this.accessList,
        count: this.accessList.length
      };
    } catch (error) {
      console.error('Patient Service - Get Access List Error:', error);
      throw error;
    }
  }

  /**
   * Get patient profile
   * @param {string} patientAddress - Patient's wallet address
   * @returns {Promise<Object>} Patient profile data
   */
  async getMyProfile(patientAddress) {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 600));

      const patient = this.patients.find(p => p.walletAddress === patientAddress);

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Get additional stats
      const stats = {
        totalRecords: this.records.filter(r => r.patientId === patient.id).length,
        totalPrescriptions: this.prescriptions.filter(p => p.patientId === patient.id).length,
        lastVisitDate: this.getLastVisitDate(patient.id)
      };

      return {
        success: true,
        profile: {
          ...patient,
          ...stats
        }
      };
    } catch (error) {
      console.error('Patient Service - Get My Profile Error:', error);
      throw error;
    }
  }

  /**
   * Helper method to get last visit date
   * @param {string} patientId - Patient ID
   * @returns {string|null} Last visit date
   */
  getLastVisitDate(patientId) {
    const patientRecords = this.records.filter(r => r.patientId === patientId);
    
    if (patientRecords.length === 0) return null;

    const dates = patientRecords.map(r => new Date(r.date));
    return new Date(Math.max(...dates)).toISOString().split('T')[0];
  }
}

// Export singleton instance
export default new PatientService();

// Blockchain-backed functions (named exports)
export const grantAccessOnChain = async (address, permissions = ['read']) => {
  const contract = await getPatientContract();
  const receipt = await sendTx(contract.grantAccess(address, permissions));
  return receipt;
};

export const revokeAccessOnChain = async (address) => {
  const contract = await getPatientContract();
  const receipt = await sendTx(contract.revokeAccess(address));
  return receipt;
};

export const getMyRecordsOnChain = async (patientAddress) => {
  const contract = await getPatientContract();
  const records = await contract.getMyRecords(patientAddress);
  return records;
};

export const getMyPrescriptionsOnChain = async (patientAddress) => {
  const contract = await getPatientContract();
  const prescriptions = await contract.getMyPrescriptions(patientAddress);
  return prescriptions;
};

