import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProvider } from '../../utils/web3';
import { getAllGroups, getGroupPatients, getGroupCounts, batchRequestAccess, revokeGroupRequests } from '../../services/researchOrgService';
import { useToast } from '../../contexts/ToastContext';

const ViewGroups = () => {
  const { showSuccess, showError } = useToast();
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [patientList, setPatientList] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Wallet provider not available');
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setNetworkStatus('connected');

      const gs = await getAllGroups();
      const enriched = await Promise.all(
        gs.map(async (g) => {
          const key = g.id;
          let counts = { total: 0, pending: 0, granted: 0, rejected: 0, revoked: 0 };
          try {
            const c = await getGroupCounts(key);
            counts = {
              total: Number(c[0]),
              pending: Number(c[1]),
              granted: Number(c[2]),
              rejected: Number(c[3]),
              revoked: Number(c[4]),
            };
          } catch {}
          return { raw: g, key, counts };
        })
      );
      setGroups(enriched);
    } catch (e) {
      setNetworkStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const doLoad = async () => { await load(); };
    doLoad();
    const provider = getProvider();
    const onBlock = () => mounted && load();
    provider?.on?.('block', onBlock);
    return () => { mounted = false; provider?.off?.('block', onBlock); };
  }, []);

  const openDetails = async (g) => {
    setSelectedGroup(g);
    try {
      const pts = await getGroupPatients(g.key);
      setPatientList(pts);
    } catch (e) {
      showError(e?.message || 'Failed to load patients');
    }
  };

  const closeDetails = () => {
    setSelectedGroup(null);
    setPatientList([]);
  };

  const handleBatchRequest = async (g) => {
    try {
      await batchRequestAccess(g.key);
      showSuccess('Access requests sent to all group patients');
      await load();
    } catch (e) {
      showError(e?.message || 'Failed to send requests');
    }
  };

  const handleRevoke = async (g) => {
    try {
      await revokeGroupRequests(g.key);
      showSuccess('Access revoked for all patients in this group');
      await load();
    } catch (e) {
      showError(e?.message || 'Failed to revoke');
    }
  };

  return (
    <DashboardLayout userRole="research" userProfile={{}} walletAddress={walletAddress} networkStatus={networkStatus}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-sky-600 to-cyan-600 rounded-2xl p-6 text-white shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Research Groups</h1>
          <p className="text-sky-100 mt-1 text-sm md:text-base">Monitor consent status across your groups</p>
        </div>

        {loading && <div className="p-4 text-sm text-gray-500">Loading groups...</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {groups.map((g) => (
            <div
              key={g.key}
              className="rounded-2xl bg-white shadow-md ring-1 ring-sky-50 p-5 flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900 truncate">{g.raw.name}</h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700">
                    {g.raw.diseaseCategory || 'General'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 truncate">ID: {g.raw.groupIdHuman}</p>
                <p className="text-[11px] text-gray-500 truncate">Leader: {g.raw.leaderName}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-slate-500 font-medium">Total</div>
                    <div className="text-slate-900 text-sm font-semibold">{g.counts.total}</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2">
                    <div className="text-emerald-700 font-medium">Granted</div>
                    <div className="text-emerald-900 text-sm font-semibold">{g.counts.granted}</div>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-3 py-2">
                    <div className="text-amber-700 font-medium">Pending</div>
                    <div className="text-amber-900 text-sm font-semibold">{g.counts.pending}</div>
                  </div>
                  <div className="rounded-xl bg-rose-50 px-3 py-2">
                    <div className="text-rose-700 font-medium">Rejected/Revoked</div>
                    <div className="text-rose-900 text-sm font-semibold">{g.counts.rejected + g.counts.revoked}</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openDetails(g)}
                  className="flex-1 inline-flex items-center justify-center rounded-xl border border-sky-200 text-sky-700 text-xs font-medium py-2 hover:bg-sky-50"
                >
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchRequest(g)}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-sky-600 text-white text-xs font-semibold py-2 hover:bg-sky-700"
                >
                  Send Request
                </button>
                <button
                  type="button"
                  onClick={() => handleRevoke(g)}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold py-2 hover:bg-rose-100"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>

        {selectedGroup && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-30">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Group details</h2>
                  <p className="text-[11px] text-gray-500 truncate">{selectedGroup.raw.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closeDetails}
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  Close
                </button>
              </div>
              <div className="px-5 py-4 text-[11px] text-gray-600 border-b border-gray-100">
                <p>ID: {selectedGroup.raw.groupIdHuman}</p>
                <p>Leader: {selectedGroup.raw.leaderName}</p>
                <p>Purpose: {selectedGroup.raw.purpose}</p>
              </div>
              <div className="flex-1 overflow-auto px-5 py-4">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-gray-500">Patient</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {patientList.length === 0 && (
                      <tr>
                        <td className="px-2 py-3 text-gray-400 text-center">No patients linked to this group yet.</td>
                      </tr>
                    )}
                    {patientList.map((p) => (
                      <tr key={p}>
                        <td className="px-2 py-2 font-mono text-[11px]">{p}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewGroups;
