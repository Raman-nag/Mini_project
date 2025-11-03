import { mockDoctors, mockPatients, mockHospitals } from '../data/mockData';
import { getHospitalContract } from '../utils/contract';
import { sendTx } from '../utils/web3';

/**
 * Hospital Service
 * Mock implementation for hospital management operations
 */
class HospitalService {
  constructor() {
    this.doctors = [...mockDoctors];
    this.patients = [...mockPatients];
  }

  /**
   * Register a new doctor in the hospital
   * @param {Object} doctorData - Doctor information
   * @returns {Promise<Object>} Registered doctor data
   */
  async registerDoctor(doctorData) {
    try {
      // TODO: Replace with actual blockchain/API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate required fields
      if (!doctorData.firstName || !doctorData.lastName || !doctorData.specialty) {
        throw new Error('Missing required fields: firstName, lastName, specialty');
      }

      // Create new doctor object
      const newDoctor = {
        id: `doc_${Date.now()}`,
        ...doctorData,
        status: 'active',
        registeredAt: new Date().toISOString(),
        walletAddress: doctorData.walletAddress || `0x${Math.random().toString(16).substr(2, 40)}`
      };

      // Add to doctors list
      this.doctors.push(newDoctor);

      console.log('[Mock Hospital Service] Doctor registered:', newDoctor);

      return {
        success: true,
        doctor: newDoctor,
        message: 'Doctor registered successfully'
      };
    } catch (error) {
      console.error('Hospital Service - Register Doctor Error:', error);
      throw error;
    }
  }

  /**
   * Get all doctors in the hospital
   * @returns {Promise<Array>} List of doctors
   */
  async getDoctors() {
    try {
      // TODO: Replace with actual blockchain/API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[Mock Hospital Service] Getting doctors:', this.doctors.length);

      return {
        success: true,
        doctors: this.doctors,
        count: this.doctors.length
      };
    } catch (error) {
      console.error('Hospital Service - Get Doctors Error:', error);
      throw error;
    }
  }

  /**
   * Get all patients
   * @returns {Promise<Array>} List of patients
   */
  async getPatients() {
    try {
      // TODO: Replace with actual blockchain/API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('[Mock Hospital Service] Getting patients:', this.patients.length);

      return {
        success: true,
        patients: this.patients,
        count: this.patients.length
      };
    } catch (error) {
      console.error('Hospital Service - Get Patients Error:', error);
      throw error;
    }
  }

  /**
   * Remove a doctor from the hospital
   * @param {string} address - Doctor's wallet address
   * @returns {Promise<Object>} Removal result
   */
  async removeDoctor(address) {
    try {
      // TODO: Replace with actual blockchain/API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Find and remove doctor
      const doctorIndex = this.doctors.findIndex(doctor => doctor.walletAddress === address);

      if (doctorIndex === -1) {
        throw new Error('Doctor not found');
      }

      const removedDoctor = this.doctors[doctorIndex];
      this.doctors.splice(doctorIndex, 1);

      console.log('[Mock Hospital Service] Doctor removed:', removedDoctor.name);

      return {
        success: true,
        doctor: removedDoctor,
        message: 'Doctor removed successfully'
      };
    } catch (error) {
      console.error('Hospital Service - Remove Doctor Error:', error);
      throw error;
    }
  }

  /**
   * Get doctor by address
   * @param {string} address - Doctor's wallet address
   * @returns {Promise<Object>} Doctor data
   */
  async getDoctorByAddress(address) {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const doctor = this.doctors.find(doctor => doctor.walletAddress === address);

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      return {
        success: true,
        doctor
      };
    } catch (error) {
      console.error('Hospital Service - Get Doctor Error:', error);
      throw error;
    }
  }

  /**
   * Update doctor information
   * @param {string} address - Doctor's wallet address
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated doctor data
   */
  async updateDoctor(address, updateData) {
    try {
      // TODO: Replace with actual blockchain/API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const doctorIndex = this.doctors.findIndex(doctor => doctor.walletAddress === address);

      if (doctorIndex === -1) {
        throw new Error('Doctor not found');
      }

      // Update doctor data
      this.doctors[doctorIndex] = {
        ...this.doctors[doctorIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      console.log('[Mock Hospital Service] Doctor updated:', this.doctors[doctorIndex]);

      return {
        success: true,
        doctor: this.doctors[doctorIndex],
        message: 'Doctor updated successfully'
      };
    } catch (error) {
      console.error('Hospital Service - Update Doctor Error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new HospitalService();

// Blockchain-backed functions (named exports) — keep mocks above for compatibility
export const registerDoctor = async (doctorData) => {
  const contract = await getHospitalContract();
  const receipt = await sendTx(
    contract.addDoctor(
      doctorData.address,
      doctorData.name,
      doctorData.specialization,
      doctorData.licenseNumber
    )
  );
  return receipt;
};

export const getDoctors = async () => {
  const contract = await getHospitalContract();
  const doctors = await contract.getHospitalDoctors();
  return doctors;
};

