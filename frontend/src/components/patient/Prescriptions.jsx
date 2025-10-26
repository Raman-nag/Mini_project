import React from 'react';
import { 
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import { mockPrescriptions, mockDoctors } from '../../data/mockData';

const Prescriptions = () => {
  // TODO: Replace with blockchain data
  const prescriptions = mockPrescriptions;
  const doctors = mockDoctors;

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'Completed':
        return <CheckCircleIcon className="w-5 h-5" />;
      case 'Expired':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const handleDownload = (prescription) => {
    // TODO: Implement prescription download
    console.log('Download prescription:', prescription);
    alert('Prescription download functionality will be implemented with IPFS integration');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Total: {prescriptions.length}
          </span>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <Card variant="outlined" className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Yet</h3>
          <p className="text-sm text-gray-500">
            Your prescriptions will appear here when prescribed by your doctors.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} variant="elevated" className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Prescription #{prescription.id}
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(prescription.status)}`}>
                      {getStatusIcon(prescription.status)}
                      <span className="ml-1">{prescription.status}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2" />
                      {getDoctorName(prescription.doctorId)}
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {new Date(prescription.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(prescription)}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>

              {/* Medications */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Medications:</h4>
                <div className="space-y-3">
                  {prescription.medications.map((medication, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-2">{medication.name}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Dosage:</span> {medication.dosage}
                            </div>
                            <div>
                              <span className="font-medium">Frequency:</span> {medication.frequency}
                            </div>
                          </div>
                          {medication.instructions && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-gray-700">Instructions: </span>
                              <span className="text-sm text-gray-600">{medication.instructions}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
