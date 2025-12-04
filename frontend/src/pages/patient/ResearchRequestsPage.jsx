import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProvider } from '../../utils/web3';
import { getMyGroupRequests, respondToGroupRequest } from '../../services/researchOrgService';
import { useToast } from '../../contexts/ToastContext';

const statusLabel = (s) => {
  switch (Number(s)) {
    case 1:
      return { text: 'Pending', className: 'bg-amber-50 text-amber-800' };
    case 2:
      return { text: 'Granted', className: 'bg-emerald-50 text-emerald-800' };
    case 3:
      return { text: 'Rejected', className: 'bg-rose-50 text-rose-800' };
    case 4:
      return { text: 'Revoked', className: 'bg-slate-100 text-slate-700' };
    default:
      return { text: 'Unknown', className: 'bg-gray-100 text-gray-700' };
  }
};

const ResearchRequestsPage = () => {
  const { showSuccess, showError } = useToast();
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
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

      const list = await getMyGroupRequests();
      setRequests(list);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      setError(e?.message || 'Failed to load research requests');
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

  const handleRespond = async (groupId, grant) => {
    setBusyKey(`${groupId}-${grant ? 'grant' : 'reject'}`);
    try {
      await respondToGroupRequest(groupId, grant);
      showSuccess(grant ? 'Consent granted for this group' : 'Consent rejected for this group');
      await load();
    } catch (e) {
      showError(e?.message || 'Failed to submit response');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <DashboardLayout userRole="patient" userProfile={{}} walletAddress={walletAddress} networkStatus={networkStatus}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-600 to-sky-600 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Research Requests</h1>
            <p className="text-emerald-100 mt-1 text-sm md:text-base">Review and manage your consent for research groups.</p>
          </div>
          {lastUpdated && (
            <div className="text-xs text-emerald-100/80">Last updated: {lastUpdated}</div>
          )}
        </div>

        {loading && <div className="p-4 text-sm text-gray-500">Loading research requests...</div>}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Your research groups</h2>
                <p className="text-xs text-gray-500">You can grant or reject access for pending groups at any time.</p>
              </div>
            </div>

            <div className="overflow-auto max-h-96">
              <table className="min-w-full text-[11px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Group</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Purpose</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Disease</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                        No research requests found for your account.
                      </td>
                    </tr>
                  )}
                  {requests.map(({ group, status }) => {
                    const s = statusLabel(status);
                    return (
                      <tr key={group.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <div className="text-gray-900 font-medium text-[11px]">{group.name}</div>
                          <div className="text-gray-500 font-mono text-[10px]">ID: {group.groupIdHuman}</div>
                        </td>
                        <td className="px-3 py-2 text-gray-600 text-[11px]">{group.purpose || '-'}</td>
                        <td className="px-3 py-2 text-gray-600 text-[11px]">{group.diseaseCategory || '-'}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ${s.className}`}>
                            {s.text}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(status) === 1 ? (
                            <div className="inline-flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleRespond(group.id, true)}
                                disabled={busyKey === `${group.id}-grant`}
                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-semibold hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {busyKey === `${group.id}-grant` ? 'Granting...' : 'Grant'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRespond(group.id, false)}
                                disabled={busyKey === `${group.id}-reject`}
                                className="inline-flex items-center px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-semibold hover:bg-rose-100 disabled:opacity-60"
                              >
                                {busyKey === `${group.id}-reject` ? 'Rejecting...' : 'Reject'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">No actions available</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResearchRequestsPage;
