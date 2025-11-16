import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  HeartIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { getHospitalContract } from '../utils/contract';
import { getProvider } from '../utils/web3';
import hospitalService from '../services/hospitalService';

const HospitalDashboard = () => {
  const [userProfile, setUserProfile] = useState({ firstName: '', lastName: '', role: 'Hospital Administrator' });
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connected');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalDoctors: '—',
    totalPatients: '—',
    totalRecords: '—'
  });

  useEffect(() => {
    const loadHospital = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const provider = getProvider();
        if (!provider) throw new Error('Wallet provider not available');
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        const hospitalContract = await getHospitalContract();
        let details;
        try {
          details = await hospitalContract.getHospitalDetails(address);
        } catch (_) {
          // fallback if only mapping exists
          details = await hospitalContract.hospitals?.(address);
        }

        const name = details?.name || '';
        setUserProfile({ firstName: name, lastName: '', role: 'Hospital Administrator' });
        setNetworkStatus('connected');
      } catch (e) {
        console.error('Failed to load hospital data:', e);
        setError(e?.message || 'Failed to load hospital data');
        setNetworkStatus('disconnected');
      } finally {
        setIsLoading(false);
      }
    };
    loadHospital();
  }, []);

  const statCards = useMemo(() => ([
    {
      name: 'Total Doctors',
      value: String(stats.totalDoctors ?? '—'),
      change: '',
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Active Patients',
      value: String(stats.totalPatients ?? '—'),
      change: '',
      icon: HeartIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Medical Records',
      value: String(stats.totalRecords ?? '—'),
      change: '',
      icon: DocumentTextIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]), [stats]);

  

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const metrics = await hospitalService.getHospitalMetrics();
        if (!mounted) return;
        setStats({
          totalDoctors: metrics?.doctors || 0,
          totalPatients: metrics?.patients || 0,
          totalRecords: metrics?.records || 0
        });
      } catch (e) {
        console.warn('Failed to load metrics', e);
      }
    };
    load();
    const provider = getProvider();
    const onBlock = () => load();
    provider?.on?.('block', onBlock);
    return () => { mounted = false; provider?.off?.('block', onBlock); };
  }, []);

  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activityError, setActivityError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadActivity = async () => {
      setLoadingActivity(true);
      setActivityError(null);
      try {
        const resp = await hospitalService.getRecentActivity(20);
        const activities = Array.isArray(resp?.activities) ? resp.activities : [];
        const normalized = activities.map((a, idx) => {
          if (a.type === 'doctor_registered') {
            const name = a?.doctor?.name && a.doctor.name.trim().length > 0
              ? a.doctor.name
              : (a?.doctor?.walletAddress ? `${a.doctor.walletAddress.slice(0,6)}...${a.doctor.walletAddress.slice(-4)}` : 'Doctor');
            const msg = `Dr. ${name} joined the hospital`;
            return { id: idx, icon: UserGroupIcon, color: 'text-blue-500', message: msg, time: new Date((a.timestamp || 0) * 1000).toLocaleString() };
          }
          return { id: idx, icon: DocumentTextIcon, color: 'text-green-500', message: a.message, time: new Date((a.timestamp || 0) * 1000).toLocaleString() };
        });
        if (mounted) setRecentActivities(normalized);
      } catch (e) {
        if (mounted) {
          setActivityError(e?.message || 'Failed to load recent activity');
          setRecentActivities([]);
        }
      } finally {
        if (mounted) setLoadingActivity(false);
      }
    };
    loadActivity();
    const provider = getProvider();
    const onBlock = () => loadActivity();
    provider?.on?.('block', onBlock);
    return () => { mounted = false; provider?.off?.('block', onBlock); };
  }, []);

  return (
    <DashboardLayout 
      userRole="hospital" 
      userProfile={userProfile}
      walletAddress={walletAddress}
      networkStatus={networkStatus}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">Hospital Management Dashboard</h1>
              <p className="mt-2 text-blue-100">
                {userProfile.firstName ? (
                  <span className="block max-w-full truncate sm:whitespace-normal sm:break-words sm:line-clamp-2">
                    Welcome back, {userProfile.firstName}
                  </span>
                ) : 'Manage your healthcare ecosystem with blockchain-powered security'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <BuildingOfficeIcon className="h-12 w-12" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
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

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/hospital/add-doctor" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Add Doctor</h3>
                  <p className="text-sm text-gray-500">Register new doctor</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
              </Link>

              <Link to="/hospital/patients" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <HeartIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">View Patients</h3>
                  <p className="text-sm text-gray-500">Manage patient records</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
              </Link>

              <Link to="/hospital/analytics" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Analytics</h3>
                  <p className="text-sm text-gray-500">View system analytics</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 ml-auto" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {loadingActivity && (
                <div className="text-sm text-gray-500">Loading activity...</div>
              )}
              {!loadingActivity && recentActivities.length === 0 && !activityError && (
                <div className="text-sm text-gray-500">No recent on-chain activity found.</div>
              )}
              {activityError && (
                <div className="text-sm text-red-600">{activityError}</div>
              )}
              {!loadingActivity && recentActivities.map((activity) => {
                const IconComponent = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start">
                    <div className={`p-2 rounded-full ${activity.color} bg-opacity-10`}>
                      <IconComponent className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Medical Records section removed as per requirements */}
      </div>
    </DashboardLayout>
  );
};

export default HospitalDashboard;
