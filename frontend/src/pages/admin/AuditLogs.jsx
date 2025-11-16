import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDoctorContract, getHospitalContract, getEMRSystemContract } from '../../utils/contract';
import { getProvider } from '../../utils/web3';

const eventTitle = (e) => {
  if (e.name === 'RoleGranted') return `RoleGranted(${e.args?.role?.slice?.(0,10)}…) to ${e.args?.account}`;
  if (e.name === 'RoleRevoked') return `RoleRevoked(${e.args?.role?.slice?.(0,10)}…) from ${e.args?.account}`;
  if (e.name === 'HospitalRegistered') return `HospitalRegistered ${e.args?.hospitalAddress}`;
  if (e.name === 'HospitalDeactivated') return `HospitalDeactivated ${e.args?.hospitalAddress}`;
  if (e.name === 'DoctorRegistered') return `DoctorRegistered ${e.args?.doctorAddress}`;
  return e.name;
};

const AuditLogs = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ search: '', type: 'all', entity: 'all', start: '', end: '' });

  const filtered = useMemo(() => {
    const s = filter.search.toLowerCase();
    return logs.filter(l => {
      if (filter.type !== 'all' && l.name !== filter.type) return false;
      if (filter.entity !== 'all' && l.entity !== filter.entity) return false;
      if (filter.start) {
        const ts = l.timestamp || 0; if (ts < new Date(filter.start).getTime()/1000) return false;
      }
      if (filter.end) {
        const ts = l.timestamp || 0; if (ts > new Date(filter.end).getTime()/1000 + 86399) return false;
      }
      if (!s) return true;
      return (
        (l.name || '').toLowerCase().includes(s) ||
        (l.title || '').toLowerCase().includes(s) ||
        (l.tx || '').toLowerCase().includes(s) ||
        (l.actor || '').toLowerCase().includes(s)
      );
    });
  }, [logs, filter]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const doctor = await getDoctorContract();
      const hospital = await getHospitalContract();
      const emr = await getEMRSystemContract();
      const provider = getProvider();
      const evs = [];
      const addLog = async (name, l, entity) => {
        let actor = '';
        try { const tx = await provider.getTransaction(l.transactionHash); actor = tx?.from || ''; } catch {}
        let timestamp = undefined;
        try { const b = await provider.getBlock(l.blockNumber); timestamp = b?.timestamp; } catch {}
        evs.push({ name, entity, title: eventTitle({ name, args: l.args }), tx: l.transactionHash, block: Number(l.blockNumber), args: l.args, actor, timestamp });
      };
      const g = await doctor.queryFilter(doctor.filters.RoleGranted()); await Promise.all(g.map(l => addLog('RoleGranted', l, 'system')));
      const r = await doctor.queryFilter(doctor.filters.RoleRevoked()); await Promise.all(r.map(l => addLog('RoleRevoked', l, 'system')));
      const hr = await hospital.queryFilter(hospital.filters.HospitalRegistered()); await Promise.all(hr.map(l => addLog('HospitalRegistered', l, 'hospital')));
      const hd = await hospital.queryFilter(hospital.filters.HospitalDeactivated()); await Promise.all(hd.map(l => addLog('HospitalDeactivated', l, 'hospital')));
      try {
        const dr = await doctor.queryFilter(doctor.filters.DoctorRegistered()); await Promise.all(dr.map(l => addLog('DoctorRegistered', l, 'doctor')));
      } catch {}

      // EMRSystem admin events (exclude HospitalAdmin* to avoid duplicates with HospitalRegistered)
      const evTasks = [
        { f: () => emr.filters.InsuranceAdminAdded(), name: 'InsuranceAdminAdded', entity: 'insurance' },
        { f: () => emr.filters.InsuranceAdminUpdated(), name: 'InsuranceAdminUpdated', entity: 'insurance' },
        { f: () => emr.filters.InsuranceAdminRemoved(), name: 'InsuranceAdminRemoved', entity: 'insurance' },
        { f: () => emr.filters.ResearchAdminAdded(), name: 'ResearchAdminAdded', entity: 'research' },
        { f: () => emr.filters.ResearchAdminUpdated(), name: 'ResearchAdminUpdated', entity: 'research' },
        { f: () => emr.filters.ResearchAdminRemoved(), name: 'ResearchAdminRemoved', entity: 'research' },
      ];
      for (const t of evTasks) {
        try { const ls = await emr.queryFilter(t.f()); await Promise.all(ls.map(l => addLog(t.name, l, t.entity))); } catch {}
      }
      evs.sort((a,b) => b.block - a.block);
      setLogs(evs.slice(0, 200));
    } catch (e) {
      setError(e?.message || 'Failed to load logs');
      setLogs([]);
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

  return (
    <DashboardLayout userRole="admin" userProfile={{ firstName: 'Admin' }} walletAddress={''} networkStatus={'connected'}>
      <div className="p-6 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-slate-600">Stream of admin actions and contract events.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select className="border rounded px-3 py-2" value={filter.type} onChange={(e)=>setFilter(f=>({...f,type:e.target.value}))}>
              <option value="all">All</option>
              <option value="RoleGranted">RoleGranted</option>
              <option value="RoleRevoked">RoleRevoked</option>
              <option value="HospitalRegistered">HospitalRegistered</option>
              <option value="HospitalDeactivated">HospitalDeactivated</option>
              <option value="DoctorRegistered">DoctorRegistered</option>
              <option value="HospitalAdminAdded">HospitalAdminAdded</option>
              <option value="HospitalAdminUpdated">HospitalAdminUpdated</option>
              <option value="HospitalAdminRemoved">HospitalAdminRemoved</option>
              <option value="InsuranceAdminAdded">InsuranceAdminAdded</option>
              <option value="InsuranceAdminUpdated">InsuranceAdminUpdated</option>
              <option value="InsuranceAdminRemoved">InsuranceAdminRemoved</option>
              <option value="ResearchAdminAdded">ResearchAdminAdded</option>
              <option value="ResearchAdminUpdated">ResearchAdminUpdated</option>
              <option value="ResearchAdminRemoved">ResearchAdminRemoved</option>
            </select>
            <select className="border rounded px-3 py-2" value={filter.entity} onChange={(e)=>setFilter(f=>({...f,entity:e.target.value}))}>
              <option value="all">All entities</option>
              <option value="hospital">Hospital</option>
              <option value="insurance">Insurance</option>
              <option value="research">Research</option>
              <option value="doctor">Doctor</option>
              <option value="system">System</option>
            </select>
            <input type="date" className="border rounded px-3 py-2" value={filter.start} onChange={(e)=>setFilter(f=>({...f,start:e.target.value}))} />
            <input type="date" className="border rounded px-3 py-2" value={filter.end} onChange={(e)=>setFilter(f=>({...f,end:e.target.value}))} />
            <input className="border rounded px-3 py-2" placeholder="Search hash, type…" value={filter.search} onChange={(e)=>setFilter(f=>({...f,search:e.target.value}))} />
          </div>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="py-2 px-4">Block</th>
                <th className="py-2 px-4">Event</th>
                <th className="py-2 px-4">Entity</th>
                <th className="py-2 px-4">Details</th>
                <th className="py-2 px-4">Actor</th>
                <th className="py-2 px-4">Tx</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td className="py-3 px-4" colSpan={6}>Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td className="py-3 px-4 text-slate-500" colSpan={6}>No matching logs.</td></tr>
              )}
              {!loading && filtered.map((l, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2 px-4">{l.block}</td>
                  <td className="py-2 px-4">{l.name}</td>
                  <td className="py-2 px-4 capitalize">{l.entity || '—'}</td>
                  <td className="py-2 px-4">{l.title}</td>
                  <td className="py-2 px-4 font-mono">{l.actor ? `${l.actor.slice(0,10)}…` : '—'}</td>
                  <td className="py-2 px-4 font-mono">
                    <a target="_blank" rel="noreferrer" className="text-blue-600 hover:underline" href={`https://etherscan.io/tx/${l.tx}`}>{l.tx?.slice?.(0,10)}…</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AuditLogs;
