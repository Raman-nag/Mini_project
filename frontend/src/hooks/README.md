# Custom Hooks

This directory contains custom React hooks for the Multimedia EHR application.

## Available Hooks

### 1. useWeb3.js
Wrapper hook for Web3 wallet connection and blockchain interactions.

**Usage:**
```jsx
import { useWeb3 } from '../hooks/useWeb3';

function WalletComponent() {
  const { 
    isConnected, 
    account, 
    connectWallet, 
    disconnectWallet,
    shortAddress 
  } = useWeb3();
  
  if (isConnected) {
    return <div>Connected: {shortAddress}</div>;
  }
  
  return <button onClick={connectWallet}>Connect Wallet</button>;
}
```

**Returns:**
- State: `isConnected`, `account`, `networkId`, `chainId`, `networkName`, `isConnecting`, `error`, `contracts`
- Computed: `shortAddress`, `isSupportedNetwork`
- Functions: `connectWallet()`, `disconnectWallet()`, `switchNetwork(chainId)`, `getContract(name)`, `clearError()`

### 2. useAuth.js
Wrapper hook for authentication and user management.

**Usage:**
```jsx
import { useAuth } from '../hooks/useAuth';

function UserProfile() {
  const { isAuthenticated, userProfile, logout, displayName } = useAuth();
  
  if (!isAuthenticated) return <div>Please login</div>;
  
  return (
    <div>
      <h1>Welcome, {displayName}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Returns:**
- State: `isAuthenticated`, `isLoading`, `user`, `userRole`, `userProfile`, `token`, `error`
- Computed: `isPatient`, `isDoctor`, `isHospital`, `displayName`, `avatar`
- Functions: `login()`, `logout()`, `updateProfile()`, `hasRole()`, `checkAuth()`, `clearError()`

### 3. useContract.js
Custom hook for blockchain contract interactions with mock data.

**Usage:**
```jsx
import { useContract } from '../hooks/useContract';

function ContractComponent() {
  const { isLoading, error, transactionHash, callContract } = useContract('EMRSystem');
  
  const handleCreateRecord = async () => {
    try {
      const result = await callContract('createRecord', [
        'pat_001',
        'Hypertension',
        'Treatment details'
      ]);
      console.log('Record created:', result);
    } catch (err) {
      console.error('Error:', err);
    }
  };
  
  return (
    <div>
      <button onClick={handleCreateRecord} disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Record'}
      </button>
      {transactionHash && <p>TX: {transactionHash}</p>}
    </div>
  );
}
```

**Parameters:**
- `contractName` (optional): Name of the contract (default: 'EMRSystem')

**Returns:**
- State: `isLoading`, `error`, `transactionHash`
- Functions: `callContract(method, params)`, `listenToEvent(event, callback)`, `clearError()`

**Supported Contracts:**
- `EMRSystem` - Medical records management
- `PatientManagement` - Patient registration and management
- `DoctorManagement` - Doctor verification and management
- `HospitalManagement` - Hospital registration

**Mock Methods:**
- `getPatientRecord` - Get patient medical record
- `createRecord` - Create new medical record
- `grantAccess` - Grant access to records
- `registerPatient` - Register new patient
- `verifyDoctor` - Verify doctor credentials
- `registerHospital` - Register new hospital

### 4. useIPFS.js
Custom hook for IPFS file operations with simulated upload/retrieval.

**Usage:**
```jsx
import { useIPFS } from '../hooks/useIPFS';

function FileUploadComponent() {
  const { 
    isUploading, 
    uploadProgress, 
    error, 
    uploadFile, 
    getGatewayURL 
  } = useIPFS();
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const hash = await uploadFile(file);
      const url = getGatewayURL(hash);
      console.log('File uploaded:', url);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileUpload} disabled={isUploading} />
      {isUploading && (
        <div>
          <p>Uploading... {uploadProgress}%</p>
        </div>
      )}
    </div>
  );
}
```

**Returns:**
- State: `isUploading`, `isRetrieving`, `uploadProgress`, `error`, `lastUploadHash`
- Functions:
  - `uploadFile(file, options)` - Upload single file
  - `uploadMultipleFiles(files)` - Upload multiple files
  - `retrieveFile(hash)` - Retrieve file from IPFS
  - `getGatewayURL(hash)` - Get IPFS gateway URL
  - `pinFile(hash)` - Pin file to IPFS
  - `unpinFile(hash)` - Unpin file from IPFS
  - `getFileInfo(hash)` - Get file information
  - `clearError()` - Clear error state

## Mock Implementation

All hooks currently use mock implementations for development:

### useContract
- Simulates contract calls with `setTimeout`
- Returns mock data based on contract and method name
- Generates mock transaction hashes
- Simulates event emission

### useIPFS
- Simulates file upload with progress bar
- Generates mock IPFS hashes (Qm...)
- Simulates file retrieval with delays
- Returns mock file content

## Production TODO

### useContract
1. Integrate with ethers.js for actual contract calls
2. Implement event listeners for real blockchain events
3. Add transaction status tracking
4. Implement gas estimation and optimization

### useIPFS
1. Integrate with ipfs-http-client for actual IPFS operations
2. Implement real file upload to IPFS network
3. Add IPFS gateway integration
4. Implement file pinning to ensure persistence

## Usage Best Practices

1. **Always handle loading states:**
```jsx
const { isLoading, error } = useContract();
if (isLoading) return <Loader />;
if (error) return <Alert type="error">{error}</Alert>;
```

2. **Use error handling:**
```jsx
try {
  const result = await callContract('method', [params]);
} catch (err) {
  console.error('Contract error:', err);
  // Show user-friendly error message
}
```

3. **Check authentication before contract calls:**
```jsx
const { isAuthenticated } = useAuth();
const { callContract } = useContract();

const handleAction = async () => {
  if (!isAuthenticated) {
    alert('Please login first');
    return;
  }
  await callContract('method', [params]);
};
```

4. **Use progress tracking for file uploads:**
```jsx
const { uploadProgress, isUploading } = useIPFS();

return (
  <div>
    <input type="file" onChange={handleUpload} />
    {isUploading && <ProgressBar value={uploadProgress} />}
  </div>
);
```
