import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProvider } from '../../utils/web3';
import { Link } from 'react-router-dom';
import { getGlobalAnalytics, getAllGroups } from '../../services/researchOrgService';
import { UserGroupIcon, ClipboardDocumentListIcon, ChartBarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ResearchDashboard = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [stats, setStats] = useState({ groups: 0, patients: 0, worksCompleted: 0 });
  const [lastUpdated, setLastUpdated] = useState('');

  const load = async () => {
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Wallet provider not available');
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setNetworkStatus('connected');

      const globalStats = await getGlobalAnalytics();
      const groups = await getAllGroups();
      const totalGroups = Number(globalStats.groups || groups.length || 0);
      const patients = Number(globalStats.patients || 0);
      const worksCompleted = Number(globalStats.worksCompleted || 0);

      setStats({ groups: totalGroups, patients, worksCompleted });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      setNetworkStatus('disconnected');
    }
  };

  useEffect(() => {
    let mounted = true;
    const doLoad = async () => {
      await load();
    };
    doLoad();

    const provider = getProvider();
    const onBlock = () => mounted && load();
    provider?.on?.('block', onBlock);
    return () => { mounted = false; provider?.off?.('block', onBlock); };
  }, []);

  const cards = useMemo(() => ([
    {
      name: 'Groups Created',
      value: String(stats.groups),
      accent: 'text-indigo-700',
      bg: 'bg-indigo-50',
      ring: 'ring-indigo-100',
      Icon: UserGroupIcon,
    },
    {
      name: 'Patients Involved',
      value: String(stats.patients),
      accent: 'text-emerald-700',
      bg: 'bg-emerald-50',
      ring: 'ring-emerald-100',
      Icon: CheckCircleIcon,
    },
    {
      name: 'Works Completed',
      value: String(stats.worksCompleted),
      accent: 'text-amber-700',
      bg: 'bg-amber-50',
      ring: 'ring-amber-100',
      Icon: ClipboardDocumentListIcon,
    },
  ]), [stats]);

  return (
    <DashboardLayout userRole="research" userProfile={{}} walletAddress={walletAddress} networkStatus={networkStatus}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-sky-600 to-cyan-600 rounded-2xl p-6 text-white shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Research Organization Dashboard</h1>
          <p className="text-sky-100 mt-1 text-sm md:text-base">Manage research groups, patient consent, and analytics</p>
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
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/research/groups/create"
              className="flex items-center gap-3 p-4 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 hover:shadow-md transition-all"
            >
              <UserGroupIcon className="h-6 w-6" />
              <div className="text-sm font-medium">Create new group</div>
            </Link>
            <Link
              to="/research/groups"
              className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:shadow-md transition-all"
            >
              <ClipboardDocumentListIcon className="h-6 w-6" />
              <div className="text-sm font-medium">View groups</div>
            </Link>
            <Link
              to="/research/analytics"
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

export default ResearchDashboard;
