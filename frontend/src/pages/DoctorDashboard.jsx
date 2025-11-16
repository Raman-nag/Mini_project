import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  UserIcon, 
  HeartIcon, 
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useWeb3 } from '../contexts/Web3Context';
import hospitalService from '../services/hospitalService';
import doctorService from '../services/doctorService';
import { getDoctorContract } from '../utils/contract';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { isConnected, account, connectWallet } = useWeb3();
  const [userProfile, setUserProfile] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('disconnected');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patientsCount, setPatientsCount] = useState(0);
  const [recordsCount, setRecordsCount] = useState(0);
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);
  const [recentRecords, setRecentRecords] = useState([]);
  const [deniedCount, setDeniedCount] = useState(0);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (!isConnected) {
      connectWallet().catch(() => {});
    }
  }, [isConnected, connectWallet]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!account) return;
      setLoading(true);
      setError('');
      try {
        const res = await hospitalService.getDoctorByAddress(account);
        if (!mounted) return;
        if (res?.success && res?.doctor) {
          const fullName = res.doctor.name || '';
          const firstName = fullName.split(' ')[0] || '';
          const lastName = fullName.split(' ').slice(1).join(' ') || '';
          setUserProfile({
            firstName,
            lastName,
            role: res.doctor.specialization || '',
            licenseNumber: res.doctor.licenseNumber || ''
          });
        } else {
          setUserProfile({ firstName: '', lastName: '', role: '', licenseNumber: '' });
        }
        setWalletAddress(account);
        setNetworkStatus(isConnected ? 'connected' : 'disconnected');

        // Load doctor stats and recent records from blockchain
        const patientsRes = await doctorService.getMyPatients();
        if (patientsRes?.success) {
          const pts = patientsRes.patients || [];
          setPatientsCount(pts.length);

          // Aggregate records across patients, but only those created by this doctor
          const allRecords = [];
          let denied = 0;
          for (const p of pts.slice(0, 25)) { // cap to avoid long loops
            try {
              const hist = await doctorService.getPatientHistory(p.walletAddress);
              if (hist?.success && Array.isArray(hist.records)) {
                const mine = hist.records.filter(r => (r.doctorAddress || '').toLowerCase() === account.toLowerCase());
                allRecords.push(...mine);
              }
            } catch (err) {
              denied += 1;
            }
          }
          // Total records created by this doctor
          setRecordsCount(allRecords.length);
          allRecords.sort((a, b) => b.timestamp - a.timestamp);
          setRecentRecords(allRecords.slice(0, 5));

        }

        // Load prescriptions authored by this doctor directly from chain (no cache)
        try {
          const pres = await doctorService.getDoctorPrescriptions(account, 1000);
          if (pres?.success) {
            setPrescriptionsCount(pres.count);
            setRecentPrescriptions((pres.prescriptions || []).slice(0, 5));
          } else {
            setPrescriptionsCount(0);
            setRecentPrescriptions([]);
          }
        } catch {
          setPrescriptionsCount(0);
          setRecentPrescriptions([]);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load doctor data');
        setUserProfile({ firstName: '', lastName: '', role: '', licenseNumber: '' });
        setWalletAddress(account || '');
        setNetworkStatus(isConnected ? 'connected' : 'disconnected');
      }
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [account, isConnected]);

  useEffect(() => {
    const recs = (recentRecords || []).map(r => ({
      id: r.id,
      type: 'Record',
      patient: r.patientAddress,
      timestamp: r.timestamp || Date.parse(r.date) || 0,
      date: r.date,
    }));
    const pres = (recentPrescriptions || []).map(p => ({
      id: p.id,
      type: 'Prescription',
      patient: p.patientAddress,
      timestamp: p.timestamp || Date.parse(p.date) || 0,
      date: p.date,
    }));
    const merged = [...recs, ...pres]
      .sort((a,b) => (b.timestamp||0) - (a.timestamp||0))
      .slice(0, 8);
    setRecentActivity(merged);
  }, [recentRecords, recentPrescriptions]);

  // Subscribe to on-chain RecordCreated events to refresh prescriptions in real time
  useEffect(() => {
    if (!account) return;
    let contract;
    let active = true;
    const setup = async () => {
      try {
        contract = await getDoctorContract();
        const handler = async (recordId, patientAddress, doctorAddress) => {
          try {
            if (!active) return;
            if ((doctorAddress || '').toLowerCase() !== account.toLowerCase()) return;
            // Re-fetch prescriptions count/list live
            const pres = await doctorService.getDoctorPrescriptions(account, 1000);
            if (!active) return;
            if (pres?.success) {
              setPrescriptionsCount(pres.count);
              const latestPres = (pres.prescriptions || []).slice(0, 5);
              setRecentPrescriptions(latestPres);
            }
            // Refresh records created count and recent records for this doctor
            const patientsRes = await doctorService.getMyPatients();
            if (patientsRes?.success) {
              const pts = patientsRes.patients || [];
              const allRecords = [];
              for (const p of pts.slice(0, 25)) {
                try {
                  const hist = await doctorService.getPatientHistory(p.walletAddress);
                  if (hist?.success && Array.isArray(hist.records)) {
                    const mine = hist.records.filter(r => (r.doctorAddress || '').toLowerCase() === account.toLowerCase());
                    allRecords.push(...mine);
                  }
                } catch {}
              }
              setRecordsCount(allRecords.length);
              allRecords.sort((a, b) => b.timestamp - a.timestamp);
              const latestRecs = allRecords.slice(0, 5);
              setRecentRecords(latestRecs);
              // Rebuild consolidated activity on live update
              const recs = (latestRecs || []).map(r => ({
                id: r.id,
                type: 'Record',
                patient: r.patientAddress,
                timestamp: r.timestamp || Date.parse(r.date) || 0,
                date: r.date,
              }));
              const pres = (recentPrescriptions || []).map(p => ({
                id: p.id,
                type: 'Prescription',
                patient: p.patientAddress,
                timestamp: p.timestamp || Date.parse(p.date) || 0,
                date: p.date,
              }));
              const merged = [...recs, ...pres].sort((a,b) => (b.timestamp||0) - (a.timestamp||0)).slice(0, 8);
              setRecentActivity(merged);
            }
          } catch {}
        };
        contract.on('RecordCreated', handler);
        return () => {
          if (contract) {
            try { contract.off('RecordCreated', handler); } catch {}
          }
          active = false;
        };
      } catch {
      }
    };
    const cleanupPromise = setup();
    return () => {
      Promise.resolve(cleanupPromise).then((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, [account]);
  const stats = [
    {
      name: 'My Patients',
      value: String(patientsCount),
      change: '',
      icon: HeartIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Records Created',
      value: String(recordsCount),
      change: '',
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Prescriptions',
      value: String(prescriptionsCount),
      change: '',
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
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
              <h1 className="text-2xl font-bold">{`Welcome back${userProfile?.firstName ? ', ' : ''}${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`}</h1>
              <p className="mt-2 text-green-100">Manage patients, records, and prescriptions</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <UserIcon className="h-12 w-12" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/doctor/my-patients')}
                className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <HeartIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-medium text-gray-900">My Patients</h3>
                  <p className="text-sm text-gray-500">Browse and manage patients</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/doctor/get-patient-details')}
                className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <DocumentTextIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-medium text-gray-900">Get Patient Details</h3>
                  <p className="text-sm text-gray-500">Access records and IPFS</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/doctor/create-record')}
                className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                  <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-medium text-gray-900">Create Record</h3>
                  <p className="text-sm text-gray-500">Add a new patient record</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/doctor/analytics')}
                className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-medium text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-500">View your activity insights</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {/* Recent Activity (combined) */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map(item => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      {item.type === 'Record' ? (
                        <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-4" />
                      ) : (
                        <ClipboardDocumentListIcon className="h-8 w-8 text-purple-500 mr-4" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.patient}</p>
                        <p className="text-sm text-gray-500">{item.type}</p>
                        <p className="text-xs text-gray-400">{item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'Record' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {item.type}
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">Create a record or prescription to see it here.</p>
              </div>
            )}
          </div>
        </div>

        {/* end */}
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
