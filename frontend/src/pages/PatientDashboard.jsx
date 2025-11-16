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
import { useNavigate } from 'react-router-dom';
import { getPatientContract } from '../utils/contract';
import patientService from '../services/patientService';
import { getProvider } from '../utils/web3';
import insuranceService from '../services/insuranceService';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({ firstName: '', lastName: '', bloodGroup: '', dateOfBirth: '' });
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connected');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [searchRecords, setSearchRecords] = useState('');
  const [searchRx, setSearchRx] = useState('');
  const [searchAccess, setSearchAccess] = useState('');


  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const provider = getProvider();
        if (!provider) throw new Error('Wallet provider not available');
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        const patientContract = await getPatientContract();
        // Prefer detailed getter if available
        let profile;
        try {
          profile = await patientContract.getPatientDetails(address);
        } catch (_) {
          // Fallback to mapping access if needed
          profile = await patientContract.patients(address);
        }

        const name = profile?.name || '';
        const [firstName, ...rest] = String(name).trim().split(' ');
        const lastName = rest.join(' ');
        const dateOfBirth = profile?.dateOfBirth || '';
        const bloodGroup = profile?.bloodGroup || '';

        setUserProfile({ firstName, lastName, bloodGroup, dateOfBirth });
        setNetworkStatus('connected');
      } catch (e) {
        console.error('Failed to load user data:', e);
        setError(e?.message || 'Failed to load user data');
        setNetworkStatus('disconnected');
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  // Load on-chain data for records, prescriptions, and access once wallet is known
  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [recRes, rxRes, accessRes] = await Promise.all([
          patientService.getMyRecords(walletAddress).catch(() => ({ success: false, records: [] })),
          patientService.getMyPrescriptions(walletAddress).catch(() => ({ success: false, prescriptions: [] })),
          patientService.getAccessList().catch(() => ({ success: false, accessList: [] })),
        ]);

        if (cancelled) return;
        const recs = Array.isArray(recRes?.records) ? recRes.records : [];
        // Normalize to UI shape
        const normalizedRecords = recs
          .sort((a,b) => b.timestamp - a.timestamp)
          .slice(0, 5)
          .map(r => ({
            id: r.id,
            doctor: r.doctorName || (r.doctorAddress ? `${r.doctorAddress.slice(0,6)}...${r.doctorAddress.slice(-4)}` : '—'),
            date: r.date,
            type: r.diagnosis || 'Medical Record',
            status: r.isActive ? 'completed' : 'pending',
            hospital: '—',
            ipfsHash: r.ipfsHash,
          }));
        setRecords(normalizedRecords);

        const rx = Array.isArray(rxRes?.prescriptions) ? rxRes.prescriptions : [];
        const normalizedRx = rx
          .sort((a,b) => (new Date(b.date)) - (new Date(a.date)))
          .map(p => ({
            id: p.id,
            medication: p.prescription || 'Prescription',
            doctor: p.doctor || '—',
            startDate: p.date || '—',
            endDate: '—',
            status: 'active',
          }));
        setPrescriptions(normalizedRx);

        const access = Array.isArray(accessRes?.accessList) ? accessRes.accessList : [];
        const normalizedAccess = access.map((a, idx) => ({
          id: a.doctorAddress || String(idx),
          provider: a.doctorAddress,
          requestedBy: a.doctorAddress,
          date: a.grantedAt ? new Date(Number(a.grantedAt) * 1000).toLocaleDateString() : '—',
          status: a.isActive ? 'granted' : 'pending',
        }));
        setAccessRequests(normalizedAccess);
      } catch (e) {
        console.error('Failed loading patient dashboard data', e);
        setRecords([]);
        setPrescriptions([]);
        setAccessRequests([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [walletAddress]);

  const stats = [
    {
      name: 'Medical Records',
      value: String(records.length || 0),
      change: '',
      icon: DocumentTextIcon,
      color: 'text-primary-600 dark:text-primary-400',
      bgColor: 'bg-primary-100 dark:bg-primary-900/20'
    },
    {
      name: 'Active Prescriptions',
      value: String(prescriptions.length || 0),
      change: '',
      icon: ClipboardDocumentListIcon,
      color: 'text-success-600 dark:text-success-400',
      bgColor: 'bg-success-100 dark:bg-success-900/20'
    },
    {
      name: 'Access Granted',
      value: String(accessRequests.filter(a => a.status === 'granted').length),
      change: 'Healthcare providers',
      icon: KeyIcon,
      color: 'text-warning-600 dark:text-warning-400',
      bgColor: 'bg-warning-100 dark:bg-warning-900/20'
    }
  ];

  const recentRecords = records;

  const activePrescriptions = prescriptions;

  // accessRequests state is already populated from chain

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
              <h1 className="text-2xl font-bold">Welcome back, {userProfile.firstName || 'Patient'}!</h1>
              <p className="mt-2 text-primary-100">
                Access your secure medical records and manage your health data
              </p>
              <div className="mt-3 text-sm text-primary-100">
                {walletAddress ? (
                  <>Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</>
                ) : 'Wallet: —'}
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

        {/* Quick Actions - single horizontal row */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button onClick={() => navigate('/patient/medical-history')} className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-medium text-gray-900">View Medical History</h3>
                  <p className="text-sm text-gray-500">Browse your complete medical records</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>
              <button onClick={() => navigate('/patient/prescriptions')} className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-medium text-gray-900">View Prescriptions</h3>
                  <p className="text-sm text-gray-500">Check your current medications</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>
              <button onClick={() => navigate('/patient/manage-access')} className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <KeyIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-medium text-gray-900">Manage Access</h3>
                  <p className="text-sm text-gray-500">Control who can access your records</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>
              <button
                onClick={() => navigate('/patient/insurance-requests')}
                className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="bg-amber-100 p-3 rounded-lg mr-4">
                  <ShieldCheckIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-medium text-gray-900">Request Insurance Review</h3>
                  <p className="text-sm text-gray-500">Ask insurance admin to review your data</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Access Requests */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Access Requests</h2>
            <div className="flex items-center space-x-2">
              <input
                value={searchAccess}
                onChange={(e)=>setSearchAccess(e.target.value)}
                placeholder="Search by address/status"
                className="hidden sm:block px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <button
                onClick={() => {
                  if (!walletAddress) return; 
                  (async () => {
                    try {
                      const [rxRes, accessRes] = await Promise.all([
                        patientService.getMyPrescriptions(walletAddress).catch(() => ({ prescriptions: [] })),
                        patientService.getAccessList().catch(() => ({ accessList: [] })),
                      ]);
                      const rx = Array.isArray(rxRes?.prescriptions) ? rxRes.prescriptions : [];
                      setPrescriptions(rx
                        .sort((a,b) => (new Date(b.date)) - (new Date(a.date)))
                        .map(p => ({ id: p.id, medication: p.prescription || 'Prescription', doctor: p.doctor || '—', startDate: p.date || '—', endDate: '—', status: 'active' }))
                      );
                      const access = Array.isArray(accessRes?.accessList) ? accessRes.accessList : [];
                      setAccessRequests(access.map((a, idx) => ({ id: a.doctorAddress || String(idx), provider: a.doctorAddress, requestedBy: a.doctorAddress, date: a.grantedAt ? new Date(Number(a.grantedAt) * 1000).toLocaleDateString() : '—', status: a.isActive ? 'granted' : 'pending' })));
                    } catch {}
                  })();
                }}
                className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="p-6">
            {accessRequests.length > 0 ? (
              <div className="space-y-4">
                {accessRequests.filter(r=>{
                  const q = searchAccess.toLowerCase();
                  if(!q) return true;
                  return String(r.provider||'').toLowerCase().includes(q) || String(r.status||'').toLowerCase().includes(q);
                }).map((request) => (
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

        {/* Recent Medical Records */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Medical Records</h2>
            <div className="flex items-center space-x-2">
              <input
                value={searchRecords}
                onChange={(e)=>setSearchRecords(e.target.value)}
                placeholder="Search by doctor/diagnosis"
                className="hidden sm:block px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <button 
                onClick={() => walletAddress && patientService.getMyRecords(walletAddress).then(res => {
                  const recs = Array.isArray(res?.records) ? res.records : [];
                  setRecords(recs
                    .sort((a,b) => b.timestamp - a.timestamp)
                    .slice(0,5)
                    .map(r => ({ id: r.id, doctor: r.doctorName || (r.doctorAddress ? `${r.doctorAddress.slice(0,6)}...${r.doctorAddress.slice(-4)}` : '—'), date: r.date, type: r.diagnosis || 'Medical Record', status: r.isActive ? 'completed' : 'pending', hospital: '—', ipfsHash: r.ipfsHash }))
                  );
                })} 
                className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentRecords.length > 0 ? (
              <div className="space-y-4">
                {recentRecords.filter(r=>{
                  const q = searchRecords.toLowerCase();
                  if(!q) return true;
                  return String(r.doctor||'').toLowerCase().includes(q) || String(r.type||'').toLowerCase().includes(q);
                }).map((record) => (
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Prescriptions</h2>
            <div className="flex items-center space-x-2">
              <input
                value={searchRx}
                onChange={(e)=>setSearchRx(e.target.value)}
                placeholder="Search by doctor/medication"
                className="hidden sm:block px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <button 
                onClick={() => walletAddress && patientService.getMyPrescriptions(walletAddress).then(rxRes => {
                  const rx = Array.isArray(rxRes?.prescriptions) ? rxRes.prescriptions : [];
                  setPrescriptions(rx
                    .sort((a,b) => (new Date(b.date)) - (new Date(a.date)))
                    .map(p => ({ id: p.id, medication: p.prescription || 'Prescription', doctor: p.doctor || '—', startDate: p.date || '—', endDate: '—', status: 'active' }))
                  );
                })} 
                className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="p-6">
            {activePrescriptions.length > 0 ? (
              <div className="space-y-4">
                {activePrescriptions.filter(p=>{
                  const q = searchRx.toLowerCase();
                  if(!q) return true;
                  return String(p.doctor||'').toLowerCase().includes(q) || String(p.medication||'').toLowerCase().includes(q);
                }).map((prescription) => (
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
