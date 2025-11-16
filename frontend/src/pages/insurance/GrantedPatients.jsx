import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProvider } from '../../utils/web3';
import { getGranted, getApplication } from '../../services/insuranceService';

const PAGE_SIZE = 50;

const GrantedPatients = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);

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

      const addrs = await getGranted(page * PAGE_SIZE, PAGE_SIZE);
      const detailed = await Promise.all(addrs.map(async (addr) => {
        const app = await getApplication(addr);
        return {
          patient: addr,
          decidedAt: Number(app.decidedAt || 0),
          reviewer: app.reviewer,
        };
      }));
      setRows(detailed);
    } catch (e) {
      setError(e?.message || 'Failed to load granted patients');
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
  }, [page]);

  const filtered = useMemo(() => rows.filter(r => !query || r.patient.toLowerCase().includes(query.toLowerCase())), [rows, query]);

  return (
    <DashboardLayout userRole="insurance" userProfile={{}} walletAddress={walletAddress} networkStatus={networkStatus}>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-lg font-semibold">View Granted Patients</div>
          <input className="border rounded px-3 py-2" placeholder="Search wallet" value={query} onChange={(e)=>setQuery(e.target.value)} />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b">Granted</div>
          {loading && <div className="p-4 text-sm text-gray-500">Loading...</div>}
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600">
                    <th className="px-4 py-2">Patient</th>
                    <th className="px-4 py-2">Reviewer</th>
                    <th className="px-4 py-2">Granted At</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r)=> (
                    <tr key={r.patient} className="border-t text-sm hover:bg-slate-50 hover:shadow-sm transition-colors">
                      <td className="px-4 py-2 font-mono">{r.patient}</td>
                      <td className="px-4 py-2 font-mono">{r.reviewer}</td>
                      <td className="px-4 py-2">{r.decidedAt ? new Date(r.decidedAt*1000).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 flex justify-between items-center border-t bg-slate-50/60">
            <button
              className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 text-sm disabled:opacity-50"
              disabled={page===0}
              onClick={()=>setPage(Math.max(0,page-1))}
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">Page {page+1}</span>
            <button
              className="px-3 py-1 border rounded-lg bg-white hover:bg-slate-50 text-sm"
              onClick={()=>setPage(page+1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GrantedPatients;
