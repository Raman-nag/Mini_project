import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getHospitalContract, getEMRSystemContract } from '../../utils/contract';
import { ensureCorrectNetwork, getProvider, sendTx } from '../../utils/web3';

const Search = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [entities, setEntities] = useState([]); // {type,name,registrationNumber,address,isActive}
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [etype, setEtype] = useState('all');
  const [connectedWallet, setConnectedWallet] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [viewMeta, setViewMeta] = useState({ registeredAt: null, lastActivityAt: null });
  const [editing, setEditing] = useState(false);
  const [editVals, setEditVals] = useState({ name: '', registrationNumber: '' });
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return entities.filter(e => {
      const matchesText = !q || [e.name, e.address, e.registrationNumber].some(v => (v || '').toLowerCase().includes(q));
      const matchesStatus = status === 'all' || (status === 'active' ? e.isActive : !e.isActive);
      const matchesType = etype === 'all' || e.type === etype;
      return matchesText && matchesStatus && matchesType;
    });
  }, [entities, query, status, etype]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      await ensureCorrectNetwork();
      try {
        const signer = getProvider()?.getSigner?.();
        const addr = signer ? (await signer.getAddress()) : null;
        if (addr) setConnectedWallet(addr);
      } catch {}
      const hospital = await getHospitalContract();
      const emr = await getEMRSystemContract();
      const rows = [];

      // Hospitals from HospitalManagement (include only existing + active when status filter demands)
      const regLogs = await hospital.queryFilter(hospital.filters.HospitalRegistered());
      const addresses = Array.from(new Set(regLogs.map(l => (l.args?.hospitalAddress || l.args?.[0])))).filter(Boolean);
      for (const addr of addresses) {
        let exists = false;
        try { exists = await hospital.registeredHospitals(addr); } catch { exists = false; }
        if (!exists) continue; // filter out non-existent
        try {
          const details = await hospital.getHospitalDetails(addr);
          const isActive = Boolean(details[2]);
          // Merge with EMR profile for up-to-date name/registration
          let name = details[0];
          let registrationNumber = details[1];
          try {
            const prof = await emr.hospitalAdmins(addr);
            if (prof && prof.wallet && prof.active) {
              if (prof.name && prof.name.length > 0) name = prof.name;
              if (prof.registrationNumber && prof.registrationNumber.length > 0) registrationNumber = prof.registrationNumber;
            }
          } catch {}
          rows.push({ type: 'hospital', address: addr, name, registrationNumber, isActive });
        } catch { /* skip if details fail */ }
      }

      // Admin entities from EMRSystem
      const [hList, iList, rList] = await Promise.all([
        emr.getHospitalAdminList(),
        emr.getInsuranceAdminList(),
        emr.getResearchAdminList(),
      ]);

      const pushProfiles = async (list, getter, type) => {
        for (const a of list) {
          try {
            const p = await getter(a);
            if (!p.active) continue; // only live
            rows.push({ type, address: a, name: p.name, registrationNumber: p.registrationNumber, isActive: p.active, source: 'emr' });
          } catch {}
        }
      };

      await Promise.all([
        pushProfiles(hList, emr.hospitalAdmins, 'hospital'),
        pushProfiles(iList, emr.insuranceAdmins, 'insurance'),
        pushProfiles(rList, emr.researchAdmins, 'research'),
      ]);

      // De-duplicate by (type,address); prefer entries that come from HospitalManagement (no 'source')
      const map = new Map();
      for (const r of rows) {
        const key = `${r.type}:${(r.address || '').toLowerCase()}`;
        const existing = map.get(key);
        if (!existing) { map.set(key, r); continue; }
        // Prefer on-chain HospitalManagement-backed row over EMR-sourced row
        if (existing.source === 'emr' && !r.source) map.set(key, r);
      }
      setEntities(Array.from(map.values()));
    } catch (e) {
      setError(e?.message || 'Failed to load entities');
      setEntities([]);
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

  const openDetails = async (entity) => {
    setViewData(entity);
    setViewOpen(true);
    setEditing(false);
    setEditVals({ name: entity.name || '', registrationNumber: entity.registrationNumber || '' });
    setTxError('');
    try {
      const provider = getProvider();
      const hospital = await getHospitalContract();
      const emr = await getEMRSystemContract();
      let registeredAt = null; let lastActivityAt = null;
      if (entity.type === 'hospital') {
        // registration and last activity from Hospital events
        const reg = await hospital.queryFilter(hospital.filters.HospitalRegistered(entity.address));
        const deact = await hospital.queryFilter(hospital.filters.HospitalDeactivated(entity.address));
        const all = [...reg, ...deact];
        if (reg.length > 0) {
          const b = await provider.getBlock(reg[0].blockNumber); registeredAt = b?.timestamp || null;
        }
        if (all.length > 0) {
          const last = all.reduce((a,b)=> (a.blockNumber>b.blockNumber?a:b));
          const bl = await provider.getBlock(last.blockNumber); lastActivityAt = bl?.timestamp || null;
        }
      } else {
        // admin entities via EMRSystem events per wallet
        const addr = entity.address;
        const filters = [];
        if (entity.type === 'hospital') {
          // already handled
        } else if (entity.type === 'insurance') {
          filters.push(emr.filters.InsuranceAdminAdded(addr));
          filters.push(emr.filters.InsuranceAdminUpdated(addr));
          filters.push(emr.filters.InsuranceAdminRemoved(addr));
        } else if (entity.type === 'research') {
          filters.push(emr.filters.ResearchAdminAdded(addr));
          filters.push(emr.filters.ResearchAdminUpdated(addr));
          filters.push(emr.filters.ResearchAdminRemoved(addr));
        } else {
          filters.push(emr.filters.HospitalAdminAdded(addr));
          filters.push(emr.filters.HospitalAdminUpdated(addr));
          filters.push(emr.filters.HospitalAdminRemoved(addr));
        }
        const logs = [];
        for (const f of filters) {
          try { const ls = await emr.queryFilter(f); logs.push(...ls); } catch {}
        }
        if (logs.length > 0) {
          const first = logs.reduce((a,b)=> (a.blockNumber<b.blockNumber?a:b));
          const last = logs.reduce((a,b)=> (a.blockNumber>b.blockNumber?a:b));
          try { const bf = await provider.getBlock(first.blockNumber); registeredAt = bf?.timestamp || null; } catch {}
          try { const bl = await provider.getBlock(last.blockNumber); lastActivityAt = bl?.timestamp || null; } catch {}
        }
      }
      setViewMeta({ registeredAt, lastActivityAt });
    } catch {
      setViewMeta({ registeredAt: null, lastActivityAt: null });
    }
  };

  const onSave = async () => {
    if (!viewData) return;
    setTxLoading(true);
    setTxError('');
    try {
      await ensureCorrectNetwork();
      const emr = await getEMRSystemContract();
      const { address } = viewData;
      if (viewData.type === 'hospital') {
        await sendTx(emr.updateHospitalAdmin(address, editVals.name, editVals.registrationNumber, true));
      } else if (viewData.type === 'insurance') {
        await sendTx(emr.updateInsuranceAdmin(address, editVals.name, editVals.registrationNumber, true));
      } else if (viewData.type === 'research') {
        await sendTx(emr.updateResearchAdmin(address, editVals.name, editVals.registrationNumber, true));
      }
      setEditing(false);
      await load();
      // refresh details view
      const updated = entities.find(e => e.address === address && e.type === viewData.type) || viewData;
      setViewData(updated);
    } catch (e) {
      setTxError(e?.message || 'Save failed');
    } finally { setTxLoading(false); }
  };

  const onRevoke = async () => {
    if (!viewData) return;
    setTxLoading(true);
    setTxError('');
    try {
      await ensureCorrectNetwork();
      const { address } = viewData;
      if (viewData.type === 'hospital') {
        const hospital = await getHospitalContract();
        await sendTx(hospital.deactivateHospital(address));
      } else {
        const emr = await getEMRSystemContract();
        if (viewData.type === 'insurance') {
          await sendTx(emr.removeInsuranceAdmin(address));
        } else if (viewData.type === 'research') {
          await sendTx(emr.removeResearchAdmin(address));
        } else {
          await sendTx(emr.removeHospitalAdmin(address));
        }
      }
      setViewOpen(false);
      await load();
    } catch (e) {
      setTxError(e?.message || 'Revoke failed');
    } finally { setTxLoading(false); }
  };

  return (
    <DashboardLayout userRole="admin" userProfile={{ firstName: 'Admin' }} walletAddress={connectedWallet} networkStatus={'connected'}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Search & Filter</h1>
          <p className="text-slate-600">Search across on-chain entities by name, address, reg no, or status.</p>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

        <div className="bg-white rounded-lg shadow p-5 flex gap-3 flex-wrap">
          <input className="border rounded px-3 py-2 flex-1 min-w-[240px]" placeholder="Search name, address, reg no…" value={query} onChange={(e)=>setQuery(e.target.value)} />
          <select className="border rounded px-3 py-2" value={etype} onChange={(e)=>setEtype(e.target.value)}>
            <option value="all">All entities</option>
            <option value="hospital">Hospital</option>
            <option value="insurance">Insurance</option>
            <option value="research">Research</option>
          </select>
          <select className="border rounded px-3 py-2" value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold">Results ({filtered.length})</h2>
          </div>
          <div className="p-5 overflow-x-auto">
            {loading && <div className="text-slate-500">Loading…</div>}
            {!loading && filtered.length === 0 && <div className="text-slate-500">No matching entities.</div>}
            {!loading && filtered.length > 0 && (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Entity</th>
                    <th className="py-2 pr-4">Reg. No</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={`${e.type}-${e.address}`} className="border-t">
                      <td className="py-2 pr-4">{e.name || '—'}</td>
                      <td className="py-2 pr-4 capitalize">{e.type}</td>
                      <td className="py-2 pr-4">{e.registrationNumber || '—'}</td>
                      <td className="py-2 pr-4"><span className={`px-2 py-1 rounded text-xs ${e.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{e.isActive ? 'Active' : 'Suspended'}</span></td>
                      <td className="py-2 pr-4">
                        <button onClick={()=>openDetails(e)} className="px-3 py-1 rounded border">Show Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {viewOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">{viewData?.name || 'Details'}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Entity</span><span className="capitalize">{viewData?.type}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Registration</span><span>{viewData?.registrationNumber || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Status</span><span>{viewData?.isActive ? 'Active' : 'Suspended'}</span></div>
                <div className="break-all"><span className="text-slate-600">Address</span><div className="font-mono text-xs">{viewData?.address}</div></div>
                <div className="flex justify-between"><span className="text-slate-600">Registered At</span><span>{viewMeta.registeredAt ? new Date(viewMeta.registeredAt*1000).toLocaleString() : '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Last Activity</span><span>{viewMeta.lastActivityAt ? new Date(viewMeta.lastActivityAt*1000).toLocaleString() : '—'}</span></div>
              </div>
              {(viewData?.source === 'emr' || viewData?.type === 'hospital') && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  {!editing ? (
                    <div className="flex justify-between gap-2">
                      <button disabled={!viewData?.isActive} onClick={()=>setEditing(true)} className="px-3 py-2 border rounded" title={viewData?.isActive ? '' : 'Editing disabled for suspended accounts'}>Edit</button>
                      {viewData?.isActive ? (
                        <button disabled={txLoading} onClick={onRevoke} className="px-3 py-2 rounded border border-red-300 text-red-700">Revoke</button>
                      ) : (
                        <button disabled className="px-3 py-2 rounded border text-slate-500" title="Already suspended">Revoke</button>
                      )}
                      <button onClick={()=>setViewOpen(false)} className="px-3 py-2 border rounded">Close</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-700">Name</label>
                        <input className="border rounded px-3 py-2 w-full" value={editVals.name} onChange={(e)=>setEditVals(v=>({...v,name:e.target.value}))} />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-700">Registration Number</label>
                        <input className="border rounded px-3 py-2 w-full" value={editVals.registrationNumber} onChange={(e)=>setEditVals(v=>({...v,registrationNumber:e.target.value}))} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={()=>setEditing(false)} className="px-3 py-2 border rounded">Cancel</button>
                        <button disabled={txLoading} onClick={onSave} className="px-3 py-2 bg-blue-600 text-white rounded">{txLoading? 'Saving…':'Save'}</button>
                      </div>
                    </div>
                  )}
                  {txError && <div className="text-red-600 text-sm">{txError}</div>}
                </div>
              )}
              {/* Non-EMR source handled above; no duplicate footer */}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Search;
