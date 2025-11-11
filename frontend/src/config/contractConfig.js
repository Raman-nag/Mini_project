// Centralized contract and IPFS configuration

// Import ABI files directly as modules
import DoctorManagementABI from './abis/DoctorManagement.json';
import PatientManagementABI from './abis/PatientManagement.json';
import HospitalManagementABI from './abis/HospitalManagement.json';
import EMRSystemABI from './abis/EMRSystem.json';

// Log ABIs loaded
console.log('[ContractConfig] ABIs imported:', {
  DoctorManagement: Array.isArray(DoctorManagementABI) && DoctorManagementABI.length > 0,
  PatientManagement: Array.isArray(PatientManagementABI) && PatientManagementABI.length > 0,
  HospitalManagement: Array.isArray(HospitalManagementABI) && HospitalManagementABI.length > 0,
  EMRSystem: Array.isArray(EMRSystemABI) && EMRSystemABI.length > 0,
});

// Use environment variables for addresses or fallback to deployed addresses
const envAddr = {
  EMRSystem: import.meta.env.VITE_EMR_SYSTEM_ADDRESS || '',
  DoctorManagement: import.meta.env.VITE_DOCTOR_MANAGEMENT_ADDRESS || '',
  HospitalManagement: import.meta.env.VITE_HOSPITAL_MANAGEMENT_ADDRESS || '',
  PatientManagement: import.meta.env.VITE_PATIENT_MANAGEMENT_ADDRESS || '',
};

// Updated deployed contract addresses from your Ganache deployment
const deployedAddresses = {
  EMRSystem: '0x300F2F162a5388784b02e17aF8b8fA97Ec899eAB',
  DoctorManagement: '0x64a41250456DcC991381760559D904809996C9c1',
  HospitalManagement: '0x4bB152636F6fE43BD81e220288Cab9abd33701aF',
  PatientManagement: '0xBdA41BF0c9b3553BCc39b443a3dE9AE95938B16C',
};

// Final addresses used by the app - environment overrides deployed if present
const ADDRESSES = {
  EMRSystem: envAddr.EMRSystem || deployedAddresses.EMRSystem,
  DoctorManagement: envAddr.DoctorManagement || deployedAddresses.DoctorManagement,
  HospitalManagement: envAddr.HospitalManagement || deployedAddresses.HospitalManagement,
  PatientManagement: envAddr.PatientManagement || deployedAddresses.PatientManagement,
};

// Export for all supported network keys (chain IDs & network names)
export const CONTRACT_ADDRESSES = {
  localhost: ADDRESSES,
  Localhost: ADDRESSES,
  '31337': ADDRESSES,
  31337: ADDRESSES,
  '1337': ADDRESSES,
  1337: ADDRESSES,
  '0x7A69': ADDRESSES,
  '0x7a69': ADDRESSES,
  '0x539': ADDRESSES,
  '0x0539': ADDRESSES,
  '5777': ADDRESSES,
  5777: ADDRESSES,
  ganache: ADDRESSES,
};

// Export ABIs directly (no async loading needed)
export const CONTRACT_ABIS = {
  EMRSystem: EMRSystemABI,
  DoctorManagement: DoctorManagementABI,
  HospitalManagement: HospitalManagementABI,
  PatientManagement: PatientManagementABI,
};

// Debug logs for addresses and networks loaded
console.log('[ContractConfig] Addresses loaded:', ADDRESSES);
console.log('[ContractConfig] Available network keys:', Object.keys(CONTRACT_ADDRESSES));

export const NETWORKS = {
  localhost: {
    chainIdHex: '0x539',
    chainId: 1337,
    name: 'Ganache 8545',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
  },
};

export const DEFAULT_NETWORK_KEY = 'localhost';

export const IPFS_CONFIG = {
  pinataEndpoint: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
  gateway: 'https://gateway.pinata.cloud/ipfs/',
  pinataApiKey: import.meta.env.VITE_PINATA_API_KEY || '',
  pinataSecretApiKey: import.meta.env.VITE_PINATA_SECRET_API_KEY || '',
  maxFileSizeMb: 50,
  allowedMimeTypes: [
    // Documents
    'application/pdf',
    // Images
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    // Medical imaging
    'application/dicom',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/mpeg',
    'video/quicktime',
  ],
};

export default {
  CONTRACT_ADDRESSES,
  CONTRACT_ABIS,
  NETWORKS,
  DEFAULT_NETWORK_KEY,
  IPFS_CONFIG,
};
