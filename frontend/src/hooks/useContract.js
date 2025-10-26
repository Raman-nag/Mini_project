import { useState, useCallback } from 'react';

/**
 * Custom hook for blockchain contract interactions
 * Returns mock data for development
 * 
 * @param {string} contractName - Name of the contract
 * @returns {Object} Contract interaction functions and state
 */
export const useContract = (contractName = 'EMRSystem') => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);

  // Mock contract method call
  const callContract = useCallback(async (methodName, params = []) => {
    setIsLoading(true);
    setError(null);
    setTransactionHash(null);

    try {
      // TODO: Replace with actual contract call
      // Simulate contract call with setTimeout
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate mock transaction hash
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

      setTransactionHash(mockTxHash);

      // Return mock data based on method
      const mockData = getMockData(contractName, methodName, params);
      
      console.log(`[Mock] Contract: ${contractName}, Method: ${methodName}`, {
        params,
        result: mockData,
        txHash: mockTxHash
      });

      return mockData;

    } catch (err) {
      console.error('Contract call error:', err);
      setError(err.message || 'Contract call failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contractName]);

  // Mock contract event listener
  const listenToEvent = useCallback(async (eventName, callback) => {
    try {
      // TODO: Replace with actual event listener
      console.log(`[Mock] Listening to event: ${eventName} on ${contractName}`);
      
      // Simulate event emission after 2 seconds
      setTimeout(() => {
        const mockEvent = getMockEvent(contractName, eventName);
        callback(mockEvent);
      }, 2000);

    } catch (err) {
      console.error('Event listener error:', err);
      setError(err.message || 'Failed to listen to event');
    }
  }, [contractName]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    transactionHash,
    callContract,
    listenToEvent,
    clearError,
  };
};

/**
 * Get mock data based on contract and method name
 * TODO: Replace with actual contract data
 */
const getMockData = (contractName, methodName, params) => {
  // Mock data for different contracts and methods
  const mockData = {
    EMRSystem: {
      getPatientRecord: {
        id: 'rec_001',
        patientId: 'pat_001',
        diagnosis: 'Hypertension',
        date: '2024-03-15',
        status: 'Active'
      },
      createRecord: {
        success: true,
        recordId: 'rec_new_001',
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`
      },
      grantAccess: {
        success: true,
        accessId: 'acc_001'
      }
    },
    PatientManagement: {
      getPatientInfo: {
        id: 'pat_001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        walletAddress: '0x9ba1f109551bD432803012645Hac136c'
      },
      registerPatient: {
        success: true,
        patientId: 'pat_new_001'
      }
    },
    DoctorManagement: {
      getDoctorInfo: {
        id: 'doc_001',
        firstName: 'Dr. Sarah',
        lastName: 'Johnson',
        specialty: 'Cardiology',
        hospitalId: 'hosp_001'
      },
      verifyDoctor: {
        verified: true,
        timestamp: Date.now()
      }
    },
    HospitalManagement: {
      getHospitalInfo: {
        id: 'hosp_001',
        name: 'City General Hospital',
        address: '123 Medical Center Dr',
        licenseNumber: 'HOSP-2024-001'
      },
      registerHospital: {
        success: true,
        hospitalId: 'hosp_new_001'
      }
    }
  };

  return mockData[contractName]?.[methodName] || { success: true, data: 'Mock data' };
};

/**
 * Get mock event data
 */
const getMockEvent = (contractName, eventName) => {
  return {
    contract: contractName,
    event: eventName,
    args: {
      from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      to: '0x9ba1f109551bD432803012645Hac136c',
      value: '0',
    },
    blockNumber: Math.floor(Math.random() * 1000000),
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    timestamp: Date.now()
  };
};

export default useContract;
