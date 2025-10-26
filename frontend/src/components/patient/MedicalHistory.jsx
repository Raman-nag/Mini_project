import React, { useState } from 'react';
import { 
  CalendarIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  DocumentTextIcon,
  EyeIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { mockMedicalRecords, mockDoctors, mockHospitals } from '../../data/mockData';

const MedicalHistory = () => {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TODO: Replace with blockchain data
  const medicalRecords = mockMedicalRecords;
  const doctors = mockDoctors;
  const hospitals = mockHospitals;

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor';
  };

  const getHospitalName = (hospitalId) => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    return hospital ? hospital.name : 'Unknown Hospital';
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Medical History</h2>
        <p className="text-sm text-gray-500">Chronological Timeline</p>
      </div>

      {medicalRecords.length === 0 ? (
        <Card variant="outlined" className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Yet</h3>
          <p className="text-sm text-gray-500">
            Your medical records will appear here once your doctors create them.
          </p>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Timeline items */}
          <div className="space-y-8">
            {medicalRecords.map((record, index) => (
              <div key={record.id} className="relative flex items-start">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white rounded-full border-4 border-blue-500">
                  <ClipboardDocumentCheckIcon className="w-6 h-6 text-blue-500" />
                </div>

                {/* Content */}
                <div className="flex-1 ml-6">
                  <Card variant="elevated" className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {record.diagnosis}
                          </h3>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            record.status === 'Active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {new Date(record.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <UserIcon className="w-4 h-4 mr-2" />
                            {getDoctorName(record.doctorId)}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 md:col-span-2">
                            <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                            {getHospitalName(record.hospitalId)}
                          </div>
                        </div>

                        {record.symptoms && record.symptoms.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Symptoms:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                              {record.symptoms.map((symptom, idx) => (
                                <li key={idx}>{symptom}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {record.treatment && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Treatment:</p>
                            <p className="text-sm text-gray-600">{record.treatment}</p>
                          </div>
                        )}

                        {record.doctorNotes && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-xs font-medium text-blue-900 mb-1">Doctor's Notes:</p>
                            <p className="text-sm text-blue-800">{record.doctorNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* View Button */}
                      <div className="ml-4">
                        <button
                          onClick={() => handleViewRecord(record)}
                          className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4 mr-2" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        title={selectedRecord?.diagnosis}
        size="2xl"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(selectedRecord.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  selectedRecord.status === 'Active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedRecord.status}
                </span>
              </div>
            </div>

            {selectedRecord.symptoms && selectedRecord.symptoms.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Symptoms</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-900">
                  {selectedRecord.symptoms.map((symptom, idx) => (
                    <li key={idx}>{symptom}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedRecord.treatment && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Treatment</p>
                <p className="text-sm text-gray-900">{selectedRecord.treatment}</p>
              </div>
            )}

            {selectedRecord.doctorNotes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">Doctor's Notes</p>
                <p className="text-sm text-blue-800">{selectedRecord.doctorNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MedicalHistory;
