import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProvider } from '../../utils/web3';
import { getTotals } from '../../services/insuranceService';

const Analytics = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [totals, setTotals] = useState({ pending: 0, granted: 0, rejected: 0, cancelled: 0 });
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

      const t = await getTotals();
      setTotals({
        pending: Number(t.pending || 0),
        granted: Number(t.granted || 0),
        rejected: Number(t.rejected || 0),
        cancelled: Number(t.cancelled || 0),
      });
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

  const granted = Number(totals.granted || 0);
  const rejected = Number(totals.rejected || 0);
  const pending = Number(totals.pending || 0);
  const cancelled = Number(totals.cancelled || 0);
  const totalApps = granted + rejected + pending + cancelled;
  const decided = granted + rejected;
  const grantedPct = decided ? Math.round((granted / decided) * 100) : 0;
  const rejectedPct = decided ? Math.round((rejected / decided) * 100) : 0;

  return (
    <DashboardLayout userRole="insurance" userProfile={{}} walletAddress={walletAddress} networkStatus={networkStatus}>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-md p-5 text-white flex items-center justify-between">
          <div>
            <div className="text-lg md:text-xl font-semibold tracking-tight">Insurance Analytics</div>
            <div className="text-sm text-indigo-100 mt-1">Overview of application outcomes</div>
          </div>
          {lastUpdated && (
            <div className="text-xs text-indigo-100/80">Last updated: {lastUpdated}</div>
          )}
        </div>

        {loading && <div className="p-4 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-2xl shadow-md bg-slate-50 ring-1 ring-slate-100 p-6">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Applications</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{totalApps}</div>
            </div>
            <div className="rounded-2xl shadow-md bg-emerald-50 ring-1 ring-emerald-100 p-6">
              <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">Granted</div>
              <div className="mt-2 text-3xl font-bold text-emerald-800">{granted}</div>
              <div className="mt-3 h-3 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-3 bg-emerald-500 rounded-full" style={{ width: `${grantedPct}%` }} />
              </div>
              <div className="text-xs text-emerald-800 mt-1">{grantedPct}% of decided</div>
            </div>
            <div className="rounded-2xl shadow-md bg-rose-50 ring-1 ring-rose-100 p-6">
              <div className="text-xs font-medium uppercase tracking-wide text-rose-700">Rejected</div>
              <div className="mt-2 text-3xl font-bold text-rose-800">{rejected}</div>
              <div className="mt-3 h-3 bg-rose-100 rounded-full overflow-hidden">
                <div className="h-3 bg-rose-500 rounded-full" style={{ width: `${rejectedPct}%` }} />
              </div>
              <div className="text-xs text-rose-800 mt-1">{rejectedPct}% of decided</div>
            </div>
            <div className="rounded-2xl shadow-md bg-amber-50 ring-1 ring-amber-100 p-6">
              <div className="text-xs font-medium uppercase tracking-wide text-amber-700">Pending / Cancelled</div>
              <div className="mt-2 text-xl font-semibold text-amber-800">Pending: {pending}</div>
              <div className="text-xs text-amber-800 mt-1">Cancelled: {cancelled}</div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
