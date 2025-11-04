import { getHospitalContract, getDoctorContract, getPatientContract } from '../utils/contract';
import { sendTx } from '../utils/web3';

/**
 * Hospital Service
 * Real blockchain implementation for hospital management operations
 */
class HospitalService {
  /**
   * Register a new hospital on blockchain
   * @param {string} name - Hospital name
   * @param {string} registrationNumber - Hospital registration number
   * @returns {Promise<Object>} Registration result
   */
  async registerHospital(name, registrationNumber) {
    try {
      const contract = await getHospitalContract();
      const tx = await contract.registerHospital(name, registrationNumber);
      const receipt = await sendTx(Promise.resolve(tx));
      
      return {
        success: true,
        receipt,
        message: 'Hospital registered successfully on blockchain'
      };
    } catch (error) {
      console.error('Hospital Service - Register Error:', error);
      throw error;
    }
  }

  /**
   * Register a new doctor in the hospital
   * @param {string} doctorAddress - Doctor's wallet address
   * @param {string} licenseNumber - Doctor's license number
   * @returns {Promise<Object>} Registered doctor data
   */
  async registerDoctor(doctorAddress, licenseNumber) {
    try {
      if (!doctorAddress || !doctorAddress.startsWith('0x')) {
        throw new Error('Invalid doctor wallet address');
      }
      
      if (!licenseNumber || licenseNumber.trim().length === 0) {
        throw new Error('License number is required');
      }

      const contract = await getHospitalContract();
      const tx = await contract.addDoctor(doctorAddress, licenseNumber);
      const receipt = await sendTx(Promise.resolve(tx));
      
      // Fetch doctor details
      const doctorContract = await getDoctorContract();
      const doctor = await doctorContract.doctors(doctorAddress);
      
      return {
        success: true,
        doctor: {
          walletAddress: doctorAddress,
          name: doctor.name,
          specialization: doctor.specialization,
          licenseNumber: doctor.licenseNumber,
          hospitalAddress: doctor.hospitalAddress,
          isActive: doctor.isActive,
          timestamp: Number(doctor.timestamp)
        },
        receipt,
        message: 'Doctor registered successfully on blockchain'
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
      const contract = await getHospitalContract();
      const { getSigner } = await import('../utils/web3');
      const signer = await getSigner();
      const hospitalAddress = await signer.getAddress();
      
      const doctorAddresses = await contract.getHospitalDoctors(hospitalAddress);
      
      // Fetch doctor details
      const doctorContract = await getDoctorContract();
      const doctors = await Promise.all(
        doctorAddresses.map(async (address) => {
          try {
            const doctor = await doctorContract.doctors(address);
            return {
              walletAddress: address,
              name: doctor.name,
              specialization: doctor.specialization,
              licenseNumber: doctor.licenseNumber,
              hospitalAddress: doctor.hospitalAddress,
              isActive: doctor.isActive,
              timestamp: Number(doctor.timestamp)
            };
          } catch (err) {
            console.error(`Error fetching doctor ${address}:`, err);
            return null;
          }
        })
      );
      
      const validDoctors = doctors.filter(d => d !== null);
      
      return {
        success: true,
        doctors: validDoctors,
        count: validDoctors.length
      };
    } catch (error) {
      console.error('Hospital Service - Get Doctors Error:', error);
      throw error;
    }
  }

  /**
   * Get all patients associated with the hospital
   * @returns {Promise<Array>} List of patients
   */
  async getPatients() {
    try {
      const contract = await getHospitalContract();
      const { getSigner } = await import('../utils/web3');
      const signer = await getSigner();
      const hospitalAddress = await signer.getAddress();
      
      const patientAddresses = await contract.getHospitalPatients(hospitalAddress);
      
      // Fetch patient details
      const patientContract = await getPatientContract();
      const patients = await Promise.all(
        patientAddresses.map(async (address) => {
          try {
            const patient = await patientContract.patients(address);
            return {
              walletAddress: address,
              name: patient.name,
              dateOfBirth: patient.dateOfBirth,
              bloodGroup: patient.bloodGroup,
              registeredDate: Number(patient.registeredDate),
              isActive: patient.isActive
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
      console.error('Hospital Service - Get Patients Error:', error);
      throw error;
    }
  }

  /**
   * Remove a doctor from the hospital
   * @param {string} doctorAddress - Doctor's wallet address
   * @returns {Promise<Object>} Removal result
   */
  async removeDoctor(doctorAddress) {
    try {
      const contract = await getHospitalContract();
      const tx = await contract.removeDoctor(doctorAddress);
      const receipt = await sendTx(Promise.resolve(tx));
      
      return {
        success: true,
        receipt,
        message: 'Doctor removed successfully'
      };
    } catch (error) {
      console.error('Hospital Service - Remove Doctor Error:', error);
      throw error;
    }
  }

  /**
   * Get hospital details
   * @returns {Promise<Object>} Hospital data
   */
  async getHospitalDetails() {
    try {
      const contract = await getHospitalContract();
      const { getSigner } = await import('../utils/web3');
      const signer = await getSigner();
      const hospitalAddress = await signer.getAddress();
      
      const details = await contract.getHospitalDetails(hospitalAddress);
      
      return {
        success: true,
        hospital: {
          name: details.name,
          registrationNumber: details.registrationNumber,
          walletAddress: hospitalAddress,
          isActive: details.isActive,
          timestamp: Number(details.timestamp),
          doctorCount: Number(details.doctorCount),
          patientCount: Number(details.patientCount)
        }
      };
    } catch (error) {
      console.error('Hospital Service - Get Hospital Details Error:', error);
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
      const doctorContract = await getDoctorContract();
      const doctor = await doctorContract.doctors(address);
      
      return {
        success: true,
        doctor: {
          walletAddress: address,
          name: doctor.name,
          specialization: doctor.specialization,
          licenseNumber: doctor.licenseNumber,
          hospitalAddress: doctor.hospitalAddress,
          isActive: doctor.isActive,
          timestamp: Number(doctor.timestamp)
        }
      };
    } catch (error) {
      console.error('Hospital Service - Get Doctor Error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new HospitalService();

// Named exports for backward compatibility
export const registerDoctor = (doctorAddress, licenseNumber) => 
  new HospitalService().registerDoctor(doctorAddress, licenseNumber);

export const getDoctors = () => new HospitalService().getDoctors();
