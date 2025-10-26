import React, { useState, useEffect } from 'react';
import { 
  HeartIcon, 
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  KeyIcon,
  PlusIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ShareIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import DashboardLayout from '../components/layout/DashboardLayout';
import { mockUsers, mockMedicalRecords, mockNotifications, mockStats } from '../data/mockData';

const PatientDashboard = () => {
  const [userProfile, setUserProfile] = useState(mockUsers.patient);
  const [walletAddress, setWalletAddress] = useState(mockUsers.patient.walletAddress);
  const [networkStatus, setNetworkStatus] = useState('connected');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Load user data from blockchain
    // This is mock data for demonstration
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        // TODO: Fetch user data from blockchain contract
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        setUserProfile(mockUsers.patient);
        setWalletAddress(mockUsers.patient.walletAddress);
        setNetworkStatus('connected');
      } catch (error) {
        console.error('Failed to load user data:', error);
        setNetworkStatus('disconnected');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const stats = [
    {
      name: 'Medical Records',
      value: mockStats.patient.totalRecords.toString(),
      change: `+${Math.floor(Math.random() * 5)} this month`,
      icon: DocumentTextIcon,
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/20'
    },
    {
      name: 'Active Prescriptions',
      value: mockStats.patient.activePrescriptions.toString(),
      change: `${Math.floor(Math.random() * 3)} expiring soon`,
      icon: ClipboardDocumentListIcon,
      color: 'text-success-600 dark:text-success-400',
      bgColor: 'bg-success-100 dark:bg-success-900/20'
    },
    {
      name: 'Upcoming Appointments',
      value: mockStats.patient.upcomingAppointments.toString(),
      change: 'Next: Tomorrow',
      icon: CalendarIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      name: 'Access Granted',
      value: '5',
      change: 'Healthcare providers',
      icon: KeyIcon,
      color: 'text-warning-600 dark:text-warning-400',
      bgColor: 'bg-warning-100 dark:bg-warning-900/20'
    }
  ];

  const recentRecords = [
    {
      id: 1,
      doctor: 'Dr. Sarah Johnson',
      date: '2024-01-15',
      type: 'Cardiology Consultation',
      status: 'completed',
      hospital: 'City General Hospital'
    },
    {
      id: 2,
      doctor: 'Dr. Mike Wilson',
      date: '2024-01-10',
      type: 'General Check-up',
      status: 'completed',
      hospital: 'City General Hospital'
    },
    {
      id: 3,
      doctor: 'Dr. Lisa Brown',
      date: '2024-01-05',
      type: 'Dermatology Visit',
      status: 'pending',
      hospital: 'Skin Care Clinic'
    }
  ];

  const activePrescriptions = [
    {
      id: 1,
      medication: 'Lisinopril 10mg',
      doctor: 'Dr. Sarah Johnson',
      startDate: '2024-01-01',
      endDate: '2024-02-01',
      status: 'active'
    },
    {
      id: 2,
      medication: 'Metformin 500mg',
      doctor: 'Dr. Mike Wilson',
      startDate: '2023-12-15',
      endDate: '2024-01-15',
      status: 'expiring'
    }
  ];

  const accessRequests = [
    {
      id: 1,
      provider: 'City General Hospital',
      requestedBy: 'Dr. Sarah Johnson',
      date: '2024-01-14',
      status: 'pending'
    },
    {
      id: 2,
      provider: 'Emergency Services',
      requestedBy: 'Emergency Team',
      date: '2024-01-12',
      status: 'granted'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <HeartIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Loading Your Dashboard
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Fetching your medical records from blockchain...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      userRole="patient" 
      userProfile={userProfile}
      walletAddress={walletAddress}
      networkStatus={networkStatus}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {userProfile.firstName}!</h1>
              <p className="mt-2 text-primary-100">
                Access your secure medical records and manage your health data
              </p>
              <div className="mt-3 text-sm text-primary-100">
                Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <HeartIcon className="h-12 w-12" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.name} className="bg-white dark:bg-slate-800 rounded-xl shadow-soft border border-slate-200 dark:border-slate-700 p-6 hover:shadow-medium transition-all duration-300">
                <div className="flex items-center">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.name}</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{stat.change}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <button className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-medium text-gray-900">View Medical History</h3>
                    <p className="text-sm text-gray-500">Browse your complete medical records</p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-medium text-gray-900">View Prescriptions</h3>
                    <p className="text-sm text-gray-500">Check your current medications</p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <KeyIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-medium text-gray-900">Manage Access</h3>
                    <p className="text-sm text-gray-500">Control who can access your records</p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Access Requests */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Access Requests</h2>
            </div>
            <div className="p-6">
              {accessRequests.length > 0 ? (
                <div className="space-y-4">
                  {accessRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{request.provider}</p>
                          <p className="text-sm text-gray-500">Requested by {request.requestedBy}</p>
                          <p className="text-xs text-gray-400">{request.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'granted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
                  <p className="mt-1 text-sm text-gray-500">All access requests have been processed</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Medical Records */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Medical Records</h2>
          </div>
          <div className="p-6">
            {recentRecords.length > 0 ? (
              <div className="space-y-4">
                {recentRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-4" />
                      <div>
                        <p className="font-medium text-gray-900">{record.doctor}</p>
                        <p className="text-sm text-gray-500">{record.type}</p>
                        <p className="text-xs text-gray-400">{record.hospital} • {record.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No medical records yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your medical records will appear here once your doctors create them.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Active Prescriptions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Prescriptions</h2>
          </div>
          <div className="p-6">
            {activePrescriptions.length > 0 ? (
              <div className="space-y-4">
                {activePrescriptions.map((prescription) => (
                  <div key={prescription.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <ClipboardDocumentListIcon className="h-8 w-8 text-green-500 mr-4" />
                      <div>
                        <p className="font-medium text-gray-900">{prescription.medication}</p>
                        <p className="text-sm text-gray-500">Prescribed by {prescription.doctor}</p>
                        <p className="text-xs text-gray-400">
                          {prescription.startDate} - {prescription.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        prescription.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {prescription.status}
                      </span>
                      {prescription.status === 'expiring' && (
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active prescriptions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your prescriptions will appear here when prescribed by your doctors.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
