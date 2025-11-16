import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  DocumentTextIcon,
  EyeIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import Modal from '../common/Modal';
import patientService from '../../services/patientService';
import { getProvider } from '../../utils/web3';

const MedicalHistory = () => {
  const navigate = useNavigate();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [search, setSearch] = useState('');
  const [isActivePatient, setIsActivePatient] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const provider = getProvider();
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        const active = await patientService.isActivePatient(address);
        if (!active) {
          setIsActivePatient(false);
          setRecords([]);
          return;
        }
        setIsActivePatient(true);
        const res = await patientService.getMyRecords(address);
        const recs = Array.isArray(res?.records) ? res.records : [];
        const normalized = recs
          .slice()
          .sort((a, b) => b.timestamp - a.timestamp)
          .map(r => ({
            id: r.id,
            date: r.date,
            diagnosis: r.diagnosis || 'Medical Record',
            symptoms: r.symptoms || [],
            treatment: r.treatmentPlan || '',
            doctorNotes: r.treatmentPlan || '',
            status: r.isActive ? 'Active' : 'Pending',
            doctorAddress: r.doctorAddress,
            doctorName: r.doctorName || (r.doctorAddress ? `${r.doctorAddress.slice(0,6)}...${r.doctorAddress.slice(-4)}` : 'Unknown Doctor'),
            hospitalName: '—',
            ipfsHash: r.ipfsHash || '',
          }));
        setRecords(normalized);
      } catch (e) {
        const msg = e?.message || '';
        if (msg.includes('Not an active patient')) {
          setIsActivePatient(false);
          setRecords([]);
          setError('');
        } else {
          setError(msg || 'Failed to load medical history');
        }
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const filtered = (() => {
    const q = String(search || '').toLowerCase();
    if (!q) return records;
    return records.filter(r => {
      const inDiag = String(r.diagnosis || '').toLowerCase().includes(q);
      const inDoc = String(r.doctorName || '').toLowerCase().includes(q);
      const inDate = String(r.date || '').toLowerCase().includes(q);
      const inSymptoms = Array.isArray(r.symptoms) && r.symptoms.join(' ').toLowerCase().includes(q);
      return inDiag || inDoc || inDate || inSymptoms;
    });
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Medical History</h2>
        <div className="flex items-center space-x-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor, diagnosis, symptom, or date"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
          />
          <p className="text-sm text-gray-500">Chronological Timeline</p>
        </div>
      </div>

      {loading ? (
        <Card variant="outlined" className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading records...</h3>
          <p className="text-sm text-gray-500">Fetching on-chain data</p>
        </Card>
      ) : !isActivePatient ? (
        <Card variant="outlined" className="text-center py-12 space-y-4">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-amber-500" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">You are not an active patient</h3>
            <p className="text-sm text-gray-500 max-w-xl mx-auto">
              You must be registered and marked as an active patient on-chain before you can view medical records.
              Please complete your patient registration or contact an administrator to activate your account.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Register as Patient
            </button>
            <button
              onClick={() => window.alert('Please contact the platform administrator to activate your patient account.')}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Contact Admin
            </button>
          </div>
        </Card>
      ) : error ? (
        <Card variant="outlined" className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load</h3>
          <p className="text-sm text-gray-500">{error}</p>
        </Card>
      ) : records.length === 0 ? (
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
            {filtered.map((record, index) => (
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
                            {record.doctorName}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 md:col-span-2">
                            <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                            {record.hospitalName}
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

            {selectedRecord.ipfsHash && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Medical Documents</p>
                {(() => {
                  const ipfs = selectedRecord.ipfsHash;
                  let docs = [];
                  try {
                    docs = typeof ipfs === 'string' ? JSON.parse(ipfs) : (Array.isArray(ipfs) ? ipfs : []);
                  } catch (e) {
                    docs = String(ipfs).split(',');
                  }
                  docs = (docs || []).map(d => String(d).replace(/\"/g, '"')).filter(Boolean);
                  return (
                    <div className="space-y-1">
                      {docs.map((cid, i) => {
                        const clean = cid.replace(/"/g, '').trim();
                        if (!clean) return null;
                        return (
                          <a
                            key={`${clean}-${i}`}
                            href={`https://ipfs.io/ipfs/${clean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 text-xs sm:text-sm font-medium shadow-sm transition-colors break-all"
                          >
                            <span className="truncate max-w-xs sm:max-w-md">{clean}</span>
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MedicalHistory;
