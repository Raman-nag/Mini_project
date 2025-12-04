// Centralized contract and IPFS configuration

// Import ABI files directly as modules
import DoctorManagementABI from './abis/DoctorManagement.json';
import PatientManagementABI from './abis/PatientManagement.json';
import HospitalManagementABI from './abis/HospitalManagement.json';
import EMRSystemABI from './abis/EMRSystem.json';
import InsuranceManagementABI from './abis/InsuranceManagement.json';
import ResearchOrganizationManagementABI from './abis/ResearchOrganizationManagement.json';

// Default network key should be available early
export const DEFAULT_NETWORK_KEY = 'localhost';

// Log ABIs loaded
console.log('[ContractConfig] ABIs imported:', {
  DoctorManagement: Array.isArray(DoctorManagementABI) && DoctorManagementABI.length > 0,
  PatientManagement: Array.isArray(PatientManagementABI) && PatientManagementABI.length > 0,
  HospitalManagement: Array.isArray(HospitalManagementABI) && HospitalManagementABI.length > 0,
  EMRSystem: Array.isArray(EMRSystemABI) && EMRSystemABI.length > 0,
});

// Helper to read from env supporting both long and short variable names
const fromEnv = (primary, ...aliases) => {
  for (const key of [primary, ...aliases]) {
    const v = import.meta.env[key];
    if (v && typeof v === 'string' && v.length > 0) return v;
  }
  return '0x0000000000000000000000000000000000000000';
};

// Load addresses strictly from .env (no hardcoded fallbacks)
const ADDRESSES = {
  EMRSystem: fromEnv('VITE_EMR_SYSTEM_ADDRESS'),
  DoctorManagement: fromEnv('VITE_DOCTOR_MANAGEMENT_ADDRESS'),
  HospitalManagement: fromEnv('VITE_HOSPITAL_MANAGEMENT_ADDRESS'),
  PatientManagement: fromEnv('VITE_PATIENT_MANAGEMENT_ADDRESS'),
  InsuranceManagement: fromEnv('VITE_INSURANCE_MANAGEMENT_ADDRESS'),
  ResearchOrganizationManagement: fromEnv('VITE_RESEARCH_ORG_MANAGEMENT_ADDRESS'),
};

// Constant admin account (should be first Ganache account). Configure via env.
export const ADMIN_ADDRESS = (fromEnv('VITE_ADMIN_ADDRESS') || '').toLowerCase();

// Map common network keys
const NETWORK_KEYS = {
  'localhost': 'localhost',
  'Localhost': 'localhost',
  '1337': 'localhost',
  1337: 'localhost',
  '31337': 'localhost',
  31337: 'localhost',
  '0x539': 'localhost',
  '0x0539': 'localhost',
  '0x7A69': 'localhost',
  '0x7a69': 'localhost',
  'ganache': 'localhost',
  // Add these:
  '5777': 'localhost',
  5777: 'localhost',
  '0x1691': 'localhost', // Hex for 5777
};


// Export for all supported network keys (chain IDs & network names)
export const CONTRACT_ADDRESSES = {};
Object.keys(NETWORK_KEYS).forEach(key => {
  CONTRACT_ADDRESSES[key] = ADDRESSES;
});

// Export ABIs directly (no async loading needed)
export const CONTRACT_ABIS = {
  EMRSystem: EMRSystemABI,
  DoctorManagement: DoctorManagementABI,
  HospitalManagement: HospitalManagementABI,
  PatientManagement: PatientManagementABI,
  InsuranceManagement: InsuranceManagementABI,
  ResearchOrganizationManagement: ResearchOrganizationManagementABI,
};

// Debug logs for addresses and networks loaded
// Detect active network key (best-effort) from MetaMask
export const detectActiveNetworkKey = () => {
  try {
    const eth = typeof window !== 'undefined' ? window.ethereum : undefined;
    const chainId = eth?.chainId;
    if (chainId && CONTRACT_ADDRESSES[chainId]) return chainId;
  } catch {}
  // Fallback to localhost without referencing later-ordered exports
  return 'localhost';
};

const ACTIVE_NETWORK_KEY = detectActiveNetworkKey();
console.log('[ContractConfig] Active network key:', ACTIVE_NETWORK_KEY);
console.log('[ContractConfig] Addresses from env:', ADDRESSES);
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
  ADMIN_ADDRESS,
};
