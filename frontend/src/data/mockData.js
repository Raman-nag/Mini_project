// Mock data for the Multimedia EHR application
// TODO: Replace with actual blockchain data when integration is complete

export const mockHospitals = [
  {
    id: 'hosp_001',
    name: 'City General Hospital',
    email: 'admin@citygeneral.com',
    address: '123 Medical Center Dr',
    phone: '+1 (555) 123-4567',
    walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
  },
  {
    id: 'hosp_002',
    name: 'Regional Medical Center',
    email: 'contact@regionalmedical.com',
    address: '456 Healthcare Ave',
    phone: '+1 (555) 234-5678',
    walletAddress: '0x8ba1f109551bD432803012645Hac136d'
  }
];

export const mockDoctors = [
  {
    id: 'doc_001',
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    specialty: 'Cardiology',
    email: 'sarah.johnson@citygeneral.com',
    hospitalId: 'hosp_001',
    walletAddress: '0x8ba1f109551bD432803012645Hac136c'
  },
  {
    id: 'doc_002',
    firstName: 'Dr. Michael',
    lastName: 'Chen',
    specialty: 'Neurology',
    email: 'michael.chen@citygeneral.com',
    hospitalId: 'hosp_001',
    walletAddress: '0x9da3f309661bE543924123756Ibd247d'
  }
];

export const mockPatients = [
  {
    id: 'pat_001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    dateOfBirth: '1985-03-15',
    walletAddress: '0x9ba1f109551bD432803012645Hac136c'
  },
  {
    id: 'pat_002',
    firstName: 'Mary',
    lastName: 'Smith',
    email: 'mary.smith@email.com',
    dateOfBirth: '1990-07-22',
    walletAddress: '0x0ab2f209671cE654144234978Led259a'
  }
];

export const mockMedicalRecords = [
  {
    id: 'rec_001',
    patientId: 'pat_001',
    doctorId: 'doc_001',
    hospitalId: 'hosp_001',
    date: '2024-03-15',
    diagnosis: 'Hypertension (High Blood Pressure)',
    symptoms: ['Elevated blood pressure (150/95)', 'Headaches', 'Dizziness'],
    treatment: 'Prescribed antihypertensive medication and lifestyle modifications',
    doctorNotes: 'Patient diagnosed with stage 1 hypertension.',
    status: 'Active'
  },
  {
    id: 'rec_002',
    patientId: 'pat_002',
    doctorId: 'doc_002',
    hospitalId: 'hosp_001',
    date: '2024-02-28',
    diagnosis: 'Well Child Check',
    symptoms: ['Normal development'],
    treatment: 'Vaccinations completed',
    doctorNotes: 'Child is healthy and meeting all developmental milestones.',
    status: 'Active'
  }
];

export const mockPrescriptions = [
  {
    id: 'pres_001',
    patientId: 'pat_001',
    doctorId: 'doc_001',
    date: '2024-03-15',
    medications: [
      {
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        instructions: 'Take with or without food.'
      }
    ],
    status: 'Active'
  }
];

export const mockUsers = {
  patient: mockPatients[0],
  doctor: mockDoctors[0],
  hospital: mockHospitals[0]
};

export const mockStats = {
  patient: {
    totalRecords: 15,
    lastVisit: '2024-03-10',
    upcomingAppointments: 2,
    activePrescriptions: 3
  }
};

export const mockNotifications = [];
