import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getDoctorContract, getHospitalContract } from '../../utils/contract';
import { ensureCorrectNetwork, getProvider, sendTx } from '../../utils/web3';
import { ethers } from 'ethers';

const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
const HOSPITAL_ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('HOSPITAL_ADMIN_ROLE'));

const AccessControls = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ address: '', role: DEFAULT_ADMIN_ROLE });
  const [txLoading, setTxLoading] = useState(false);
  const [owner, setOwner] = useState('');

  const availableRoles = useMemo(() => ([
    { id: DEFAULT_ADMIN_ROLE, label: 'DEFAULT_ADMIN_ROLE (DoctorManagement)' },
    { id: HOSPITAL_ADMIN_ROLE, label: 'HOSPITAL_ADMIN_ROLE (DoctorManagement)' },
  ]), []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      await ensureCorrectNetwork();
      const doctor = await getDoctorContract();
      const hospital = await getHospitalContract();

      // Owner of HospitalManagement (Ownable)
      try { setOwner(await hospital.owner()); } catch { setOwner(''); }

      // Build role membership from events
      const grants = await doctor.queryFilter(doctor.filters.RoleGranted());
      const revokes = await doctor.queryFilter(doctor.filters.RoleRevoked());
      const revokedMap = new Set(revokes.map(e => `${e.args?.role}:${(e.args?.account || '').toLowerCase()}`));
      const roleMap = new Map();
      grants.forEach(e => {
        const role = (e.args?.role || '').toLowerCase();
        const account = (e.args?.account || '').toLowerCase();
        const key = `${role}:${account}`;
        if (revokedMap.has(key)) return;
        if (!roleMap.has(role)) roleMap.set(role, new Set());
        roleMap.get(role).add(account);
      });
      const result = [];
      for (const r of [DEFAULT_ADMIN_ROLE, HOSPITAL_ADMIN_ROLE]) {
        const id = r.toLowerCase();
        result.push({
          roleId: r,
          label: availableRoles.find(ar => ar.id === r)?.label || r,
          members: Array.from(roleMap.get(id) || [])
        });
      }
      setRoles(result);
    } catch (e) {
      setError(e?.message || 'Failed to load access controls');
      setRoles([]);
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

  const onGrant = async (e) => {
    e.preventDefault();
    setTxLoading(true);
    setError('');
    try {
      const doctor = await getDoctorContract();
      await sendTx(doctor.grantRole(form.role, form.address));
      await load();
    } catch (e) {
      setError(e?.message || 'Grant role failed');
    } finally {
      setTxLoading(false);
    }
  };

  const onRevoke = async (roleId, account) => {
    setTxLoading(true);
    setError('');
    try {
      const doctor = await getDoctorContract();
      await sendTx(doctor.revokeRole(roleId, account));
      await load();
    } catch (e) {
      setError(e?.message || 'Revoke role failed');
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="admin" userProfile={{ firstName: 'Admin' }} walletAddress={''} networkStatus={'connected'}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Access Controls</h1>
          <p className="text-slate-600">Grant/revoke permissions on DoctorManagement. HospitalManagement owner: <span className="font-mono">{owner || '—'}</span></p>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Grant Role</h2>
          <form onSubmit={onGrant} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2" placeholder="0xAddress" value={form.address} onChange={(e)=>setForm(f=>({...f,address:e.target.value}))} required />
            <select className="border rounded px-3 py-2" value={form.role} onChange={(e)=>setForm(f=>({...f,role:e.target.value}))}>
              {availableRoles.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            <button disabled={txLoading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">{txLoading? 'Granting…':'Grant'}</button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map(r => (
            <div key={r.label} className="bg-white rounded-lg shadow">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-semibold">{r.label}</h3>
              </div>
              <div className="p-5">
                {loading && <div className="text-slate-500">Loading…</div>}
                {!loading && r.members.length === 0 && <div className="text-slate-500">No members.</div>}
                <ul className="space-y-2">
                  {r.members.map(m => (
                    <li key={m} className="flex items-center justify-between text-sm">
                      <span className="font-mono">{m}</span>
                      <button onClick={()=>onRevoke(r.roleId, m)} className="px-3 py-1 text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100">Revoke</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccessControls;
