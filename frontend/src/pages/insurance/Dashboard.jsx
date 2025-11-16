import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProvider } from '../../utils/web3';
import { getTotals } from '../../services/insuranceService';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon, XCircleIcon, ClipboardDocumentListIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const InsuranceDashboard = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [stats, setStats] = useState({ granted: 0, rejected: 0, pending: 0 });
  const [lastUpdated, setLastUpdated] = useState('');

  const loadStats = async () => {
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Wallet provider not available');
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setNetworkStatus('connected');

      const totals = await getTotals();
      const granted = Number(totals?.granted || 0);
      const rejected = Number(totals?.rejected || 0);
      const pending = Number(totals?.pending || 0);
      setStats({ granted, rejected, pending });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      setNetworkStatus('disconnected');
    }
  };

  useEffect(() => {
    let mounted = true;
    const doLoad = async () => {
      await loadStats();
    };
    doLoad();

    const provider = getProvider();
    const onBlock = () => mounted && loadStats();
    provider?.on?.('block', onBlock);
    return () => { mounted = false; provider?.off?.('block', onBlock); };
  }, []);

  const cards = useMemo(() => ([
    {
      name: 'Applications Granted',
      value: String(stats.granted),
      accent: 'text-emerald-700',
      bg: 'bg-emerald-50',
      ring: 'ring-emerald-100',
      Icon: CheckCircleIcon,
    },
    {
      name: 'Pending Requests',
      value: String(stats.pending),
      accent: 'text-amber-700',
      bg: 'bg-amber-50',
      ring: 'ring-amber-100',
      Icon: ClockIcon,
    },
    {
      name: 'Applications Rejected',
      value: String(stats.rejected),
      accent: 'text-rose-700',
      bg: 'bg-rose-50',
      ring: 'ring-rose-100',
      Icon: XCircleIcon,
    },
  ]), [stats]);

  return (
    <DashboardLayout userRole="insurance" userProfile={{}} walletAddress={walletAddress} networkStatus={networkStatus}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Insurance Admin Dashboard</h1>
          <p className="text-blue-100 mt-1 text-sm md:text-base">Manage insurance applications and patient access</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <div
              key={c.name}
              className={`rounded-2xl shadow-md ${c.bg} ${c.ring} ring-1 p-5 flex items-center justify-between transform transition-all hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/70">
                  <c.Icon className={`h-6 w-6 ${c.accent}`} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-600/90">{c.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{c.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lastUpdated && (
          <p className="text-xs text-gray-500">Last updated: {lastUpdated}</p>
        )}

        <div className="bg-white rounded-2xl shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/insurance/check-patient-data"
              className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 hover:shadow-md transition-all"
            >
              <ClipboardDocumentListIcon className="h-6 w-6" />
              <div className="text-sm font-medium">Check Patient Data</div>
            </Link>
            <Link
              to="/insurance/granted"
              className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:shadow-md transition-all"
            >
              <UserGroupIcon className="h-6 w-6" />
              <div className="text-sm font-medium">View Granted Patients</div>
            </Link>
            <Link
              to="/insurance/rejected"
              className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 hover:shadow-md transition-all"
            >
              <XCircleIcon className="h-6 w-6" />
              <div className="text-sm font-medium">View Rejected Patients</div>
            </Link>
            <Link
              to="/insurance/analytics"
              className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 text-indigo-800 hover:bg-indigo-100 hover:shadow-md transition-all"
            >
              <ChartBarIcon className="h-6 w-6" />
              <div className="text-sm font-medium">Analytics</div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InsuranceDashboard;
