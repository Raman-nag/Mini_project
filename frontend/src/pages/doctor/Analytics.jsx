import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useWeb3 } from '../../contexts/Web3Context';
import doctorService from '../../services/doctorService';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { getDoctorContract } from '../../utils/contract';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
);

const DoctorAnalytics = () => {
  const { account } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!account) return;
      setLoading(true);
      setError('');
      try {
        const ptsRes = await doctorService.getMyPatients();
        const pts = ptsRes?.success ? (ptsRes.patients || []) : [];
        if (!active) return;
        setPatients(pts);

        const allRecs = [];
        for (const p of pts.slice(0, 50)) {
          try {
            const hist = await doctorService.getPatientHistory(p.walletAddress);
            if (hist?.success && Array.isArray(hist.records)) {
              const mine = hist.records.filter(r => (r.doctorAddress || '').toLowerCase() === account.toLowerCase());
              allRecs.push(...mine);
            }
          } catch {
            // ignore
          }
        }
        if (!active) return;
        allRecs.sort((a,b) => (b.timestamp||0) - (a.timestamp||0));
        setRecords(allRecs);

        const pres = await doctorService.getDoctorPrescriptions(account, 1000);
        if (!active) return;
        setPrescriptions(pres?.success ? (pres.prescriptions || []) : []);
      } catch (e) {
        if (!active) return;
        setError(e?.message || 'Failed to load analytics');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [account]);

  useEffect(() => {
    if (!account) return;
    let contract;
    let alive = true;
    const setup = async () => {
      try {
        contract = await getDoctorContract();
        const handler = async () => { if (alive) { try { await (async ()=>{ if (alive) {
          const ptsRes = await doctorService.getMyPatients();
          const pts = ptsRes?.success ? (ptsRes.patients || []) : [];
          setPatients(pts);
          const allRecs = [];
          for (const p of pts.slice(0, 50)) {
            try { const hist = await doctorService.getPatientHistory(p.walletAddress); if (hist?.success && Array.isArray(hist.records)) { const mine = hist.records.filter(r => (r.doctorAddress || '').toLowerCase() === account.toLowerCase()); allRecs.push(...mine); } } catch {}
          }
          allRecs.sort((a,b)=>(b.timestamp||0)-(a.timestamp||0));
          setRecords(allRecs);
          const pres = await doctorService.getDoctorPrescriptions(account, 1000);
          setPrescriptions(pres?.success ? (pres.prescriptions || []) : []);
        } })(); } catch {} } };
        contract.on('RecordCreated', handler);
        return () => { try { contract.off('RecordCreated', handler); } catch {} alive = false; };
      } catch {}
    };
    const cleanupPromise = setup();
    return () => { Promise.resolve(cleanupPromise).then(fn => { if (typeof fn === 'function') fn(); }); };
  }, [account]);

  const cards = useMemo(() => ([
    { title: 'Total Patients', value: patients.length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Created Records', value: records.length, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Issued Prescriptions', value: prescriptions.length, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Accessed Records', value: records.length, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]), [patients.length, records.length, prescriptions.length]);

  const byDay = useMemo(() => {
    const bucket = new Map();
    records.forEach(r => {
      const d = r.timestamp ? new Date(r.timestamp * 1000) : (r.date ? new Date(r.date) : null);
      if (!d || Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0,10);
      bucket.set(key, (bucket.get(key) || 0) + 1);
    });
    const labels = Array.from(bucket.keys()).sort();
    const data = labels.map(k => bucket.get(k));
    return { labels, data };
  }, [records]);

  const patientsPerMonth = useMemo(() => {
    const b = new Map();
    patients.forEach(p => {
      const d = p.lastVisitDate ? new Date(p.lastVisitDate) : null;
      const key = d && !Number.isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` : 'Unknown';
      b.set(key, (b.get(key) || 0) + 1);
    });
    const labels = Array.from(b.keys()).sort();
    const data = labels.map(k => b.get(k));
    return { labels, data };
  }, [patients]);

  const doughnutData = useMemo(() => ({
    labels: ['Records', 'Prescriptions'],
    datasets: [{
      data: [records.length, prescriptions.length],
      backgroundColor: ['#3b82f6', '#a855f7'],
      borderWidth: 0,
    }]
  }), [records.length, prescriptions.length]);

  return (
    <DashboardLayout userRole="doctor">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.title} className={`rounded-lg p-5 ${c.bg}`}>
              <div className="text-sm text-gray-600">{c.title}</div>
              <div className={`mt-1 text-2xl font-semibold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {loading && <div className="text-sm text-gray-500">Loading analytics...</div>}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            <div className="bg-white rounded-lg shadow p-4 max-w-[380px] w-full max-h-[250px]">
              <div className="text-sm font-medium mb-2">Records Trend</div>
              <div className="h-[200px]">
              <Line height={200} data={{
                labels: byDay.labels,
                datasets: [{
                  label: 'Records',
                  data: byDay.data,
                  fill: false,
                  borderColor: '#3b82f6',
                  tension: 0.2,
                }]
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }}}} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 max-w-[380px] w-full max-h-[250px]">
              <div className="text-sm font-medium mb-2">Records vs Prescriptions</div>
              <div className="h-[200px]">
                <Doughnut height={200} data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 max-w-[380px] w-full max-h-[250px]">
              <div className="text-sm font-medium mb-2">Patients per Month</div>
              <div className="h-[200px]">
              <Bar height={200} data={{
                labels: patientsPerMonth.labels,
                datasets: [{
                  label: 'Patients',
                  data: patientsPerMonth.data,
                  backgroundColor: '#10b981',
                }]
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }}}} />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorAnalytics;
