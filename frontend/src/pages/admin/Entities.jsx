import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getHospitalContract } from '../../utils/contract';
import { ensureCorrectNetwork, getProvider, sendTx } from '../../utils/web3';

const Entities = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [demo, setDemo] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      await ensureCorrectNetwork();
      const hospital = await getHospitalContract();
      // Build hospital list from events (no getter for all items)
      const regLogs = await hospital.queryFilter(hospital.filters.HospitalRegistered());
      const addresses = Array.from(new Set(regLogs.map(l => l.args?.hospitalAddress))).filter(Boolean);
      const rows = [];
      for (const addr of addresses) {
        try {
          const details = await hospital.getHospitalDetails(addr);
          rows.push({
            address: addr,
            name: details[0],
            registrationNumber: details[1],
            isActive: Boolean(details[2]),
            timestamp: Number(details[3]),
            doctorCount: Number(details[4]),
            patientCount: Number(details[5]),
          });
        } catch (e) {
          // If getHospitalDetails requires existence, fallback to mapping values where possible
          rows.push({ address: addr, name: '', registrationNumber: '', isActive: false, timestamp: 0, doctorCount: 0, patientCount: 0 });
        }
      }
      setHospitals(rows);
      // Provide demo rows if empty for dev UX
      if (rows.length === 0) {
        setDemo([
          { address: '0xDemoHospital1', name: 'Demo Hospital A', registrationNumber: 'H-0001', isActive: true, doctorCount: 3, patientCount: 12 },
          { address: '0xDemoHospital2', name: 'Demo Hospital B', registrationNumber: 'H-0002', isActive: false, doctorCount: 0, patientCount: 0 },
        ]);
      } else {
        setDemo([]);
      }
    } catch (e) {
      setError(e?.message || 'Failed to load entities');
      setHospitals([]);
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

  const onDeactivate = async (address) => {
    setTxLoading(true);
    setError('');
    try {
      await ensureCorrectNetwork();
      const hospital = await getHospitalContract();
      await sendTx(hospital.deactivateHospital(address));
      await load();
    } catch (e) {
      setError(e?.message || 'Failed to deactivate entity');
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="admin" userProfile={{ firstName: 'Admin' }} walletAddress={''} networkStatus={'connected'}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Entities</h1>
          <p className="text-slate-600">View and manage hospitals. Insurers and research institutes can be added later.</p>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

        {/* Add Entity (disabled until contract supports admin registration) */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Add New Entity</h2>
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">Requires contract update to admin-register hospitals</span>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input disabled placeholder="Wallet Address" className="border rounded px-3 py-2 bg-slate-50" />
            <input disabled placeholder="Name" className="border rounded px-3 py-2 bg-slate-50" />
            <input disabled placeholder="Registration Number" className="border rounded px-3 py-2 bg-slate-50" />
          </div>
          <div className="mt-3">
            <button disabled className="px-4 py-2 rounded bg-slate-200 text-slate-600 cursor-not-allowed">Add Entity</button>
          </div>
        </div>

        {/* Hospitals Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold">Hospitals</h2>
          </div>
          <div className="p-5 overflow-x-auto">
            {loading && <div className="text-slate-500">Loading…</div>}
            {!loading && hospitals.length === 0 && demo.length === 0 && (
              <div className="text-slate-500">No hospitals registered.</div>
            )}
            {!loading && hospitals.length > 0 && (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Address</th>
                    <th className="py-2 pr-4">Reg. No</th>
                    <th className="py-2 pr-4">Contact</th>
                    <th className="py-2 pr-4">License</th>
                    <th className="py-2 pr-4">Doctors</th>
                    <th className="py-2 pr-4">Patients</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.slice((page-1)*pageSize, page*pageSize).map(h => (
                    <tr key={h.address} className="border-t">
                      <td className="py-2 pr-4">{h.name || '—'}</td>
                      <td className="py-2 pr-4 font-mono">{h.address}</td>
                      <td className="py-2 pr-4">{h.registrationNumber || '—'}</td>
                      <td className="py-2 pr-4">—</td>
                      <td className="py-2 pr-4">—</td>
                      <td className="py-2 pr-4">{h.doctorCount}</td>
                      <td className="py-2 pr-4">{h.patientCount}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-1 rounded text-xs ${h.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{h.isActive ? 'Active' : 'Suspended'}</span>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <button
                            disabled={txLoading || !h.isActive}
                            onClick={() => onDeactivate(h.address)}
                            className="px-3 py-1 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                          >
                            Deactivate
                          </button>
                          <button disabled className="px-3 py-1 rounded border border-slate-300 text-slate-400 cursor-not-allowed" title="Update requires contract support">Update</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && hospitals.length > pageSize && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-slate-600">Page {page} of {Math.ceil(hospitals.length / pageSize)}</div>
                <div className="flex gap-2">
                  <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 rounded border disabled:opacity-50">Previous</button>
                  <button disabled={page*pageSize>=hospitals.length} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 rounded border disabled:opacity-50">Next</button>
                </div>
              </div>
            )}

            {!loading && hospitals.length === 0 && demo.length > 0 && (
              <div>
                <div className="mb-2 text-slate-500">Demo data (no on-chain hospitals yet):</div>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-600">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Address</th>
                      <th className="py-2 pr-4">Reg. No</th>
                      <th className="py-2 pr-4">Doctors</th>
                      <th className="py-2 pr-4">Patients</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demo.map(h => (
                      <tr key={h.address} className="border-t">
                        <td className="py-2 pr-4">{h.name}</td>
                        <td className="py-2 pr-4 font-mono">{h.address}</td>
                        <td className="py-2 pr-4">{h.registrationNumber}</td>
                        <td className="py-2 pr-4">{h.doctorCount}</td>
                        <td className="py-2 pr-4">{h.patientCount}</td>
                        <td className="py-2 pr-4"><span className={`px-2 py-1 rounded text-xs ${h.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{h.isActive ? 'Active' : 'Suspended'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Entities;
