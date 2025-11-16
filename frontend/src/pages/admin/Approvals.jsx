import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getHospitalContract } from '../../utils/contract';
import { ensureCorrectNetwork, getProvider, sendTx } from '../../utils/web3';

const Approvals = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState([]);
  const [demo, setDemo] = useState([]);
  const [txLoading, setTxLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      await ensureCorrectNetwork();
      const hospital = await getHospitalContract();
      // No explicit approvals queue in contract; show empty unless demo enabled
      setPending([]);
      if (pending.length === 0) {
        setDemo([
          { type: 'Hospital', name: 'Demo Hospital C', address: '0xDemoPending1', registrationNumber: 'H-0003' },
          { type: 'Hospital', name: 'Demo Hospital D', address: '0xDemoPending2', registrationNumber: 'H-0004' },
        ]);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load approvals');
      setPending([]);
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

  const onApprove = async (req) => {
    // Requires contract support. Left as no-op with UI feedback.
    alert('Approve action requires contract support. Please implement admin-only registration in HospitalManagement.');
  };
  const onReject = async (req) => {
    alert('Reject action requires contract support.');
  };

  return (
    <DashboardLayout userRole="admin" userProfile={{ firstName: 'Admin' }} walletAddress={''} networkStatus={'connected'}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Approvals</h1>
          <p className="text-slate-600">Pending onboarding requests. Demo list shown until contracts support approvals.</p>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold">Pending Requests</h2>
          </div>
          <div className="p-5">
            {loading && <div className="text-slate-500">Loading…</div>}
            {!loading && pending.length === 0 && demo.length === 0 && (
              <div className="text-slate-500">No pending requests.</div>
            )}
            {!loading && (pending.length > 0 || demo.length > 0) && (
              <ul className="space-y-3">
                {(pending.length > 0 ? pending : demo).map((r, idx) => (
                  <li key={idx} className="border rounded p-3 flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">{r.type}: {r.name}</div>
                      <div className="text-slate-500 font-mono">{r.address}</div>
                      {r.registrationNumber && <div className="text-slate-500">Reg: {r.registrationNumber}</div>}
                    </div>
                    <div className="flex gap-2">
                      <button disabled={txLoading} onClick={()=>onApprove(r)} className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50">Approve</button>
                      <button disabled={txLoading} onClick={()=>onReject(r)} className="px-3 py-1 rounded bg-rose-600 text-white disabled:opacity-50">Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Approvals;
