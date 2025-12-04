import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProvider } from '../../utils/web3';
import { getGlobalAnalytics, getAllGroups } from '../../services/researchOrgService';

const ResearchAnalytics = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [globalStats, setGlobalStats] = useState({ groups: 0, patients: 0, worksCompleted: 0 });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Wallet provider not available');
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setNetworkStatus('connected');

      const [global, allGroups] = await Promise.all([
        getGlobalAnalytics(),
        getAllGroups(),
      ]);
      setGlobalStats(global);
      setGroups(allGroups);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e?.message || 'Failed to load analytics');
      setNetworkStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    load();
    const provider = getProvider();
    const onBlock = () => mounted && load();
    provider?.on?.('block', onBlock);
    return () => { mounted = false; provider?.off?.('block', onBlock); };
  }, []);

  const totalGroups = Number(globalStats.groups || 0);
  const totalPatients = Number(globalStats.patients || 0);
  const worksCompleted = Number(globalStats.worksCompleted || 0);

  return (
    <DashboardLayout userRole="research" userProfile={{}} walletAddress={walletAddress} networkStatus={networkStatus}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-cyan-600 to-sky-600 rounded-2xl shadow-md p-5 text-white flex items-center justify-between">
          <div>
            <div className="text-lg md:text-xl font-semibold tracking-tight">Research Analytics</div>
            <div className="text-sm text-cyan-100 mt-1">Live overview of groups, patients, and completed work</div>
          </div>
          {lastUpdated && (
            <div className="text-xs text-cyan-100/80">Last updated: {lastUpdated}</div>
          )}
        </div>

        {loading && <div className="p-4 text-sm text-gray-500">Loading analytics...</div>}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl shadow-md bg-slate-50 ring-1 ring-slate-100 p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Groups</div>
                <div className="mt-2 text-3xl font-bold text-slate-900">{totalGroups}</div>
              </div>
              <div className="rounded-2xl shadow-md bg-emerald-50 ring-1 ring-emerald-100 p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">Patients Involved</div>
                <div className="mt-2 text-3xl font-bold text-emerald-800">{totalPatients}</div>
              </div>
              <div className="rounded-2xl shadow-md bg-amber-50 ring-1 ring-amber-100 p-6">
                <div className="text-xs font-medium uppercase tracking-wide text-amber-700">Works Completed</div>
                <div className="mt-2 text-3xl font-bold text-amber-800">{worksCompleted}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Group metrics</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const csv = [
                        ['Name', 'Group ID', 'Disease', 'Total Patients', 'Works Completed'],
                        ...groups.map((g) => [
                          g.name,
                          g.groupIdHuman,
                          g.diseaseCategory || '',
                          String(Number(g.totalPatients || 0)),
                          String(Number(g.worksCompleted || 0)),
                        ]),
                      ]
                        .map((row) => row.map((v) => `"${(v || '').replace(/"/g, '""')}"`).join(','))
                        .join('\n');
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'research-analytics.csv';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-xs text-sky-600 hover:text-sky-800 font-medium"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        window.print();
                      } catch {
                        // ignore
                      }
                    }}
                    className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                  >
                    Print / Save as PDF
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-80">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Group ID</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Disease</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Patients</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Works Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groups.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                          No groups created yet.
                        </td>
                      </tr>
                    )}
                    {groups.map((g, idx) => (
                      <tr key={`${g.id}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-800">{g.name}</td>
                        <td className="px-3 py-2 text-gray-500">{g.groupIdHuman}</td>
                        <td className="px-3 py-2 text-gray-500">{g.diseaseCategory || '-'}</td>
                        <td className="px-3 py-2 text-gray-800">{Number(g.totalPatients || 0)}</td>
                        <td className="px-3 py-2 text-gray-800">{Number(g.worksCompleted || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResearchAnalytics;
