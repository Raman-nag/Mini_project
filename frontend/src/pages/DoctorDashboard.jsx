import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  UserIcon, 
  HeartIcon, 
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  PlusIcon,
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const DoctorDashboard = () => {
  // Mock data for demonstration
  const userProfile = {
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    role: 'Cardiologist',
    licenseNumber: 'MD123456'
  };
  
  const walletAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
  const networkStatus = 'connected';

  const stats = [
    {
      name: 'My Patients',
      value: '156',
      change: '+3 this week',
      icon: HeartIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Records Created',
      value: '1,247',
      change: '+12 this month',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Prescriptions',
      value: '892',
      change: '+8 this week',
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Appointments',
      value: '24',
      change: 'Today\'s schedule',
      icon: CalendarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      patient: 'John Doe',
      time: '9:00 AM',
      type: 'Follow-up',
      status: 'confirmed'
    },
    {
      id: 2,
      patient: 'Jane Smith',
      time: '10:30 AM',
      type: 'Consultation',
      status: 'confirmed'
    },
    {
      id: 3,
      patient: 'Mike Johnson',
      time: '2:00 PM',
      type: 'Check-up',
      status: 'pending'
    }
  ];

  const recentRecords = [
    {
      id: 1,
      patient: 'Alice Brown',
      date: '2024-01-15',
      type: 'Cardiology Consultation',
      status: 'completed'
    },
    {
      id: 2,
      patient: 'Bob Wilson',
      date: '2024-01-14',
      type: 'Follow-up Visit',
      status: 'completed'
    },
    {
      id: 3,
      patient: 'Carol Davis',
      date: '2024-01-13',
      type: 'Initial Consultation',
      status: 'pending'
    }
  ];

  return (
    <DashboardLayout 
      userRole="doctor" 
      userProfile={userProfile}
      walletAddress={walletAddress}
      networkStatus={networkStatus}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
              <p className="mt-2 text-green-100">
                Manage your patients and create secure medical records
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <UserIcon className="h-12 w-12" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.change}</p>
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
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <PlusIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-medium text-gray-900">Create New Record</h3>
                    <p className="text-sm text-gray-500">Add a new patient record</p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <HeartIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-medium text-gray-900">View My Patients</h3>
                    <p className="text-sm text-gray-500">Browse patient list</p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </button>

                <button className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-medium text-gray-900">Write Prescription</h3>
                    <p className="text-sm text-gray-500">Create new prescription</p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Today's Appointments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
            </div>
            <div className="p-6">
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{appointment.patient}</p>
                          <p className="text-sm text-gray-500">{appointment.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{appointment.time}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          appointment.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments today</h3>
                  <p className="mt-1 text-sm text-gray-500">Enjoy your free time!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Records */}
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
                        <p className="font-medium text-gray-900">{record.patient}</p>
                        <p className="text-sm text-gray-500">{record.type}</p>
                        <p className="text-xs text-gray-400">{record.date}</p>
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No records yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by creating your first patient record.
                </p>
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create First Record
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
