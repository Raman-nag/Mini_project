import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getHospitalContract, getDoctorContract, getEMRSystemContract } from '../../utils/contract';
import { getProvider } from '../../utils/web3';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, TimeScale);

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    hospitals: 0,
    insurers: 0,
    researchers: 0,
    active: 0,
    suspended: 0,
  });
  const [series, setSeries] = useState({ hospital: [], insurance: [], research: [] }); // per-entity per-day counts
  const [seriesWeek, setSeriesWeek] = useState({ hospital: [], insurance: [], research: [] });
  const [seriesMonth, setSeriesMonth] = useState({ hospital: [], insurance: [], research: [] });
  const [scatter, setScatter] = useState([]); // doctors per hospital [{x, y, label}]
  const [policyScatter, setPolicyScatter] = useState([]); // policies per insurer (requires policy contract; defaults 0)
  const [studyScatter, setStudyScatter] = useState([]); // studies per research (requires study contract; defaults 0)
  const [connectedWallet, setConnectedWallet] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const hospital = await getHospitalContract();
      const doctor = await getDoctorContract();
      const emr = await getEMRSystemContract();
      const provider = getProvider();
      try {
        const signer = provider?.getSigner?.();
        const addr = signer ? (await signer.getAddress()) : null;
        if (addr) setConnectedWallet(addr);
      } catch {}

      // Hospital metrics from HospitalManagement (active/suspended) and events
      const regLogs = await hospital.queryFilter(hospital.filters.HospitalRegistered());
      const deactLogs = await hospital.queryFilter(hospital.filters.HospitalDeactivated());
      const docRegLogs = await doctor.queryFilter(doctor.filters.DoctorRegistered?.() || []);
      const hospitalAddresses = Array.from(new Set(regLogs.map(l => (l.args?.hospitalAddress || l.args?.[0])))).filter(Boolean);
      let active = 0, suspended = 0;
      const activeHospitals = new Set();
      for (const addr of hospitalAddresses) {
        try {
          const details = await hospital.getHospitalDetails(addr);
          if (details && details[2]) { active++; activeHospitals.add(addr); } else { suspended++; }
        } catch { suspended++; }
      }

      // EMRSystem admin entities
      const [hList, iList, rList] = await Promise.all([
        emr.getHospitalAdminList(),
        emr.getInsuranceAdminList(),
        emr.getResearchAdminList(),
      ]);

      const fetchProfiles = async (list, getter) => {
        const rows = [];
        for (const a of list) {
          try { rows.push(await getter(a)); } catch {}
        }
        return rows;
      };

      const [hProfiles, iProfiles, rProfiles] = await Promise.all([
        fetchProfiles(hList, emr.hospitalAdmins),
        fetchProfiles(iList, emr.insuranceAdmins),
        fetchProfiles(rList, emr.researchAdmins),
      ]);
      const activeH = hProfiles.filter(p=>p.active);
      const activeI = iProfiles.filter(p=>p.active);
      const activeR = rProfiles.filter(p=>p.active);

      // Recent registrations (7d) using EMRSystem Added events and block timestamps
      const now = Math.floor(Date.now() / 1000);
      const daySecs = 86400;
      const weekSecs = 7 * daySecs;
      const monthSecs = 30 * daySecs;
      const makeBuckets = (n) => new Array(n).fill(0);
      const bucketsDay = { hospital: makeBuckets(7), insurance: makeBuckets(7), research: makeBuckets(7) };
      const bucketsWeek = { hospital: makeBuckets(8), insurance: makeBuckets(8), research: makeBuckets(8) };
      const bucketsMonth = { hospital: makeBuckets(6), insurance: makeBuckets(6), research: makeBuckets(6) };

      const loadAndBucket = async (filterFn, label) => {
        const logs = await emr.queryFilter(filterFn());
        const stamps = await Promise.all(logs.slice(-600).map(async l => {
          try { const b = await provider.getBlock(l.blockNumber); return b.timestamp || now; } catch { return now; }
        }));
        stamps.forEach(ts => {
          const d = Math.floor((now - ts) / daySecs);
          if (d >= 0 && d < 7) bucketsDay[label][6 - d] += 1;
          const w = Math.floor((now - ts) / weekSecs);
          if (w >= 0 && w < 8) bucketsWeek[label][7 - w] += 1;
          const m = Math.floor((now - ts) / monthSecs);
          if (m >= 0 && m < 6) bucketsMonth[label][5 - m] += 1;
        });
      };

      await Promise.all([
        loadAndBucket(() => emr.filters.HospitalAdminAdded(), 'hospital'),
        loadAndBucket(() => emr.filters.InsuranceAdminAdded(), 'insurance'),
        loadAndBucket(() => emr.filters.ResearchAdminAdded(), 'research'),
      ]);

      // Scatter: doctors per hospital from DoctorRegistered grouped by hospital
      const docByHospital = new Map();
      for (const l of docRegLogs) {
        const h = l.args?.hospitalAddress || l.args?.[1];
        if (!h) continue;
        if (!activeHospitals.has(h)) continue; // only active hospitals
        docByHospital.set(h, (docByHospital.get(h) || 0) + 1);
      }
      const scatterPoints = Array.from(docByHospital.entries()).map(([addr, cnt], idx) => ({ x: idx + 1, y: cnt, label: addr }));

      // Policies per Insurance, Studies per Research (no dedicated contracts present -> default to 0 until integrated)
      const polPoints = activeI.map((p, idx) => ({ x: idx + 1, y: 0, label: p.wallet || 'insurer' }));
      const studyPoints = activeR.map((p, idx) => ({ x: idx + 1, y: 0, label: p.wallet || 'research' }));

      setMetrics({
        hospitals: active, // only active hospitals
        insurers: activeI.length,
        researchers: activeR.length,
        active,
        suspended,
      });
      setSeries(bucketsDay);
      setSeriesWeek(bucketsWeek);
      setSeriesMonth(bucketsMonth);
      setScatter(scatterPoints);
      setPolicyScatter(polPoints);
      setStudyScatter(studyPoints);
    } catch (e) {
      setError(e?.message || 'Failed to load analytics');
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

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Hospitals', metrics.hospitals],
      ['Insurers', metrics.insurers],
      ['Researchers', metrics.researchers],
      ['Active', metrics.active],
      ['Suspended', metrics.suspended],
      ['Registrations (7d)', metrics.registrationsLast7d],
      ['Tx Count', metrics.txCount],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout userRole="admin" userProfile={{ firstName: 'Admin' }} walletAddress={connectedWallet} networkStatus={'connected'}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Analytics & Reports</h1>
            <p className="text-slate-600">Live system metrics and recent activity. Export as CSV.</p>
          </div>
          <button onClick={exportCSV} className="px-4 py-2 rounded bg-slate-800 text-white">Export CSV</button>
        </div>

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm">Hospitals</div>
            <div className="text-3xl font-semibold">{loading ? '—' : metrics.hospitals}</div>
            <div className="mt-3 text-xs text-slate-600 flex gap-4">
              <span>Active: <b>{metrics.active}</b></span>
              <span>Suspended: <b>{metrics.suspended}</b></span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm">Insurers</div>
            <div className="text-3xl font-semibold">{loading ? '—' : metrics.insurers}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm">Research Institutes</div>
            <div className="text-3xl font-semibold">{loading ? '—' : metrics.researchers}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm mb-3">Registrations by Day (Bar)</div>
            <Bar height={140} data={{
              labels: ['D-6','D-5','D-4','D-3','D-2','D-1','Today'],
              datasets: [
                { label: 'Hospital', data: series.hospital, backgroundColor: 'rgba(59,130,246,0.6)' },
                { label: 'Insurance', data: series.insurance, backgroundColor: 'rgba(16,185,129,0.6)' },
                { label: 'Research', data: series.research, backgroundColor: 'rgba(168,85,247,0.6)' },
              ],
            }} options={{ responsive: true, plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } }, scales: { y: { beginAtZero: true } } }} />
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm mb-3">Registrations by Week (Bar)</div>
            <Bar height={140} data={{
              labels: ['W-7','W-6','W-5','W-4','W-3','W-2','W-1','This week'],
              datasets: [
                { label: 'Hospital', data: seriesWeek.hospital, backgroundColor: 'rgba(59,130,246,0.6)' },
                { label: 'Insurance', data: seriesWeek.insurance, backgroundColor: 'rgba(16,185,129,0.6)' },
                { label: 'Research', data: seriesWeek.research, backgroundColor: 'rgba(168,85,247,0.6)' },
              ],
            }} options={{ responsive: true, plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } }, scales: { y: { beginAtZero: true } } }} />
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm mb-3">Registrations by Month (Bar)</div>
            <Bar height={140} data={{
              labels: ['M-5','M-4','M-3','M-2','M-1','This month'],
              datasets: [
                { label: 'Hospital', data: seriesMonth.hospital, backgroundColor: 'rgba(59,130,246,0.6)' },
                { label: 'Insurance', data: seriesMonth.insurance, backgroundColor: 'rgba(16,185,129,0.6)' },
                { label: 'Research', data: seriesMonth.research, backgroundColor: 'rgba(168,85,247,0.6)' },
              ],
            }} options={{ responsive: true, plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm mb-3">Doctors per Hospital (Scatter)</div>
            <Scatter height={140} data={{
              datasets: [
                { label: 'Doctors', data: scatter.map(p=>({x:p.x,y:p.y})), pointBackgroundColor: '#ef4444' },
              ],
            }} options={{ plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx)=>`Doctors: ${ctx.raw.y}` } } }, scales: { x: { ticks: { display: false } }, y: { beginAtZero: true } } }} />
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm mb-3">Policies per Insurance (Scatter)</div>
            <Scatter height={140} data={{
              datasets: [
                { label: 'Policies', data: policyScatter.map(p=>({x:p.x,y:p.y})), pointBackgroundColor: '#0ea5e9' },
              ],
            }} options={{ plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx)=>`Policies: ${ctx.raw.y}` } } }, scales: { x: { ticks: { display: false } }, y: { beginAtZero: true } } }} />
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm mb-3">Studies per Research Institute (Scatter)</div>
            <Scatter height={140} data={{
              datasets: [
                { label: 'Studies', data: studyScatter.map(p=>({x:p.x,y:p.y})), pointBackgroundColor: '#f59e0b' },
              ],
            }} options={{ plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx)=>`Studies: ${ctx.raw.y}` } } }, scales: { x: { ticks: { display: false } }, y: { beginAtZero: true } } }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm mb-3">Entity Composition (Donut)</div>
            <Doughnut height={140} data={{
              labels: ['Hospitals','Insurers','Research'],
              datasets: [{ data: [metrics.hospitals, metrics.insurers, metrics.researchers], backgroundColor: ['#3b82f6','#10b981','#a855f7'] }],
            }} options={{ plugins: { legend: { position: 'bottom' } } }} />
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="text-slate-500 text-sm mb-3">Trend of Registrations (Line)</div>
            <Line height={160} data={{
              labels: ['D-6','D-5','D-4','D-3','D-2','D-1','Today'],
              datasets: [
                { label: 'Hospital', data: series.hospital, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', fill: true },
                { label: 'Insurance', data: series.insurance, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)', fill: true },
                { label: 'Research', data: series.research, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.2)', fill: true },
              ],
            }} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
