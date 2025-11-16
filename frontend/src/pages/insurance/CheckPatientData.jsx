import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProvider } from '../../utils/web3';
import { getApplicants, getApplication, grantInsurance, rejectInsurance } from '../../services/insuranceService';
import doctorService from '../../services/doctorService';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE = 25;

const CheckPatientData = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordsByPatient, setRecordsByPatient] = useState({});
  const [actionMsg, setActionMsg] = useState('');

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

      const applicants = await getApplicants(page * PAGE_SIZE, PAGE_SIZE);
      const detailed = await Promise.all(
        applicants.map(async (addr) => {
          const app = await getApplication(addr);
          const statusNum = Number(app.status || 0);
          const status = statusNum === 1 ? 'Pending' : statusNum === 2 ? 'Granted' : statusNum === 3 ? 'Rejected' : 'None';
          return {
            patient: addr,
            status,
            requestedAt: Number(app.requestedAt || 0),
            decidedAt: Number(app.decidedAt || 0),
            reviewer: app.reviewer,
          };
        })
      );
      setRows(detailed);
    } catch (e) {
      setError(e?.message || 'Failed to load applicants');
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

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesQuery = !query || r.patient.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status.toLowerCase() === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  const onGrant = async (patient) => {
    setActionMsg('');
    setLoading(true);
    try {
      await grantInsurance(patient);
      setActionMsg('Insurance Granted');
      // Optimistic update
      setRows(prev => prev.map(r => r.patient===patient ? { ...r, status: 'Granted', reviewer: walletAddress, decidedAt: Math.floor(Date.now()/1000) } : r));
    } catch (e) {
      setError(e?.message || 'Grant failed');
      setActionMsg('');
    } finally {
      setLoading(false);
    }
  };

  const onReject = async (patient) => {
    setActionMsg('');
    setLoading(true);
    try {
      await rejectInsurance(patient);
      setActionMsg('Insurance Rejected');
      // Optimistic update
      setRows(prev => prev.map(r => r.patient===patient ? { ...r, status: 'Rejected', reviewer: walletAddress, decidedAt: Math.floor(Date.now()/1000) } : r));
    } catch (e) {
      setError(e?.message || 'Reject failed');
      setActionMsg('');
    } finally {
      setLoading(false);
    }
  };

  const toggleViewRecord = async (patient) => {
    if (expanded === patient) {
      setExpanded(null);
      return;
    }
    setExpanded(patient);
    if (!recordsByPatient[patient]) {
      setRecordLoading(true);
      try {
        const res = await doctorService.getPatientHistory(patient);
        setRecordsByPatient(prev => ({ ...prev, [patient]: res?.records || [] }));
      } catch (e) {
        setError(e?.message || 'Failed to load medical records');
      } finally {
        setRecordLoading(false);
      }
    }
  };

  return (
    <DashboardLayout userRole="insurance" userProfile={{}} walletAddress={walletAddress} networkStatus={networkStatus}>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-lg font-semibold">Check Patient Data</div>
          <div className="flex gap-2 items-center">
            <input className="border rounded px-3 py-2" placeholder="Search wallet" value={query} onChange={(e)=>setQuery(e.target.value)} />
            <select className="border rounded px-3 py-2" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="granted">Granted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b">Applicants</div>
          {loading && <div className="p-4 text-sm text-gray-500">Loading...</div>}
          {error && <div className="p-4 text-sm text-red-600">{error}</div>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600">
                    <th className="px-4 py-2">Patient</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Requested</th>
                    <th className="px-4 py-2">Reviewer</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <React.Fragment key={r.patient}>
                      <tr key={r.patient} className="border-t align-top hover:bg-slate-50 hover:shadow-sm transition-colors">
                        <td className="px-4 py-2 font-mono">{r.patient}</td>
                        <td className="px-4 py-2">{r.status}</td>
                        <td className="px-4 py-2">{r.requestedAt ? new Date(r.requestedAt*1000).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2 font-mono">{r.reviewer && r.reviewer !== '0x0000000000000000000000000000000000000000' ? r.reviewer : '-'}</td>
                        <td className="px-4 py-2 flex flex-wrap gap-2">
                          <button onClick={()=>toggleViewRecord(r.patient)} className="px-3 py-1 rounded border border-gray-300">{expanded===r.patient ? 'Hide' : 'View'} Medical Record</button>
                          <button disabled={loading || r.status.toLowerCase()==='granted'} onClick={()=>onGrant(r.patient)} className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50">{loading && expanded===r.patient ? 'Granting...' : 'Grant'}</button>
                          <button disabled={loading || r.status.toLowerCase()==='rejected'} onClick={()=>onReject(r.patient)} className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50">{loading && expanded===r.patient ? 'Rejecting...' : 'Reject'}</button>
                        </td>
                      </tr>
                      {expanded === r.patient && (
                        <tr>
                          <td colSpan={5} className="px-4 py-3 bg-gray-50">
                            <div className="border rounded-md bg-white">
                              <div className="px-4 py-2 border-b font-medium">Medical Records</div>
                              {recordLoading && <div className="p-4 text-sm text-gray-500">Loading records…</div>}
                              {!recordLoading && (
                                <div className="p-4 space-y-3">
                                  {(recordsByPatient[r.patient] || []).length === 0 && (
                                    <div className="text-sm text-gray-500">No records found.</div>
                                  )}
                                  {(recordsByPatient[r.patient] || []).map((rec, idx) => (
                                    <div key={`${r.patient}-rec-${idx}`} className="p-3 border rounded">
                                      <div className="text-xs text-gray-500">{rec.date}</div>
                                      <div className="font-medium">Diagnosis: {rec.diagnosis || '-'}</div>
                                      {rec.prescription && <div className="text-sm">Prescription: {rec.prescription}</div>}
                                      {rec.treatmentPlan && <div className="text-sm">Treatment: {rec.treatmentPlan}</div>}
                                      {rec.ipfsHash && (
                                        <div className="text-sm mt-1 space-y-1">
                                          <div className="text-xs text-gray-500">Documents</div>
                                          {(() => {
                                            const raw = rec.ipfsHash;
                                            let docs = [];
                                            try {
                                              docs = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
                                            } catch (e) {
                                              docs = String(raw).split(',');
                                            }
                                            docs = (docs || []).map(d => String(d).replace(/\"/g, '"')).filter(Boolean);
                                            return (
                                              <div className="space-y-1">
                                                {docs.map((cid, i) => {
                                                  const clean = cid.replace(/"/g, '').trim();
                                                  if (!clean) return null;
                                                  return (
                                                    <a
                                                      key={`${clean}-${i}`}
                                                      href={`https://ipfs.io/ipfs/${clean}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 text-xs font-medium shadow-sm transition-colors break-all"
                                                    >
                                                      <span className="truncate max-w-xs sm:max-w-md">{clean}</span>
                                                      <ArrowTopRightOnSquareIcon className="h-3 w-3 flex-shrink-0" />
                                                    </a>
                                                  );
                                                })}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}
                                      <div className="text-xs text-gray-500">Doctor: {rec.doctorName}</div>
                                    </div>
                                  ))}
                                  {actionMsg && <div className="text-sm text-emerald-700">{actionMsg}</div>}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="p-3 flex justify-between items-center border-t">
            <button className="px-3 py-1 border rounded" disabled={page===0} onClick={()=>setPage(Math.max(0,page-1))}>Prev</button>
            <span className="text-sm">Page {page+1}</span>
            <button className="px-3 py-1 border rounded" onClick={()=>setPage(page+1)}>Next</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CheckPatientData;
