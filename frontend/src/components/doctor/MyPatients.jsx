import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import SearchBar from '../common/SearchBar';
import Modal from '../common/Modal';
import doctorService from '../../services/doctorService';
import { useWeb3 } from '../../contexts/Web3Context';
import { ipfsUrl } from '../../utils/ipfs';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { /* no-op */ }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-lg border border-red-300 text-red-700 bg-red-50">
          Something went wrong while rendering this view.
        </div>
      );
    }
    return this.props.children;
  }
}

const MyPatients = ({ onViewHistory }) => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('lastVisit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsPatient, setDetailsPatient] = useState(null);
  const [detailsTab, setDetailsTab] = useState('records');
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [myRecords, setMyRecords] = useState([]);
  const [myPrescriptions, setMyPrescriptions] = useState([]);
  const [otherPrescriptions, setOtherPrescriptions] = useState([]);
  const { account } = useWeb3();

  // Temporary import validity logging to catch invalid element type errors
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[MyPatients] Imported components', { Card: !!Card, Button: !!Button, SearchBar: !!SearchBar });
  }, []);

  // Load real on-chain patients for the connected doctor
  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await doctorService.getMyPatients();
      const normalized = (res?.patients || []).map((p, idx) => {
        const fullName = p.name || '';
        const firstName = fullName.split(' ')[0] || fullName || (p.walletAddress?.slice(0,6) + '...');
        const lastName = fullName.split(' ').slice(1).join(' ');
        return {
          id: p.walletAddress || String(idx),
          walletAddress: p.walletAddress,
          firstName,
          lastName,
          patientId: p.walletAddress ? `${p.walletAddress.slice(0,6)}...${p.walletAddress.slice(-4)}` : '—',
          email: '',
          phone: '',
          dateOfBirth: p.dateOfBirth || '',
          gender: '',
          bloodType: p.bloodGroup || '—',
          lastVisitDate: p.lastVisitDate || '',
          totalRecords: Number(p.totalRecords || 0),
          status: p.isActive ? 'Active' : 'Inactive',
          nextAppointment: null,
        };
      });
      setPatients(normalized);
      setFilteredPatients(normalized);
    } catch (e) {
      setError(e?.message || 'Failed to load patients');
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchPatients().catch(() => {});
    return () => { mounted = false; };
  }, []);

  const openDetails = async (patient) => {
    setDetailsPatient(patient);
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError('');
    setDetailsTab('records');
    try {
      const res = await doctorService.getPatientHistory(patient.walletAddress);
      const list = (res?.records || []).map(r => ({
        id: r.id,
        date: r.date,
        diagnosis: r.diagnosis,
        prescription: r.prescription,
        treatmentPlan: r.treatmentPlan,
        ipfsHash: r.ipfsHash,
        doctorAddress: r.doctorAddress,
      }));
      const myRecs = list.filter(r => (r.doctorAddress || '').toLowerCase() === (account||'').toLowerCase());
      const myRx = myRecs.filter(r => (r.prescription||'').trim().length > 0);
      const othersRx = list.filter(r => (r.prescription||'').trim().length > 0 && (r.doctorAddress||'').toLowerCase() !== (account||'').toLowerCase());
      setMyRecords(myRecs);
      setMyPrescriptions(myRx);
      setOtherPrescriptions(othersRx);
    } catch (e) {
      setDetailsError(e?.message || 'Failed to load details');
      setMyRecords([]);
      setMyPrescriptions([]);
      setOtherPrescriptions([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = patients;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery)
      );
    }

    // Sort patients
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'lastVisit':
          aValue = new Date(a.lastVisitDate);
          bValue = new Date(b.lastVisitDate);
          break;
        case 'records':
          aValue = a.totalRecords;
          bValue = b.totalRecords;
          break;
        case 'nextAppointment':
          aValue = a.nextAppointment ? new Date(a.nextAppointment) : new Date('2099-12-31');
          bValue = b.nextAppointment ? new Date(b.nextAppointment) : new Date('2099-12-31');
          break;
        default:
          aValue = a.lastVisitDate;
          bValue = b.lastVisitDate;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPatients(filtered);
  }, [patients, searchQuery, sortBy, sortOrder]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
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

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* Search and Sort */}
      <Card>
        <Card.Body>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <SearchBar
                placeholder="Search patients by name, ID, email, or phone..."
                onSearch={handleSearch}
                onClear={handleClearSearch}
                value={searchQuery}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="lastVisit">Last Visit</option>
                  <option value="name">Name</option>
                  <option value="records">Records Count</option>
                  
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
      {/* Summary Stats (top) */}
      <Card>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filteredPatients.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{filteredPatients.reduce((sum, p) => sum + p.totalRecords, 0)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Records</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{filteredPatients.filter(p => { const d=new Date(p.lastVisitDate); const t=new Date(); t.setDate(t.getDate()-30); return d>=t; }).length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active (30 days)</p>
            </div>
          </div>
        </Card.Body>
      </Card>
      {/* Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title={detailsPatient ? `Details: ${detailsPatient.firstName} ${detailsPatient.lastName}` : 'Details'}
        size="xl"
      >
        {detailsLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {detailsError && !detailsLoading && <p className="text-sm text-red-600">{detailsError}</p>}
        {!detailsLoading && !detailsError && detailsPatient && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Name</div>
                <div className="font-medium text-gray-900">{detailsPatient.firstName} {detailsPatient.lastName}</div>
              </div>
              <div>
                <div className="text-gray-500">Wallet</div>
                <div className="font-mono text-gray-900 break-all">{detailsPatient.walletAddress}</div>
              </div>
              <div>
                <div className="text-gray-500">Recent Visit</div>
                <div className="text-gray-900">{detailsPatient.lastVisitDate ? formatDate(detailsPatient.lastVisitDate) : '—'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setDetailsTab('records')} className={`px-3 py-1 rounded-lg text-sm border ${detailsTab==='records'?'bg-blue-600 text-white border-blue-600':'border-gray-300'}`}>View Record</button>
              <button onClick={() => setDetailsTab('myRx')} className={`px-3 py-1 rounded-lg text-sm border ${detailsTab==='myRx'?'bg-blue-600 text-white border-blue-600':'border-gray-300'}`}>View Prescription</button>
              <button onClick={() => setDetailsOpen(false)} className="ml-auto px-3 py-1 rounded-lg text-sm border border-gray-300">Close</button>
            </div>
            {detailsTab === 'records' && (
              <div className="space-y-3">
                {myRecords.length === 0 && <div className="text-sm text-gray-500">No records created by you.</div>}
                {myRecords.map(r => (
                  <div key={`r-${r.id}`} className="p-3 border rounded-lg">
                    <div className="text-sm text-gray-500">{r.date}</div>
                    <div className="font-medium">{r.diagnosis || 'Record'}</div>
                    {(() => {
                      if (!r.ipfsHash) return null;
                      let cids = [];
                      try {
                        if (typeof r.ipfsHash === 'string' && (r.ipfsHash.trim().startsWith('[') || r.ipfsHash.trim().startsWith('{'))) {
                          const parsed = JSON.parse(r.ipfsHash);
                          cids = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
                        } else if (typeof r.ipfsHash === 'string') cids = [r.ipfsHash];
                        else if (Array.isArray(r.ipfsHash)) cids = r.ipfsHash;
                      } catch { cids = [String(r.ipfsHash)]; }
                      cids = (cids||[]).filter(Boolean);
                      return cids.length ? (
                        <div className="mt-1 space-y-1">
                          {cids.map((cid, i) => (
                            <a key={`r-${r.id}-cid-${i}`} className="text-blue-600 text-sm hover:underline break-all" href={ipfsUrl(cid)} target="_blank" rel="noreferrer">Document {i+1}</a>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ))}
              </div>
            )}
            {detailsTab === 'myRx' && (
              <div className="space-y-2 text-sm">
                {myPrescriptions.length === 0 && <div className="text-gray-500">No prescriptions by you for this patient.</div>}
                {myPrescriptions.map(p => (
                  <div key={`myrx-${p.id}`} className="p-3 border rounded-lg">
                    <div className="font-medium">{p.prescription || 'Prescription'}</div>
                    <div className="text-gray-500">{p.date}</div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        )}
      </Modal>

      {/* Patients Table */}
      {loading && (
        <Card>
          <Card.Body>
            <p className="text-sm text-gray-500">Loading patients...</p>
          </Card.Body>
        </Card>
      )}
      {error && !loading && (
        <Card>
          <Card.Body>
            <p className="text-sm text-red-600">{error}</p>
          </Card.Body>
        </Card>
      )}
      {!loading && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-300 border-b">
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Last Visit</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{p.firstName} {p.lastName}</div>
                        <div className="text-xs text-gray-500">{p.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{p.walletAddress?.slice(0,6)}...{p.walletAddress?.slice(-4)}</td>
                  <td className="px-4 py-3">{p.lastVisitDate ? formatDate(p.lastVisitDate) : '—'}</td>
                  <td className="px-4 py-3">{p.totalRecords}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" onClick={() => openDetails(p)} icon={<DocumentTextIcon className="w-4 h-4" />}>View Details</Button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No patients found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {filteredPatients.length === 0 && (
        <Card>
          <Card.Body>
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No patients found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? 'Try adjusting your search criteria.'
                  : 'No patients are currently assigned to you.'
                }
              </p>
            </div>
          </Card.Body>
        </Card>
      )}

      
    </div>
    </ErrorBoundary>
  );
};

export default MyPatients;
