import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';

const STORAGE_KEY = 'admin_settings_v1';

const AdminSettings = () => {
  const [form, setForm] = useState({
    docTypes: 'pdf,jpg,png,mp4',
    maxFileSizeMB: 50,
    ipfsGateway: 'https://ipfs.io/ipfs/',
    networkKey: 'localhost',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setForm({ ...form, ...JSON.parse(raw) });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {}
  };

  return (
    <DashboardLayout userRole="admin" userProfile={{ firstName: 'Admin' }} walletAddress={''} networkStatus={'connected'}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings & Configuration</h1>
          <p className="text-slate-600">Configure document types, max file sizes, IPFS gateway, and preferred network key.</p>
        </div>

        <form onSubmit={onSave} className="bg-white rounded-lg shadow p-5 space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-slate-700">Allowed Document Types (comma-separated)</label>
            <input className="mt-1 border rounded px-3 py-2 w-full" value={form.docTypes} onChange={(e)=>setForm(f=>({...f,docTypes:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Max File Size (MB)</label>
            <input type="number" min={1} className="mt-1 border rounded px-3 py-2 w-full" value={form.maxFileSizeMB} onChange={(e)=>setForm(f=>({...f,maxFileSizeMB:Number(e.target.value||0)}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">IPFS Gateway URL</label>
            <input className="mt-1 border rounded px-3 py-2 w-full" value={form.ipfsGateway} onChange={(e)=>setForm(f=>({...f,ipfsGateway:e.target.value}))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Preferred Network Key</label>
            <input className="mt-1 border rounded px-3 py-2 w-full" value={form.networkKey} onChange={(e)=>setForm(f=>({...f,networkKey:e.target.value}))} />
          </div>
          <div className="pt-2">
            <button className="px-4 py-2 rounded bg-blue-600 text-white">Save Settings</button>
            {saved && <span className="ml-3 text-green-700">Saved</span>}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
