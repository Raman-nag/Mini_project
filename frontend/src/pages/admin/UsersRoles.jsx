import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getEMRSystemContract, getHospitalContract } from '../../utils/contract';
import { ensureCorrectNetwork, sendTx, getProvider } from '../../utils/web3';
import { ADMIN_ADDRESS } from '../../config/contractConfig';

const UsersRoles = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hospitalAdmins, setHospitalAdmins] = useState([]);
  const [insuranceAdmins, setInsuranceAdmins] = useState([]);
  const [researchAdmins, setResearchAdmins] = useState([]);
  const [form, setForm] = useState({ address: '', role: 'hospital' });
  const [profile, setProfile] = useState({ name: '', registrationNumber: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEdit, setCurrentEdit] = useState(null); // {type, wallet, profile}
  const [isAdminWallet, setIsAdminWallet] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null); // {type, address, name, registrationNumber, active}

  const roles = useMemo(() => ([
    { key: 'hospital', label: 'Hospital Admin' },
    { key: 'insurance', label: 'Insurance Admin' },
    { key: 'research', label: 'Research Institute Admin' },
  ]), []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      await ensureCorrectNetwork();
      const emr = await getEMRSystemContract();
      // Determine connected wallet for admin-only gating
      try {
        const provider = getProvider();
        const signer = provider?.getSigner?.();
        const addr = signer ? (await signer.getAddress()) : null;
        if (addr) setConnectedWallet(addr);
        setIsAdminWallet(!!ADMIN_ADDRESS && addr && addr.toLowerCase() === ADMIN_ADDRESS);
      } catch {}

      const loadSet = async (getterList, getterMap) => {
        const addrs = await getterList();
        const rows = [];
        for (const a of addrs) {
          try {
            const p = await getterMap(a);
            if (!p.active) continue; // only show EMR-active admins
            let active = p.active;
            // For hospitals, also reflect HospitalManagement active flag
            try {
              const h = await getHospitalContract();
              const exists = await h.registeredHospitals(a);
              if (exists) {
                const details = await h.getHospitalDetails(a);
                const isActive = Array.isArray(details) ? Boolean(details[2]) : true;
                active = active && isActive;
              }
            } catch {}
            rows.push({ address: a, name: p.name, registrationNumber: p.registrationNumber, active });
          } catch {}
        }
        return rows;
      };

      const [hosp, ins, res] = await Promise.all([
        loadSet(emr.getHospitalAdminList, emr.hospitalAdmins),
        loadSet(emr.getInsuranceAdminList, emr.insuranceAdmins),
        loadSet(emr.getResearchAdminList, emr.researchAdmins),
      ]);
      setHospitalAdmins(hosp);
      setInsuranceAdmins(ins);
      setResearchAdmins(res);
    } catch (e) {
      setError(e?.message || 'Failed to load role members');
      setHospitalAdmins([]);
      setInsuranceAdmins([]);
      setResearchAdmins([]);
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

  const openProfileModal = (type, wallet, existing) => {
    setCurrentEdit({ type, wallet, existing: !!existing });
    setProfile({
      name: existing?.name || '',
      registrationNumber: existing?.registrationNumber || ''
    });
    setModalOpen(true);
  };

  const openView = (type, row) => {
    setViewData({ type, ...row });
    setViewOpen(true);
  };

  const onGrant = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.address || !form.role) return;
    openProfileModal(form.role, form.address, null);
  };

  const onSaveProfile = async () => {
    if (!currentEdit) return;
    setTxLoading(true);
    setError('');
    try {
      await ensureCorrectNetwork();
      const emr = await getEMRSystemContract();
      const t = currentEdit.type;
      if (currentEdit.existing) {
        if (t === 'hospital') await sendTx(emr.updateHospitalAdmin(currentEdit.wallet, profile.name, profile.registrationNumber, true));
        if (t === 'insurance') await sendTx(emr.updateInsuranceAdmin(currentEdit.wallet, profile.name, profile.registrationNumber, true));
        if (t === 'research') await sendTx(emr.updateResearchAdmin(currentEdit.wallet, profile.name, profile.registrationNumber, true));
      } else {
        if (t === 'hospital') {
          // 1) Add to EMRSystem (for system-wide access)
          await sendTx(emr.addHospitalAdmin(currentEdit.wallet, profile.name, profile.registrationNumber));
          // 2) Directly register in HospitalManagement (admin grant, no self-registration needed)
          const h = await getHospitalContract();
          await sendTx(h.registerHospitalByAdmin(currentEdit.wallet, profile.name, profile.registrationNumber));
        }
        if (t === 'insurance') await sendTx(emr.addInsuranceAdmin(currentEdit.wallet, profile.name, profile.registrationNumber));
        if (t === 'research') await sendTx(emr.addResearchAdmin(currentEdit.wallet, profile.name, profile.registrationNumber));
      }
      setModalOpen(false);
      setCurrentEdit(null);
      setForm({ address: '', role: 'hospital' });
      await load();
    } catch (e) {
      setError(e?.message || 'Save failed');
    } finally {
      setTxLoading(false);
    }
  };

  const onRevoke = async (type, address) => {
    setTxLoading(true);
    setError('');
    try {
      await ensureCorrectNetwork();
      const emr = await getEMRSystemContract();
      // For hospitals: set on-chain status to Suspended and avoid double-revoke
      if (type === 'hospital') {
        const h = await getHospitalContract();
        const exists = await h.registeredHospitals(address);
        if (!exists) {
          setError('Hospital does not exist on-chain. Nothing to revoke.');
          return;
        }
        // Read active flag
        let details;
        try { details = await h.getHospitalDetails(address); } catch {}
        const isActive = Array.isArray(details) ? Boolean(details[2]) : true;
        if (isActive) {
          await sendTx(h.deactivateHospital(address)); // sets isActive = false
        } else {
          // Already suspended: skip deactivate
        }
        // Remove EMR role only if currently active in EMR
        try {
          const prof = await emr.hospitalAdmins(address);
          if (prof?.active) {
            await sendTx(emr.removeHospitalAdmin(address));
          }
        } catch (_) { /* ignore */ }
      }
      if (type === 'insurance') await sendTx(emr.removeInsuranceAdmin(address));
      if (type === 'research') await sendTx(emr.removeResearchAdmin(address));
      await load();
    } catch (e) {
      setError(e?.message || 'Revoke failed');
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="admin" userProfile={{ firstName: 'Admin' }} walletAddress={connectedWallet} networkStatus={'connected'}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Users & Roles</h1>
          <p className="text-slate-600">Manage Hospital, Insurance, and Research admins. Only the configured admin wallet can perform these actions.</p>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

        {!isAdminWallet && (
          <div className="p-3 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
            This page is read-only. Connect with the configured admin wallet to add or modify admins.
          </div>
        )}

        {/* Grant Role */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Grant Role</h2>
          <form onSubmit={onGrant} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="0xAdminAddress"
              value={form.address}
              onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
              className="border rounded px-3 py-2"
              required
            />
            <select
              value={form.role}
              onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
              className="border rounded px-3 py-2"
            >
              {roles.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <button disabled={txLoading || !isAdminWallet} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
              {txLoading ? 'Granting…' : 'Grant Role'}
            </button>
          </form>
        </div>

        {/* Admin lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{title:'Hospital Admins', key:'hospital', rows:hospitalAdmins}, {title:'Insurance Admins', key:'insurance', rows:insuranceAdmins}, {title:'Research Admins', key:'research', rows:researchAdmins}].map(section => (
            <div key={section.key} className="bg-white rounded-lg shadow">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-semibold">{section.title}</h3>
              </div>
              <div className="p-5">
                {loading && <div className="text-slate-500">Loading…</div>}
                {!loading && section.rows.length === 0 && <div className="text-slate-500">No entries.</div>}
                <ul className="space-y-2">
                  {section.rows.map(a => (
                    <li key={a.address} className="text-sm border rounded p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{a.name || '—'}</div>
                          <div className="text-slate-600 truncate">{section.title.replace(' Admins','')} {a.registrationNumber ? `(${a.registrationNumber})` : ''}</div>
                          <div className="mt-1 text-xs"><span className={`px-2 py-0.5 rounded ${a.active? 'bg-green-100 text-green-700':'bg-slate-100 text-slate-600'}`}>{a.active? 'Active':'Suspended'}</span></div>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                          <button onClick={()=>openView(section.key, a)} className="px-3 py-1 rounded border">View Details</button>
                          {a.active && (
                            <button onClick={()=>openProfileModal(section.key, a.address, a)} className="px-3 py-1 rounded border">Edit</button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">{currentEdit?.existing ? 'Update' : 'Add'} {currentEdit?.type} admin</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-700">Wallet</label>
                  <div className="font-mono text-sm">{currentEdit?.wallet}</div>
                </div>
                <div>
                  <label className="block text-sm text-slate-700">Name</label>
                  <input className="border rounded px-3 py-2 w-full" value={profile.name} onChange={(e)=>setProfile(p=>({...p,name:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm text-slate-700">Registration Number</label>
                  <input className="border rounded px-3 py-2 w-full" value={profile.registrationNumber} onChange={(e)=>setProfile(p=>({...p,registrationNumber:e.target.value}))} />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={()=>{setModalOpen(false); setCurrentEdit(null);}} className="px-3 py-2 border rounded">Cancel</button>
                <button disabled={txLoading || !isAdminWallet} onClick={onSaveProfile} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{txLoading ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {viewOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">{viewData?.name || 'Details'}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Entity</span><span>{(viewData?.type||'').charAt(0).toUpperCase() + (viewData?.type||'').slice(1)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Registration</span><span>{viewData?.registrationNumber || '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Status</span><span>{viewData?.active ? 'Active' : 'Inactive'}</span></div>
                <div className="break-all"><span className="text-slate-600">Wallet</span><div className="font-mono text-xs">{viewData?.address}</div></div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={()=>setViewOpen(false)} className="px-3 py-2 border rounded">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UsersRoles;
