import { getHospitalContract, getDoctorContract, getPatientContract } from '../utils/contract';
import { sendTx, ensureCorrectNetwork, getChainId } from '../utils/web3';

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
      await ensureCorrectNetwork();
      const contract = await getHospitalContract();
      console.debug('[HospitalService] registerHospital using address', contract.address);
      console.debug('[HospitalService] args', { name, registrationNumber });
      const chainId = await getChainId();
      console.debug('[HospitalService] chainId', chainId);

      if (!name || !registrationNumber) {
        throw new Error('Hospital name and registration number are required');
      }

      const tx = await contract.registerHospital(name, registrationNumber, { gasLimit: 5_000_000 });
      const receipt = await sendTx(Promise.resolve(tx));
      
      return {
        success: true,
        receipt,
        message: 'Hospital registered successfully on blockchain'
      };
    } catch (error) {
      const message = (error?.reason) || (error?.error?.message) || (error?.message) || 'Registration failed';
      console.error('Hospital Service - Register Error:', message, error);
      throw new Error(message);
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

      await ensureCorrectNetwork();
      const contract = await getHospitalContract();
      const chainId = await getChainId();
      console.debug('[HospitalService] registerDoctor on', { address: contract.address, chainId, doctorAddress, licenseNumber });
      const tx = await contract.addDoctor(doctorAddress, licenseNumber, { gasLimit: 5_000_000 });
      const receipt = await sendTx(Promise.resolve(tx));
      
      // Fetch doctor details
      if (typeof getDoctorContract !== 'function') {
        throw new Error('Contract helper missing: getDoctorContract. Please reload the app or check contract setup.');
      }
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
      const code = error?.code;
      if (code === 4001) {
        throw new Error('User rejected the transaction');
      }
      const message = (error?.reason) || (error?.error?.message) || (error?.message) || 'Failed to register doctor';
      console.error('Hospital Service - Register Doctor Error:', message, error);
      throw new Error(message);
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
      if (typeof getDoctorContract !== 'function') {
        throw new Error('Contract helper missing: getDoctorContract. Please reload the app or check contract setup.');
      }
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
      const hospital = await getHospitalContract();
      const { getSigner } = await import('../utils/web3');
      const signer = await getSigner();
      const hospitalAddress = await signer.getAddress();
      console.debug('[HospitalService:getPatients] hospitalAddress', hospitalAddress);

      // Build patient set from recent records created by this hospital's doctors
      const doctorContract = await getDoctorContract();
      const patientContract = await getPatientContract();

      // Get hospital doctors
      let doctors = [];
      try {
        doctors = await hospital.getHospitalDoctors(hospitalAddress);
      } catch (err) {
        console.error('[HospitalService:getPatients] getHospitalDoctors failed', err);
        doctors = [];
      }
      const doctorSet = new Set((doctors || []).map(a => (a || '').toLowerCase()));
      console.debug('[HospitalService:getPatients] doctors for hospital', doctors);

      // Scan records for patients treated by hospital doctors
      let recordCount = 0;
      try {
        recordCount = Number(await doctorContract.recordCount());
      } catch (err) {
        console.error('[HospitalService:getPatients] recordCount failed', err);
        recordCount = 0;
      }
      console.debug('[HospitalService:getPatients] total recordCount', recordCount);
      const seenPatients = new Map(); // patient => lastRecordTs and lastDoctor
      const scanLimit = Math.min(recordCount, 2000);
      for (let i = recordCount - 1; i >= 0 && (recordCount - 1 - i) < scanLimit; i--) {
        try {
          const rec = await doctorContract.getRecordById(i);
          const d = (rec?.doctorAddress || '').toLowerCase();
          if (!doctorSet.has(d)) continue;
          const p = rec?.patientAddress;
          const ts = Number(rec?.timestamp || 0);
          if (p) {
            const prev = seenPatients.get(p);
            if (!prev || ts > prev.ts) seenPatients.set(p, { ts, doctor: rec?.doctorAddress });
          }
        } catch {}
      }

      const patientAddresses = Array.from(seenPatients.keys());
      console.debug('[HospitalService:getPatients] derived patient addresses', patientAddresses);
      const patients = await Promise.all(patientAddresses.map(async (address) => {
        try {
          const patient = await patientContract.patients(address);
          const meta = seenPatients.get(address) || { ts: 0, doctor: null };
          let assignedDoctorName = '';
          if (meta.doctor) {
            try { const d = await doctorContract.doctors(meta.doctor); assignedDoctorName = d?.name || `${meta.doctor.slice(0,6)}...${meta.doctor.slice(-4)}`; } catch {}
          }
          const recIds = await doctorContract.getPatientRecords(address);
          const totalRecords = Array.isArray(recIds) ? recIds.length : 0;
          return {
            walletAddress: address,
            name: patient.name,
            dateOfBirth: patient.dateOfBirth,
            bloodGroup: patient.bloodGroup,
            registeredDate: Number(patient.registeredDate),
            isActive: patient.isActive,
            totalRecords,
            lastVisitDate: meta.ts ? new Date(meta.ts * 1000).toISOString().split('T')[0] : null,
            assignedDoctorAddress: meta.doctor,
            assignedDoctorName,
          };
        } catch (err) {
          console.error(`Error fetching patient ${address}:`, err);
          return null;
        }
      }));

      const validPatients = patients.filter(p => p !== null);
      console.debug('[HospitalService:getPatients] final patients list', validPatients);
      return { success: true, patients: validPatients, count: validPatients.length };
    } catch (error) {
      console.error('Hospital Service - Get Patients Error:', error);
      throw error;
    }
  }

  /**
   * Lightweight patient summaries for research dashboards.
   * Uses PatientManagement.getAllPatientsSummary and only exposes
   * walletAddress, name, and diseaseType.
   */
  async getPatientsSummary() {
    try {
      const patient = await getPatientContract();
      const raw = await patient.getAllPatientsSummary();
      // raw is an array of structs: { walletAddress, name, diseaseType }
      const summaries = raw.map((p) => ({
        walletAddress: p.walletAddress,
        name: p.name,
        diseases: Array.isArray(p.diseases) ? p.diseases : [],
      }));
      console.debug('[HospitalService:getPatientsSummary] mapped', summaries);
      return summaries;
    } catch (error) {
      console.error('Hospital Service - Get Patients Summary Error:', error);
      throw error;
    }
  }

  async requestAccessToPatient(patientAddress) {
    try {
      await ensureCorrectNetwork();
      const patient = await getPatientContract();
      const tx = await patient.requestAccess(patientAddress);
      const receipt = await sendTx(Promise.resolve(tx));
      return { success: true, receipt };
    } catch (error) {
      console.error('Hospital Service - Request Access Error:', error);
      throw error;
    }
  }

  async getAccessStatus(patientAddress, requesterAddress) {
    try {
      const patient = await getPatientContract();
      const granted = await patient.hasAccess(requesterAddress, patientAddress);
      if (granted) return 'granted';
      let pending = false;
      try { pending = await patient.pendingRequests(patientAddress, requesterAddress); } catch { pending = false; }
      if (pending) return 'pending';
      // Optional: detect recent rejection/cancel for red state by scanning last events
      try {
        const filt = patient.filters.AccessRequestCancelled(patientAddress, requesterAddress);
        const logs = await patient.queryFilter(filt, -5000);
        if (logs && logs.length > 0) return 'rejected';
      } catch {}
      return 'none';
    } catch (e) {
      return 'none';
    }
  }

  /**
   * Get recent activity for the hospital based on on-chain data
   * @returns {Promise<Object>} activity and stats
   */
  async getRecentActivity(limit = 20) {
    try {
      const doctorsResp = await this.getDoctors();
      const doctorList = Array.isArray(doctorsResp.doctors) ? doctorsResp.doctors : [];
      const doctorAddrs = new Set(doctorList.map(d => (d.walletAddress || d.address || '').toLowerCase()));

      if (typeof getDoctorContract !== 'function') {
        throw new Error('Contract helper missing: getDoctorContract. Please reload the app or check contract setup.');
      }
      const doctorContract = await getDoctorContract();
      let recordCount = 0;
      try {
        const rc = await doctorContract.recordCount();
        recordCount = Number(rc);
      } catch {
        recordCount = 0;
      }

      const recentRecords = [];
      const maxToScan = Math.min(limit * 3, Math.max(recordCount, 0));
      for (let i = recordCount - 1; i >= 0 && recentRecords.length < limit && (recordCount - i) <= maxToScan; i--) {
        try {
          const rec = await doctorContract.getRecordById(i);
          const doctorAddr = (rec?.doctorAddress || '').toLowerCase();
          if (doctorAddrs.has(doctorAddr)) {
            recentRecords.push({
              id: i,
              patientAddress: rec.patientAddress,
              doctorAddress: rec.doctorAddress,
              diagnosis: rec.diagnosis,
              timestamp: Number(rec.timestamp),
              date: new Date(Number(rec.timestamp) * 1000).toISOString(),
            });
          }
        } catch (e) {
        }
      }

      const activities = [];
      doctorList.forEach(d => {
        activities.push({
          type: 'doctor_registered',
          doctor: {
            walletAddress: d.walletAddress,
            name: d.name,
            specialization: d.specialization,
            licenseNumber: d.licenseNumber,
            timestamp: Number(d.timestamp) || 0,
            isActive: d.isActive,
          },
          message: `Doctor registered: ${d.name || (d.walletAddress ? d.walletAddress.slice(0,6)+'...'+d.walletAddress.slice(-4) : 'Unknown')}`,
          timestamp: Number(d.timestamp) || Date.now()/1000,
        });
      });
      for (const r of recentRecords) {
        let doc = null;
        try {
          if (r.doctorAddress) {
            const d = await doctorContract.doctors(r.doctorAddress);
            doc = {
              walletAddress: r.doctorAddress,
              name: d?.name || '',
              specialization: d?.specialization || '',
              licenseNumber: d?.licenseNumber || '',
              timestamp: Number(d?.timestamp || 0),
              isActive: d?.isActive,
            };
          }
        } catch {}
        activities.push({
          type: 'record_created',
          doctor: doc,
          message: `New medical record for ${r.patientAddress.slice(0,6)}...${r.patientAddress.slice(-4)}`,
          timestamp: r.timestamp,
        });
      }
      activities.sort((a,b) => b.timestamp - a.timestamp);

      const stats = {
        totalDoctors: doctorList.length,
        totalPatients: (await this.getPatients()).count,
        totalRecords: recentRecords.length,
      };

      return { success: true, activities, recentRecords, stats };
    } catch (error) {
      console.error('Hospital Service - Recent Activity Error:', error);
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
      if (typeof getDoctorContract !== 'function') {
        throw new Error('Contract helper missing: getDoctorContract. Please reload the app or check contract setup.');
      }
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

  /**
   * Get full doctor profile with real-time stats
   * @param {string} address
   * @returns {Promise<Object>}
   */
  async getDoctorDetailsWithStats(address, maxScan = 500) {
    try {
      if (!address || !address.startsWith('0x')) {
        throw new Error('Invalid doctor address');
      }
      if (typeof getDoctorContract !== 'function') {
        throw new Error('Contract helper missing: getDoctorContract. Please reload the app or check contract setup.');
      }
      const doctorContract = await getDoctorContract();
      const prof = await doctorContract.doctors(address);

      let recordCount = 0;
      try {
        const rc = await doctorContract.recordCount();
        recordCount = Number(rc) || 0;
      } catch {
        recordCount = 0;
      }

      const target = address.toLowerCase();
      const uniquePatients = new Set();
      let recordsCreated = 0;
      let prescriptionsCount = 0;
      let lastRecordAt = 0;

      const scanLimit = Math.max(0, Math.min(maxScan, recordCount));
      for (let i = recordCount - 1; i >= 0 && (recordCount - 1 - i) < scanLimit; i--) {
        try {
          const rec = await doctorContract.getRecordById(i);
          const docAddr = (rec?.doctorAddress || '').toLowerCase();
          if (docAddr === target) {
            recordsCreated += 1;
            if ((rec?.prescription || '').trim().length > 0) prescriptionsCount += 1;
            uniquePatients.add(rec.patientAddress);
            const ts = Number(rec?.timestamp || 0);
            if (ts > lastRecordAt) lastRecordAt = ts;
          }
        } catch {
        }
      }

      return {
        success: true,
        doctor: {
          walletAddress: address,
          name: prof?.name || '',
          specialization: prof?.specialization || '',
          licenseNumber: prof?.licenseNumber || '',
          hospitalAddress: prof?.hospitalAddress,
          isActive: prof?.isActive,
          timestamp: Number(prof?.timestamp || 0)
        },
        stats: {
          patientsCount: uniquePatients.size,
          recordsCount: recordsCreated,
          prescriptionsCount,
          lastRecordAt
        }
      };
    } catch (error) {
      console.error('Hospital Service - Doctor Details With Stats Error:', error);
      throw error;
    }
  }

  /**
   * Count total medical records authored by doctors registered under the current hospital
   */
  async countHospitalRecords(maxScan = 5000) {
    const doctorsResp = await this.getDoctors();
    const doctorAddrs = new Set((doctorsResp?.doctors || []).map(d => (d.walletAddress || d.address || '').toLowerCase()));
    if (typeof getDoctorContract !== 'function') {
      throw new Error('Contract helper missing: getDoctorContract. Please reload the app or check contract setup.');
    }
    const doctorContract = await getDoctorContract();
    let recordCount = 0;
    try { recordCount = Number(await doctorContract.recordCount()); } catch { recordCount = 0; }
    let total = 0;
    const scanLimit = Math.max(0, Math.min(maxScan, recordCount));
    for (let i = recordCount - 1; i >= 0 && (recordCount - 1 - i) < scanLimit; i--) {
      try {
        const rec = await doctorContract.getRecordById(i);
        const d = (rec?.doctorAddress || '').toLowerCase();
        if (doctorAddrs.has(d)) total += 1;
      } catch {}
    }
    return total;
  }

  /**
   * Get live hospital metrics for analytics and dashboard
   */
  async getHospitalMetrics() {
    const doctorsResp = await this.getDoctors();
    const patientsResp = await this.getPatients();
    const totalRecords = await this.countHospitalRecords();
    // Access request stats (lightweight heuristic)
    let granted = 0, pending = 0, rejected = 0;
    const { getSigner } = await import('../utils/web3');
    const signer = await getSigner();
    const hospitalAddr = await signer.getAddress();
    for (const p of (patientsResp?.patients || []).slice(0, 200)) {
      try {
        const s = await this.getAccessStatus(p.walletAddress, hospitalAddr);
        if (s === 'granted') granted++; else if (s === 'pending') pending++; else if (s === 'rejected') rejected++;
      } catch {}
    }
    return {
      doctors: (doctorsResp?.doctors || []).length,
      patients: patientsResp?.count || 0,
      records: totalRecords,
      access: { granted, pending, rejected }
    };
  }
}

// Export singleton instance
export default new HospitalService();

// Named exports for backward compatibility
export const registerDoctor = (doctorAddress, licenseNumber) => 
  new HospitalService().registerDoctor(doctorAddress, licenseNumber);

export const getDoctors = () => new HospitalService().getDoctors();
