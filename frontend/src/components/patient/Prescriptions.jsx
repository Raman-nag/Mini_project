import React, { useEffect, useState } from 'react';
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
import Modal from '../common/Modal';
import patientService from '../../services/patientService';
import { getProvider } from '../../utils/web3';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const provider = getProvider();
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const res = await patientService.getMyPrescriptions(address);
        const list = Array.isArray(res?.prescriptions) ? res.prescriptions : [];
        const normalized = list
          .slice()
          .sort((a,b) => new Date(b.date) - new Date(a.date))
          .map(p => {
            let meds = [];
            try {
              const parsed = typeof p.prescription === 'string' ? JSON.parse(p.prescription) : p.prescription;
              if (Array.isArray(parsed)) meds = parsed;
            } catch {
              // legacy plain-text prescription
              meds = [{ type: 'Note', name: p.diagnosis || 'Prescription', dosage: '', unit: '', frequency: '', duration: '', instructions: p.prescription || '' }];
            }
            if (!Array.isArray(meds) || meds.length === 0) {
              meds = [{ type: 'Note', name: p.diagnosis || 'Prescription', dosage: '', unit: '', frequency: '', duration: '', instructions: p.prescription || '' }];
            }
            return ({
              id: p.id,
              status: 'Active',
              doctorName: p.doctor || (p.doctorAddress ? `${p.doctorAddress.slice(0,6)}...${p.doctorAddress.slice(-4)}` : '—'),
              date: p.date || '',
              medications: meds,
              ipfsHash: p.ipfsHash || ''
            });
          });
        setPrescriptions(normalized);
      } catch (e) {
        setError(e?.message || 'Failed to load prescriptions');
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
    if (prescription.ipfsHash) {
      window.open(`https://ipfs.io/ipfs/${prescription.ipfsHash}`, '_blank', 'noreferrer');
    }
  };

  const filtered = (() => {
    const q = String(search || '').toLowerCase();
    if (!q) return prescriptions;
    return prescriptions.filter(p => {
      const inDoc = String(p.doctorName || '').toLowerCase().includes(q);
      const medsText = (p.medications || []).map(m => `${m.name||''} ${m.type||''} ${m.instructions||''}`).join(' ').toLowerCase();
      const inMeds = medsText.includes(q);
      const inDate = String(p.date||'').toLowerCase().includes(q);
      return inDoc || inMeds || inDate;
    });
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
        <div className="flex items-center space-x-3">
          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Search by doctor/medication/date"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
          />
          <span className="text-sm text-gray-500">Total: {filtered.length}/{prescriptions.length}</span>
        </div>
      </div>

      {loading ? (
        <Card variant="outlined" className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading prescriptions...</h3>
          <p className="text-sm text-gray-500">Fetching on-chain data</p>
        </Card>
      ) : error ? (
        <Card variant="outlined" className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load</h3>
          <p className="text-sm text-gray-500">{error}</p>
        </Card>
      ) : prescriptions.length === 0 ? (
        <Card variant="outlined" className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Yet</h3>
          <p className="text-sm text-gray-500">
            Your prescriptions will appear here when prescribed by your doctors.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((prescription) => (
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
                      {prescription.doctorName || '—'}
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {new Date(prescription.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelected(prescription);
                      setShowModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    View More Details
                  </button>
                  <button
                    onClick={() => handleDownload(prescription)}
                    className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
                    disabled={!prescription.ipfsHash}
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>

              {/* Medications */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Medications:</h4>
                <div className="space-y-3">
                  {prescription.medications.map((m, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">Item #{index + 1}{m.type ? ` • ${m.type}` : ''}</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-700">
                            <div>
                              <span className="font-medium">Name:</span> {m.name || '—'}
                            </div>
                            <div>
                              <span className="font-medium">Dosage:</span> {m.dosage || '—'}{m.unit ? ` ${m.unit}` : ''}
                            </div>
                            <div>
                              <span className="font-medium">Frequency:</span> {m.frequency || '—'}
                            </div>
                            <div>
                              <span className="font-medium">Duration:</span> {m.duration || '—'}
                            </div>
                          </div>
                          {m.instructions && (
                            <div className="mt-2 text-sm text-gray-700">
                              <span className="font-medium">Instructions: </span>
                              <span className="text-gray-600">{m.instructions}</span>
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

      {/* Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelected(null); }}
        title={selected ? `Prescription #${selected.id}` : 'Details'}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Doctor</div>
                <div className="text-gray-900">{selected.doctorName || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Date</div>
                <div className="text-gray-900">{selected.date ? new Date(selected.date).toLocaleString() : '—'}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">Medications</div>
              <div className="space-y-2">
                {(selected.medications || []).map((m, i) => (
                  <div key={i} className="border rounded-lg p-3 text-sm text-gray-700">
                    <div className="font-medium">{m.name || 'Item'}{m.type ? ` • ${m.type}` : ''}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                      <div>Dosage: {m.dosage || '—'}{m.unit ? ` ${m.unit}` : ''}</div>
                      <div>Frequency: {m.frequency || '—'}</div>
                      <div>Duration: {m.duration || '—'}</div>
                    </div>
                    {m.instructions && <div className="mt-1">Instructions: {m.instructions}</div>}
                  </div>
                ))}
              </div>
            </div>
            {selected.ipfsHash && (
              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">Document</div>
                <a href={`https://ipfs.io/ipfs/${selected.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Open IPFS</a>
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={() => { setShowModal(false); setSelected(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Prescriptions;
