import React, { useEffect, useMemo, useState } from 'react';
import Card from '../common/Card';
import SearchBar from '../common/SearchBar';
import { useWeb3 } from '../../contexts/Web3Context';
import doctorService from '../../services/doctorService';
import { getDoctorContract } from '../../utils/contract';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const Records = () => {
  const { account } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewRow, setViewRow] = useState(null);

  const load = async () => {
    if (!account) return;
    setLoading(true);
    setError('');
    try {
      const ptsRes = await doctorService.getMyPatients();
      const pts = ptsRes?.success ? (ptsRes.patients || []) : [];
      const out = [];
      for (const p of pts.slice(0, 100)) {
        try {
          const hist = await doctorService.getPatientHistory(p.walletAddress);
          const list = Array.isArray(hist?.records) ? hist.records : [];
          const mine = list.filter(r => (r.doctorAddress || '').toLowerCase() === account.toLowerCase());
          mine.forEach(r => {
            out.push({
              id: r.id,
              date: r.date,
              diagnosis: r.diagnosis,
              patient: p.name || p.walletAddress,
              patientAddress: p.walletAddress,
              ipfsHash: r.ipfsHash,
            });
          });
        } catch {/* ignore */}
      }
      out.sort((a,b) => (new Date(b.date)) - (new Date(a.date)));
      setRows(out);
    } catch (e) {
      setError(e?.message || 'Failed to load records');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [account]);

  useEffect(() => {
    let active = true;
    const setup = async () => {
      try {
        const c = await getDoctorContract();
        const handler = async (_id, patientAddress, doctorAddress) => {
          if (!active) return;
          if ((doctorAddress || '').toLowerCase() !== (account||'').toLowerCase()) return;
          await load();
        };
        c.on('RecordCreated', handler);
        return () => { try { c.off('RecordCreated', handler); } catch {} active = false; };
      } catch {}
    };
    const cleanupPromise = setup();
    return () => { Promise.resolve(cleanupPromise).then(fn => { if (typeof fn === 'function') fn(); }); };
  }, [account]);

  const filtered = useMemo(() => {
    const base = [...rows];
    base.sort((a,b) => {
      let av, bv;
      if (sortBy === 'date') { av = new Date(a.date); bv = new Date(b.date); }
      else if (sortBy === 'patient') { av = (a.patient||'').toLowerCase(); bv = (b.patient||'').toLowerCase(); }
      else { av = (a.diagnosis||'').toLowerCase(); bv = (b.diagnosis||'').toLowerCase(); }
      if (sortOrder === 'asc') return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });
    if (!q) return base;
    const s = q.toLowerCase();
    return base.filter(r =>
      (r.patient || '').toLowerCase().includes(s) ||
      (r.patientAddress || '').toLowerCase().includes(s) ||
      (r.diagnosis || '').toLowerCase().includes(s) ||
      (r.id || '').toLowerCase().includes(s)
    );
  }, [rows, q]);

  const renderLinks = (ipfsHash) => {
    if (!ipfsHash) return null;
    let cids = [];
    try {
      if (typeof ipfsHash === 'string' && (ipfsHash.trim().startsWith('[') || ipfsHash.trim().startsWith('{'))) {
        const parsed = JSON.parse(ipfsHash);
        cids = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
      } else if (typeof ipfsHash === 'string') {
        cids = ipfsHash.split(',');
      } else if (Array.isArray(ipfsHash)) {
        cids = ipfsHash;
      }
    } catch {
      cids = String(ipfsHash).split(',');
    }
    cids = (cids || []).map(c => String(c).replace(/"/g, '"')).filter(Boolean);
    if (!cids.length) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {cids.map((cid, i) => {
          const clean = String(cid).replace(/"/g, '').trim();
          if (!clean) return null;
          return (
            <a
              key={`cid-${i}`}
              href={`https://ipfs.io/ipfs/${clean}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-200 font-medium text-xs shadow transition-all break-all"
            >
              <span className="truncate max-w-xs sm:max-w-md">{clean}</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1 flex-shrink-0" />
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <Card.Body>
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">My Records</div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block w-72"><SearchBar placeholder="Search records…" value={q} onSearch={setQ} onClear={() => setQ('')} /></div>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-2 py-1 border rounded-lg text-sm">
                <option value="date">Date</option>
                <option value="patient">Patient</option>
                <option value="diagnosis">Diagnosis</option>
              </select>
              <button onClick={()=>setSortOrder(sortOrder==='asc'?'desc':'asc')} className="px-2 py-1 border rounded-lg text-sm">{sortOrder==='asc'?'↑':'↓'}</button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {loading && <Card><Card.Body><div className="text-sm text-gray-500">Loading…</div></Card.Body></Card>}
      {error && !loading && <Card><Card.Body><div className="text-sm text-red-600">{error}</div></Card.Body></Card>}

      {!loading && (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-300 border-b">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Diagnosis</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">{r.date}</td>
                  <td className="px-4 py-3">{r.patient}</td>
                  <td className="px-4 py-3 font-mono">{r.patientAddress?.slice(0,6)}...{r.patientAddress?.slice(-4)}</td>
                  <td className="px-4 py-3">{r.diagnosis || '—'}</td>
                  <td className="px-4 py-3">{renderLinks(r.ipfsHash)}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button className="px-3 py-1 border rounded-lg text-sm" onClick={()=>setViewRow({ mode: 'docs', row: r })}>View Document</button>
                    <button className="px-3 py-1 border rounded-lg text-sm" onClick={()=>setViewRow({ mode: 'record', row: r })}>View Record</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewRow && (
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">{viewRow.mode === 'docs' ? 'Documents' : 'Record Details'}</div>
              <button onClick={()=>setViewRow(null)} className="px-2 py-1 border rounded-lg text-sm">Close</button>
            </div>
            {viewRow.mode === 'docs' ? (
              <div>{renderLinks(viewRow.row.ipfsHash) || <div className="text-sm text-gray-500">No documents</div>}</div>
            ) : (
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Date:</span> {viewRow.row.date}</div>
                <div><span className="font-medium">Patient:</span> {viewRow.row.patient} ({viewRow.row.patientAddress})</div>
                <div><span className="font-medium">Diagnosis:</span> {viewRow.row.diagnosis || '—'}</div>
                <div><span className="font-medium">Documents:</span> {renderLinks(viewRow.row.ipfsHash) || '—'}</div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Records;
