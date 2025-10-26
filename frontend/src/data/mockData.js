// Mock data for the Multimedia EHR application
// TODO: Replace with actual blockchain data when integration is complete

export const mockUsers = {
  hospital: {
    id: 'hosp_001',
    name: 'City General Hospital',
    email: 'admin@citygeneral.com',
    address: '123 Medical Center Dr, City, State 12345',
    phone: '+1 (555) 123-4567',
    licenseNumber: 'HOSP-2024-001',
    // TODO: Add blockchain wallet address
    walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    // TODO: Add IPFS hash for hospital documents
    documentsHash: 'QmHash123...',
    totalDoctors: 156,
    totalPatients: 2543,
    totalRecords: 8921,
    establishedYear: 1985
  },
  doctor: {
    id: 'doc_001',
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@citygeneral.com',
    phone: '+1 (555) 234-5678',
    specialty: 'Cardiology',
    licenseNumber: 'MD-2024-001',
    // TODO: Add blockchain wallet address
    walletAddress: '0x8ba1f109551bD432803012645Hac136c',
    // TODO: Add IPFS hash for doctor credentials
    credentialsHash: 'QmHash456...',
    hospitalId: 'hosp_001',
    totalPatients: 89,
    totalRecords: 234,
    experience: 12,
    rating: 4.9
  },
  patient: {
    id: 'pat_001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 345-6789',
    dateOfBirth: '1985-03-15',
    gender: 'Male',
    bloodType: 'O+',
    // TODO: Add blockchain wallet address
    walletAddress: '0x9ba1f109551bD432803012645Hac136c',
    // TODO: Add IPFS hash for patient documents
    documentsHash: 'QmHash789...',
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1 (555) 456-7890'
    },
    totalRecords: 15,
    lastVisit: '2024-03-10'
  }
};

export const mockMedicalRecords = [
  {
    id: 'rec_001',
    patientId: 'pat_001',
    doctorId: 'doc_001',
    hospitalId: 'hosp_001',
    date: '2024-03-15',
    type: 'Consultation',
    diagnosis: 'Hypertension',
    symptoms: ['High blood pressure', 'Headaches', 'Dizziness'],
    treatment: 'Prescribed medication and lifestyle changes',
    // TODO: Add blockchain transaction hash
    txHash: '0x1234567890abcdef...',
    // TODO: Add IPFS hash for detailed records
    ipfsHash: 'QmDetailedRecord123...',
    status: 'Active',
    prescription: {
      medications: [
        { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
        { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' }
      ]
    }
  }
];

export const mockNotifications = [
  {
    id: 'notif_001',
    userId: 'pat_001',
    title: 'New Medical Record',
    message: 'Dr. Johnson has created a new record for your recent visit',
    type: 'info',
    timestamp: '2024-03-15T10:30:00Z',
    read: false
  }
];

export const mockStats = {
  hospital: {
    totalPatients: 2543,
    totalDoctors: 156,
    totalRecords: 8921,
    monthlyGrowth: 12.5,
    successRate: 98.5
  },
  doctor: {
    totalPatients: 89,
    totalRecords: 234,
    monthlyGrowth: 8.2,
    averageRating: 4.9
  },
  patient: {
    totalRecords: 15,
    lastVisit: '2024-03-10',
    upcomingAppointments: 2,
    activePrescriptions: 3
  }
};

