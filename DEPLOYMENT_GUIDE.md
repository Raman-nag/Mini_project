# Deployment Guide - Real Blockchain Integration

## Step 1: Deploy Contracts to Localhost

1. **Start Hardhat Node:**
   ```bash
   cd backend
   npx.cmd hardhat node
   ```
   Keep this terminal open - it runs the local blockchain.

2. **In a NEW terminal, compile contracts:**
   ```bash
   cd backend
   npx.cmd hardhat compile
   ```

3. **Deploy contracts:**
   ```bash
   cd backend
   npx.cmd hardhat run scripts/deploy.js --network localhost
   ```

4. **Copy the deployed addresses** from the output. You'll need:
   - DoctorManagement address
   - PatientManagement address
   - HospitalManagement address
   - EMRSystem address

## Step 2: Update Contract Configuration

1. **Create/Update `.env` file in frontend directory:**
   ```env
   VITE_DOCTOR_MGMT_ADDRESS=<deployed_address>
   VITE_PATIENT_MGMT_ADDRESS=<deployed_address>
   VITE_HOSPITAL_MGMT_ADDRESS=<deployed_address>
   VITE_EMR_SYSTEM_ADDRESS=<deployed_address>
   VITE_RPC_URL=http://127.0.0.1:8545
   VITE_NETWORK_KEY=localhost
   
   # IPFS Configuration (Optional - for file uploads)
   VITE_PINATA_API_KEY=your_pinata_api_key
   VITE_PINATA_SECRET_API_KEY=your_pinata_secret_key
   VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
   ```

2. **Copy ABIs to frontend:**
   The deployment script should automatically copy ABIs to `frontend/src/config/abis/`
   If not, manually copy:
   - `backend/artifacts/contracts/DoctorManagement.sol/DoctorManagement.json` → `frontend/src/config/abis/DoctorManagement.json`
   - `backend/artifacts/contracts/PatientManagement.sol/PatientManagement.json` → `frontend/src/config/abis/PatientManagement.json`
   - `backend/artifacts/contracts/HospitalManagement.sol/HospitalManagement.json` → `frontend/src/config/abis/HospitalManagement.json`
   - `backend/artifacts/contracts/EMRSystem.sol/EMRSystem.json` → `frontend/src/config/abis/EMRSystem.json`

3. **Update `frontend/src/config/contractConfig.js`** to load ABIs:
   ```javascript
   import DoctorManagementABI from './abis/DoctorManagement.json';
   import PatientManagementABI from './abis/PatientManagement.json';
   import HospitalManagementABI from './abis/HospitalManagement.json';
   import EMRSystemABI from './abis/EMRSystem.json';
   ```

## Step 3: Test Registration Flow

1. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Connect MetaMask:**
   - Add Hardhat network (Chain ID: 1337, RPC: http://127.0.0.1:8545)
   - Import one of the Hardhat accounts (private keys are in the Hardhat node output)

3. **Register as Hospital:**
   - Use account #0 (first Hardhat account)
   - Go to Register page
   - Select "Hospital"
   - Fill in hospital name and registration number
   - Connect wallet and submit

4. **Register as Doctor:**
   - Use account #1 (second Hardhat account)  
   - Hospital admin (account #0) must add doctor first via Hospital Dashboard
   - Doctor then updates their profile

5. **Register as Patient:**
   - Use account #2 (third Hardhat account)
   - Go to Register page
   - Select "Patient"
   - Fill in name, DOB, blood group
   - Connect wallet and submit

## Step 4: Test Features

1. **Create Medical Record:**
   - Doctor (account #1) creates record for Patient (account #2)
   - Upload files (they'll be saved to IPFS)
   - Record is stored on blockchain

2. **Access Control:**
   - Doctor (account #3) tries to view Patient (account #2) records
   - Should be denied
   - Patient grants access to Doctor #3
   - Doctor #3 can now view records

## Troubleshooting

- **"Contract not deployed"**: Check contract addresses in .env file
- **"ABI not loaded"**: Ensure ABIs are copied to frontend/src/config/abis/
- **"Transaction failed"**: Check Hardhat node is running and has enough ETH
- **"IPFS upload failed"**: Check Pinata API keys are set (or skip file upload for testing)


