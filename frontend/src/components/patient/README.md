# Patient Dashboard Components

## Overview
The Patient Dashboard provides patients with comprehensive access to their medical records, prescriptions, and access management features.

## Components

### 1. PatientDashboard.jsx (Main Dashboard)
- **Location**: `frontend/src/pages/PatientDashboard.jsx`
- **Features**:
  - Welcome section with user info and wallet address
  - Overview cards showing statistics (Total Records, Active Prescriptions, etc.)
  - Quick action buttons
  - Recent medical records list
  - Active prescriptions overview

### 2. MedicalHistory.jsx
- **Location**: `frontend/src/components/patient/MedicalHistory.jsx`
- **Features**:
  - Chronological timeline view of all medical records
  - Visual timeline with status indicators
  - Doctor and hospital attribution
  - Detailed record modal with full information
  - Empty state with illustration

### 3. Prescriptions.jsx
- **Location**: `frontend/src/components/patient/Prescriptions.jsx`
- **Features**:
  - All prescriptions listing
  - Medication details (name, dosage, frequency, instructions)
  - Prescription status indicators
  - Download prescription button (ready for IPFS integration)
  - Empty state with illustration

### 4. GrantAccess.jsx
- **Location**: `frontend/src/components/patient/GrantAccess.jsx`
- **Features**:
  - Manage third-party access to medical records
  - Grant access modal with form validation
  - Revoke access with confirmation modal
  - Access list showing providers, type, expiration
  - Blockchain-ready for access control integration

## Mock Data Structure

The mock data includes:
- **mockHospitals**: Hospital information with wallet addresses
- **mockDoctors**: Doctor profiles with specialties and hospital associations
- **mockPatients**: Patient information with wallet addresses
- **mockMedicalRecords**: Medical records with diagnoses, symptoms, treatments
- **mockPrescriptions**: Prescriptions with medication details

## TODO: Blockchain Integration

All components include `// TODO:` comments marking where blockchain integration is needed:
- Replace mock data with smart contract calls
- Implement IPFS document upload/download
- Add transaction hash recording
- Integrate access control smart contracts

## Design Requirements Met

✅ Overview cards with gradient design
✅ Medical history timeline (chronological)
✅ All prescriptions section with download button
✅ View detailed record modal
✅ Grant access section
✅ Empty states with illustrations ("No records yet")
✅ Skeleton loaders
✅ Confirmation modals for destructive actions
✅ Beautiful and professional design
