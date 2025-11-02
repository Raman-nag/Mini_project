import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import SearchBar from '../common/SearchBar';
import Modal from '../common/Modal';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    // Set initial mock data
    setPatients(mockPatients);
    setFilteredPatients(mockPatients);
  }, []);

  // Mock data - replace with actual API calls
  const mockPatients = [
    {
      id: 'pat_001',
      firstName: 'John',
      lastName: 'Doe',
      patientId: 'PAT-001',
      email: 'john.doe@email.com',
      phone: '+1 (555) 345-6789',
      dateOfBirth: '1985-03-15',
      gender: 'Male',
      bloodType: 'O+',
      lastVisitDate: '2024-03-10',
      assignedDoctor: 'Dr. Sarah Johnson',
      doctorId: 'doc_001',
      totalRecords: 15,
      status: 'Active',
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+1 (555) 456-7890'
      }
    },
    {
      id: 'pat_002',
      firstName: 'Alice',
      lastName: 'Smith',
      patientId: 'PAT-002',
      email: 'alice.smith@email.com',
      phone: '+1 (555) 456-7890',
      dateOfBirth: '1990-07-22',
      gender: 'Female',
      bloodType: 'A+',
      lastVisitDate: '2024-03-08',
      assignedDoctor: 'Dr. Michael Chen',
      doctorId: 'doc_002',
      totalRecords: 8,
      status: 'Active',
      emergencyContact: {
        name: 'Bob Smith',
        relationship: 'Brother',
        phone: '+1 (555) 567-8901'
      }
    },
    {
      id: 'pat_003',
      firstName: 'Robert',
      lastName: 'Johnson',
      patientId: 'PAT-003',
      email: 'robert.johnson@email.com',
      phone: '+1 (555) 567-8901',
      dateOfBirth: '1978-12-05',
      gender: 'Male',
      bloodType: 'B-',
      lastVisitDate: '2024-02-28',
      assignedDoctor: 'Dr. Emily Rodriguez',
      doctorId: 'doc_003',
      totalRecords: 23,
      status: 'Active',
      emergencyContact: {
        name: 'Mary Johnson',
        relationship: 'Wife',
        phone: '+1 (555) 678-9012'
      }
    },
    {
      id: 'pat_004',
      firstName: 'Lisa',
      lastName: 'Brown',
      patientId: 'PAT-004',
      email: 'lisa.brown@email.com',
      phone: '+1 (555) 678-9012',
      dateOfBirth: '1992-05-18',
      gender: 'Female',
      bloodType: 'AB+',
      lastVisitDate: '2024-03-12',
      assignedDoctor: 'Dr. James Wilson',
      doctorId: 'doc_004',
      totalRecords: 12,
      status: 'Active',
      emergencyContact: {
        name: 'David Brown',
        relationship: 'Father',
        phone: '+1 (555) 789-0123'
      }
    }
  ];

  const doctors = [
    'All Doctors',
    'Dr. Sarah Johnson',
    'Dr. Michael Chen',
    'Dr. Emily Rodriguez',
    'Dr. James Wilson'
  ];

  const dateRanges = [
    'All Dates',
    'Last 7 days',
    'Last 30 days',
    'Last 3 months',
    'Last 6 months',
    'Last year'
  ];

  useEffect(() => {
    setPatients(mockPatients);
    setFilteredPatients(mockPatients);
  }, []);

  useEffect(() => {
    let filtered = patients;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.assignedDoctor.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Doctor filter
    if (doctorFilter !== 'all') {
      filtered = filtered.filter(patient => patient.assignedDoctor === doctorFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'Last 7 days':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'Last 30 days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case 'Last 3 months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'Last 6 months':
          filterDate.setMonth(now.getMonth() - 6);
          break;
        case 'Last year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      if (dateFilter !== 'All Dates') {
        filtered = filtered.filter(patient => new Date(patient.lastVisitDate) >= filterDate);
      }
    }

    setFilteredPatients(filtered);
  }, [patients, searchQuery, doctorFilter, dateFilter]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleViewRecords = (patient) => {
    setSelectedPatient(patient);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getBloodTypeBadge = (bloodType) => {
    const bloodTypeColors = {
      'O+': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'O-': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'A+': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'A-': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'B+': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'B-': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'AB+': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'AB-': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bloodTypeColors[bloodType] || 'bg-gray-100 text-gray-800'}`}>
        {bloodType}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <Card.Body>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <SearchBar
                placeholder="Search patients by name, ID, email, or doctor..."
                onSearch={handleSearch}
                onClear={handleClearSearch}
                value={searchQuery}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                icon={<FunnelIcon className="w-4 h-4" />}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assigned Doctor
                  </label>
                  <select
                    value={doctorFilter}
                    onChange={(e) => setDoctorFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {doctors.map(doctor => (
                      <option key={doctor} value={doctor === 'All Doctors' ? 'all' : doctor}>
                        {doctor}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Visit Date
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {dateRanges.map(range => (
                      <option key={range} value={range === 'All Dates' ? 'all' : range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Patients Table */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title>Patients ({filteredPatients.length})</Card.Title>
              <Card.Description>
                View and manage patient information and medical records
              </Card.Description>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Patient ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Visit Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Assigned Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Age & Blood Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {patient.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-mono">
                        {patient.patientId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(patient.lastVisitDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {patient.assignedDoctor}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {calculateAge(patient.dateOfBirth)} years
                      </div>
                      <div className="mt-1">
                        {getBloodTypeBadge(patient.bloodType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {patient.totalRecords} records
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewRecords(patient)}
                        icon={<DocumentTextIcon className="w-4 h-4" />}
                      >
                        View Records
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPatients.length === 0 && (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No patients found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery || doctorFilter !== 'all' || dateFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No patients are currently registered in the system.'
                  }
                </p>
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Patient Details Modal */}
      <Modal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title="Patient Medical Records"
        size="xl"
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Patient Header */}
            <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Patient ID: {selectedPatient.patientId}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  {getBloodTypeBadge(selectedPatient.bloodType)}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {calculateAge(selectedPatient.dateOfBirth)} years old
                  </span>
                </div>
              </div>
            </div>

            {/* Patient Information */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Contact Information
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedPatient.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedPatient.phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date of Birth
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(selectedPatient.dateOfBirth)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">
                  Medical Information
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Assigned Doctor
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedPatient.assignedDoctor}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Visit
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(selectedPatient.lastVisitDate)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total Records
                    </label>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {selectedPatient.totalRecords}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Emergency Contact
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedPatient.emergencyContact.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Relationship
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedPatient.emergencyContact.relationship}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedPatient.emergencyContact.phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline">
                View Full History
              </Button>
              <Button variant="primary">
                Create New Record
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatientList;
