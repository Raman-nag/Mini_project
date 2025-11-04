// Centralized contract and IPFS configuration
// NOTE: Replace placeholder addresses with your deployed addresses.
// ABIs are imported from compiled artifacts (expected in backend/artifacts or similar).

// ABIs start empty; after deployment, you can copy JSON ABIs into the frontend
// or load them via a separate build step. Leaving them empty prevents runtime
// bundling errors during initial development when artifacts may not exist.
const EMRSystemABI = [];
const DoctorManagementABI = [];
const HospitalManagementABI = [];
const PatientManagementABI = [];

export const CONTRACT_ADDRESSES = {
  // Replace with real deployed addresses per network
  localhost: {
    EMRSystem: import.meta.env.VITE_EMR_SYSTEM_ADDRESS || '0x0000000000000000000000000000000000000000',
    DoctorManagement: import.meta.env.VITE_DOCTOR_MGMT_ADDRESS || '0x0000000000000000000000000000000000000000',
    HospitalManagement: import.meta.env.VITE_HOSPITAL_MGMT_ADDRESS || '0x0000000000000000000000000000000000',
    PatientManagement: import.meta.env.VITE_PATIENT_MGMT_ADDRESS || '0x0000000000000000000000000000000000000000',
  },
};

export const CONTRACT_ABIS = {
  EMRSystem: EMRSystemABI,
  DoctorManagement: DoctorManagementABI,
  HospitalManagement: HospitalManagementABI,
  PatientManagement: PatientManagementABI,
};

export const NETWORKS = {
  localhost: {
    chainIdHex: '0x539', // 1337
    chainId: 1337,
    name: 'Localhost 8545',
    rpcUrl: import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545',
    blockExplorer: import.meta.env.VITE_BLOCK_EXPLORER || '',
  },
};

export const DEFAULT_NETWORK_KEY = import.meta.env.VITE_NETWORK_KEY || 'localhost';

export const IPFS_CONFIG = {
  pinataEndpoint: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
  gateway: import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/',
  pinataApiKey: import.meta.env.VITE_PINATA_API_KEY || '',
  pinataSecretApiKey: import.meta.env.VITE_PINATA_SECRET_API_KEY || '',
  maxFileSizeMb: 50,
  allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'application/dicom'],
};

export default {
  CONTRACT_ADDRESSES,
  CONTRACT_ABIS,
  NETWORKS,
  DEFAULT_NETWORK_KEY,
  IPFS_CONFIG,
};


