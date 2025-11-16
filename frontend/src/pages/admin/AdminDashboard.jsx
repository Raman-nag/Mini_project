import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { ChartBarIcon, BuildingOfficeIcon, UserGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getHospitalContract, getDoctorContract, getEMRSystemContract, getPatientContract } from '../../utils/contract';
import { getProvider } from '../../utils/web3';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    hospitals: 0,
    insurers: 0,
    researchers: 0,
    activeEntities: 0,
    suspendedEntities: 0,
  });
  const [recent, setRecent] = useState([]);
  const [sub, setSub] = useState({
    hospital: { doctors: 0, patients: 0 },
    insurance: { policies: 0, customers: 0 },
    research: { studies: 0, participants: 0 },
  });

  const cards = useMemo(() => ([
    { key: 'hospital', name: 'Hospitals', value: stats.hospitals, icon: BuildingOfficeIcon, color: 'text-blue-600', bg: 'bg-blue-100', subs: [
      { label: 'Doctors', value: sub.hospital.doctors },
      { label: 'Patients', value: sub.hospital.patients },
    ] },
    { key: 'insurance', name: 'Insurers', value: stats.insurers, icon: UserGroupIcon, color: 'text-emerald-600', bg: 'bg-emerald-100', subs: [
      { label: 'Policies', value: sub.insurance.policies || '—' },
      { label: 'Customers', value: sub.insurance.customers || '—' },
    ] },
    { key: 'research', name: 'Research Institutes', value: stats.researchers, icon: UserGroupIcon, color: 'text-purple-600', bg: 'bg-purple-100', subs: [
      { label: 'Studies', value: sub.research.studies || '—' },
      { label: 'Participants', value: sub.research.participants || '—' },
    ] },
    { key: 'active', name: 'Active Entities', value: stats.hospitals + stats.insurers + stats.researchers, icon: ChartBarIcon, color: 'text-green-600', bg: 'bg-green-100', subs: [] },
  ]), [stats, sub]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const provider = getProvider();
        if (!provider) throw new Error('Wallet provider not available');
        const hospital = await getHospitalContract();
        const doctor = await getDoctorContract();
        const patient = await getPatientContract();
        const emr = await getEMRSystemContract();

        // Build hospital list via events (since contract lacks a length getter)
        const regLogs = await hospital.queryFilter(hospital.filters.HospitalRegistered());
        const deactLogs = await hospital.queryFilter(hospital.filters.HospitalDeactivated());
        const hospitalAddresses = Array.from(new Set(regLogs.map(l => (l.args?.hospitalAddress || l.args?.[0])))).filter(Boolean);

        // Count active/suspended by querying details
        let active = 0;
        let suspended = 0;
        for (const addr of hospitalAddresses) {
          try {
            const details = await hospital.getHospitalDetails(addr);
            if (details && details[2]) active += 1; else suspended += 1;
          } catch (_) {
            // If getHospitalDetails requires existence, fallback to registeredHospitals mapping via call
            try {
              const isReg = await hospital.registeredHospitals(addr);
              if (isReg) active += 1; else suspended += 1;
            } catch {}
          }
        }

        // Recent activity from contracts (enriched with names/status)
        const recentEvents = [];
        for (const l of regLogs.slice(-10).reverse()) {
          const addr = l.args?.hospitalAddress || l.args?.[0];
          let name = '', activeStatus = 'Active';
          try { const d = await hospital.getHospitalDetails(addr); name = d[0]; activeStatus = d[2] ? 'Active' : 'Suspended'; } catch {}
          recentEvents.push({ entity: 'Hospital', name, address: addr, status: activeStatus, at: Number(l.blockNumber) });
        }
        for (const l of deactLogs.slice(-10).reverse()) {
          const addr = l.args?.hospitalAddress || l.args?.[0];
          let name = '', activeStatus = 'Suspended';
          try { const d = await hospital.getHospitalDetails(addr); name = d[0]; activeStatus = d[2] ? 'Active' : 'Suspended'; } catch {}
          recentEvents.push({ entity: 'Hospital', name, address: addr, status: activeStatus, at: Number(l.blockNumber) });
        }
        try {
          const docReg = await doctor.queryFilter(doctor.filters.DoctorRegistered());
          docReg.slice(-10).reverse().forEach(l => recentEvents.push({
            entity: 'Doctor', name: l.args?.doctorAddress, address: l.args?.doctorAddress, status: 'Active', at: Number(l.blockNumber),
          }));
        } catch (_) {}

        // EMR admin events (exclude HospitalAdmin* to avoid duplicates with HospitalRegistered)
        const adminEvDefs = [
          { n: 'InsuranceAdminAdded', f: () => emr.filters.InsuranceAdminAdded(), label: (l)=>`Insurance admin added ${l.args?.wallet}` },
          { n: 'InsuranceAdminUpdated', f: () => emr.filters.InsuranceAdminUpdated(), label: (l)=>`Insurance admin updated ${l.args?.wallet}` },
          { n: 'InsuranceAdminRemoved', f: () => emr.filters.InsuranceAdminRemoved(), label: (l)=>`Insurance admin removed ${l.args?.wallet}` },
          { n: 'ResearchAdminAdded', f: () => emr.filters.ResearchAdminAdded(), label: (l)=>`Research admin added ${l.args?.wallet}` },
          { n: 'ResearchAdminUpdated', f: () => emr.filters.ResearchAdminUpdated(), label: (l)=>`Research admin updated ${l.args?.wallet}` },
          { n: 'ResearchAdminRemoved', f: () => emr.filters.ResearchAdminRemoved(), label: (l)=>`Research admin removed ${l.args?.wallet}` },
        ];
        for (const d of adminEvDefs) {
          try {
            const ls = await emr.queryFilter(d.f());
            ls.slice(-10).reverse().forEach(async l => {
              const addr = l.args?.wallet;
              let name = '', status = 'Active', entity = '';
              if (d.n.startsWith('Hospital')) { entity = 'Hospital'; try { const p = await emr.hospitalAdmins(addr); name = p.name; status = p.active ? 'Active' : 'Inactive'; } catch {} }
              else if (d.n.startsWith('Insurance')) { entity = 'Insurance'; try { const p = await emr.insuranceAdmins(addr); name = p.name; status = p.active ? 'Active' : 'Inactive'; } catch {} }
              else if (d.n.startsWith('Research')) { entity = 'Research'; try { const p = await emr.researchAdmins(addr); name = p.name; status = p.active ? 'Active' : 'Inactive'; } catch {} }
              recentEvents.push({ entity, name, address: addr, status, at: Number(l.blockNumber) });
            });
          } catch {}
        }

        if (!mounted) return;
        // Admin counts from EMRSystem (only active)
        let insurers = 0, researchers = 0;
        try {
          const iList = await emr.getInsuranceAdminList();
          for (const a of iList) { try { const p = await emr.insuranceAdmins(a); if (p.active) insurers += 1; } catch {} }
        } catch {}
        try {
          const rList = await emr.getResearchAdminList();
          for (const a of rList) { try { const p = await emr.researchAdmins(a); if (p.active) researchers += 1; } catch {} }
        } catch {}
        setStats({
          hospitals: active, // only active hospitals
          insurers,
          researchers,
          activeEntities: active, // retained for internal use; not displayed as separate card now
          suspendedEntities: suspended,
        });
        // Subcounts: doctors (unique DoctorRegistered), patients (unique PatientRegistered)
        let doctorCount = 0, patientCount = 0;
        try {
          const dRegs = await doctor.queryFilter(doctor.filters.DoctorRegistered());
          const uniqDocs = new Set(dRegs.map(l => l.args?.doctorAddress).filter(Boolean));
          doctorCount = uniqDocs.size;
        } catch {}
        try {
          const p = await patient.queryFilter(patient.filters.PatientRegistered());
          const uniqP = new Set(p.map(l => l.args?.patientAddress).filter(Boolean));
          patientCount = uniqP.size;
        } catch {}
        setSub({
          hospital: { doctors: doctorCount, patients: patientCount },
          insurance: { policies: 0, customers: 0 },
          research: { studies: 0, participants: 0 },
        });
        recentEvents.sort((a, b) => b.at - a.at);
        setRecent(recentEvents.slice(0, 15));
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load admin overview');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();

    // simple live refresh on new blocks
    const provider = getProvider();
    const onBlock = () => load();
    provider?.on?.('block', onBlock);
    return () => {
      mounted = false;
      provider?.off?.('block', onBlock);
    };
  }, []);

  return (
    <DashboardLayout userRole="admin" userProfile={{ firstName: 'Admin' }} walletAddress={''} networkStatus={'connected'}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-600">Real-time overview of system entities and recent on-chain activity.</p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>
        )}

        {/* Stats with sub-metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => {
            const Icon = c.icon;
            return (
              <div key={c.name} className="bg-white rounded-lg shadow p-5">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${c.bg} mr-4`}>
                    <Icon className={`h-6 w-6 ${c.color}`} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">{c.name}</div>
                    <div className="text-2xl font-semibold">{loading ? '—' : String(c.value)}</div>
                  </div>
                </div>
                {c.subs?.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    {c.subs.map((s,i)=>(
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded px-2 py-1">
                        <span>{s.label}</span>
                        <span className="font-medium">{loading ? '—' : String(s.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Recent Activity list */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="p-5 overflow-x-auto">
            {loading && <div className="text-slate-500">Loading activity…</div>}
            {!loading && recent.length === 0 && <div className="text-slate-500">No recent activity found.</div>}
            {!loading && recent.length > 0 && (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-4">Entity</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Address</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Block</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-4">{r.entity}</td>
                      <td className="py-2 pr-4">{r.name || '—'}</td>
                      <td className="py-2 pr-4 font-mono">{r.address || '—'}</td>
                      <td className="py-2 pr-4">{r.status || '—'}</td>
                      <td className="py-2 pr-4">{r.at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
