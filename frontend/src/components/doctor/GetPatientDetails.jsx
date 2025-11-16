import React, { useEffect, useRef, useState } from 'react';
import { DocumentTextIcon, UserIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Button from '../common/Button';
import SearchBar from '../common/SearchBar';
import Modal from '../common/Modal';
import patientService from '../../services/patientService';
import doctorService from '../../services/doctorService';
import { getPatientContract, getDoctorContract } from '../../utils/contract';
import { useToast } from '../../contexts/ToastContext';

const GetPatientDetails = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const showToast = (message, type = 'info') => {
    if (type === 'success') return showSuccess(message);
    if (type === 'error') return showError(message);
    if (type === 'warning') return showWarning(message);
    return showInfo(message);
  };
  const [address, setAddress] = useState('');
  const [checking, setChecking] = useState(false);
  const [hasAccess, setHasAccess] = useState(null);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [profile, setProfile] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const listenerRef = useRef(null);
  const patientRef = useRef('');
  const doctorRef = useRef('');
  const [requesting, setRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [grantedPatients, setGrantedPatients] = useState([]);
  const [groupFilter, setGroupFilter] = useState('all');
  const [groupedIpfs, setGroupedIpfs] = useState({});
  const [groupedRx, setGroupedRx] = useState({});
  const [grantedQuery, setGrantedQuery] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  const onCheck = async (e) => {
    e?.preventDefault?.();
    setError('');
    setHasAccess(null);
    setRecords([]);

    const addr = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setError('Enter a valid patient wallet address');
      return;
    }

    try {
      setChecking(true);
      const doctorContract = await getDoctorContract();
      const signer = await doctorContract.signer;
      const doctor = await signer.getAddress();
      doctorRef.current = doctor;
      patientRef.current = addr;

      const has = await patientService.hasAccess(doctor, addr);
      setHasAccess(Boolean(has));
      // Reset request flag on fresh check unless still pending later
      setHasRequested(false);

      if (has) {
        const res = await doctorService.getPatientHistory(addr);
        const list = Array.isArray(res?.records) ? res.records : [];
        setRecords(list);
        setPrescriptions(list.filter(r => (r.prescription || '').trim().length > 0));
        // Build grouped maps
        const ipfsByDoctor = {};
        const rxByDoctor = {};
        (list || []).forEach(r => {
          const d = (r.doctorAddress || 'unknown').toLowerCase();
          if (!ipfsByDoctor[d]) ipfsByDoctor[d] = [];
          if (r.ipfsHash) ipfsByDoctor[d].push({ id: r.id, ipfsHash: r.ipfsHash, date: r.date });
          if ((r.prescription || '').trim().length > 0) {
            if (!rxByDoctor[d]) rxByDoctor[d] = [];
            rxByDoctor[d].push({ id: r.id, prescription: r.prescription, date: r.date, doctorAddress: r.doctorAddress });
          }
        });
        setGroupedIpfs(ipfsByDoctor);
        setGroupedRx(rxByDoctor);
        try {
          const pc = await getPatientContract();
          const p = await pc.getPatientDetails(addr);
          setProfile({
            name: p.name,
            dateOfBirth: p.dateOfBirth,
            bloodGroup: p.bloodGroup,
            registeredDate: new Date(Number(p.registeredDate) * 1000).toLocaleDateString(),
            isActive: p.isActive,
            walletAddress: addr,
          });
        } catch {}
        // If previously listening for grant, remove listener properly
        if (listenerRef.current) {
          const contract = await getPatientContract();
          contract.off(listenerRef.current.filter, listenerRef.current.handler);
          if (listenerRef.current.revokeFilter && listenerRef.current.revokeHandler) {
            contract.off(listenerRef.current.revokeFilter, listenerRef.current.revokeHandler);
          }
          listenerRef.current = null;
        }
      } else {
        // Attach a one-time listener for AccessGranted(patient, doctor) to auto-refresh when granted
        const contract = await getPatientContract();
        const filter = contract.filters.AccessGranted(addr, doctor);
        const handler = async (patientAddress, grantedTo) => {
          if (
            String(patientAddress).toLowerCase() === addr.toLowerCase() &&
            String(grantedTo).toLowerCase() === doctor.toLowerCase()
          ) {
            // Re-check and load immediately
            const ok = await patientService.hasAccess(doctor, addr);
            setHasAccess(Boolean(ok));
            if (ok) {
              const res2 = await doctorService.getPatientHistory(addr);
              const list2 = Array.isArray(res2?.records) ? res2.records : [];
              setRecords(list2);
              setPrescriptions(list2.filter(r => (r.prescription || '').trim().length > 0));
              try {
                const pc2 = await getPatientContract();
                const p2 = await pc2.getPatientDetails(addr);
                setProfile({
                  name: p2.name,
                  dateOfBirth: p2.dateOfBirth,
                  bloodGroup: p2.bloodGroup,
                  registeredDate: new Date(Number(p2.registeredDate) * 1000).toLocaleDateString(),
                  isActive: p2.isActive,
                  walletAddress: addr,
                });
              } catch {}
            }
          }
        };
        // Also listen for revoke to immediately reflect loss of access
        const revokeFilter = contract.filters.AccessRevoked(addr, doctor);
        const revokeHandler = async (patientAddress, revokedFrom) => {
          if (
            String(patientAddress).toLowerCase() === addr.toLowerCase() &&
            String(revokedFrom).toLowerCase() === doctor.toLowerCase()
          ) {
            setHasAccess(false);
            setRecords([]);
            setPrescriptions([]);
          }
        };
        contract.on(filter, handler);
        contract.on(revokeFilter, revokeHandler);
        listenerRef.current = { filter, handler, revokeFilter, revokeHandler };
      }
    } catch (e1) {
      setError(e1?.message || 'Failed to check access');
    } finally {
      setChecking(false);
    }
  };

  const sendAccessRequest = async () => {
    const addr = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      showToast('Enter a valid patient wallet address', 'error');
      return;
    }
    try {
      setRequesting(true);
      const res = await patientService.requestAccess(addr);
      if (res?.success) {
        showToast('Access request sent. Waiting for patient approval.', 'success');
        setHasRequested(true);
      } else {
        showToast('Failed to send access request', 'error');
      }
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('pending')) {
        showToast('A request may already be pending.', 'warning');
        setHasRequested(true);
      } else {
        showToast(err?.message || 'Failed to send access request', 'error');
      }
    } finally {
      setRequesting(false);
    }
  };

  // Cleanup listener on unmount or when patient address changes
  useEffect(() => {
    return () => {
      (async () => {
        if (listenerRef.current) {
          try {
            const contract = await getPatientContract();
            contract.off(listenerRef.current.filter, listenerRef.current.handler);
            if (listenerRef.current.revokeFilter && listenerRef.current.revokeHandler) {
              contract.off(listenerRef.current.revokeFilter, listenerRef.current.revokeHandler);
            }
          } catch {}
          listenerRef.current = null;
        }
      })();
    };
  }, []);

  // Load list of patients who granted this doctor access
  useEffect(() => {
    let active = true;
    const loadGranted = async () => {
      try {
        const dc = await getDoctorContract();
        const signer = await dc.signer;
        const doc = await signer.getAddress();
        const myPts = await doctorService.getMyPatients();
        const pts = myPts?.success ? (myPts.patients || []) : [];
        const granted = [];
        for (const p of pts.slice(0, 100)) {
          try {
            const ok = await patientService.hasAccess(doc, p.walletAddress);
            if (ok) granted.push({ walletAddress: p.walletAddress, name: p.name || '' });
          } catch {}
        }
        if (active) setGrantedPatients(granted);
      } catch { setGrantedPatients([]); }
    };
    loadGranted();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Get Patient Details</h2>
      </div>

      <Card variant="elevated" className="p-6">
        <form onSubmit={onCheck} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient Wallet Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              disabled={checking}
            >
              {checking ? 'Checking...' : 'Check Access'}
            </button>
          </div>
        </form>
      </Card>

      {/* Section 1: Patients who granted access */}
      <Card variant="outlined" className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-900">Patients who granted you access</div>
          <div className="w-72"><SearchBar placeholder="Search by name or wallet" value={grantedQuery} onSearch={setGrantedQuery} onClear={() => setGrantedQuery('')} /></div>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2">Wallet</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grantedPatients.filter(g => (g.name||'').toLowerCase().includes(grantedQuery.toLowerCase()) || (g.walletAddress||'').toLowerCase().includes(grantedQuery.toLowerCase())).map(g => (
                <tr key={g.walletAddress} className="border-b">
                  <td className="px-3 py-2">{g.name || (g.walletAddress.slice(0,6)+'...'+g.walletAddress.slice(-4))}</td>
                  <td className="px-3 py-2 font-mono">{g.walletAddress}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => { setAddress(g.walletAddress); setTimeout(() => onCheck(), 0); }}
                      className="px-3 py-1 rounded-lg border text-sm hover:bg-gray-50"
                    >
                      View Records
                    </button>
                  </td>
                </tr>
              ))}
              {grantedPatients.length === 0 && (
                <tr><td colSpan="3" className="px-3 py-4 text-center text-gray-500">No patients have granted you access yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {hasAccess === false && (
        <Card variant="outlined" className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <UserIcon className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Access not granted</h3>
                <p className="text-sm text-gray-600">Request access now. The patient will see your request under "Grant Access" and can approve it.</p>
                {hasRequested && (
                  <div className="mt-2 text-sm text-amber-600">Request sent — pending patient approval.</div>
                )}
              </div>
            </div>
            <div>
              <button
                onClick={sendAccessRequest}
                disabled={requesting}
                className="px-4 py-2 border border-green-300 rounded-lg text-sm font-medium text-green-700 bg-white hover:bg-green-50 disabled:opacity-60"
              >
                {requesting ? 'Sending…' : 'Send Request for Access'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {hasAccess && profile && (
        <Card variant="outlined" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Patient</div>
              <div className="font-medium text-gray-900">{profile.name || (profile.walletAddress?.slice(0,6)+'...'+profile.walletAddress?.slice(-4))}</div>
            </div>
            <div>
              <div className="text-gray-500">DOB</div>
              <div className="text-gray-900">{profile.dateOfBirth || '—'}</div>
            </div>
            <div>
              <div className="text-gray-500">Blood Group</div>
              <div className="text-gray-900">{profile.bloodGroup || '—'}</div>
            </div>
          </div>
        </Card>
      )}

      {hasAccess && records.length === 0 && (
        <Card variant="outlined" className="p-6 text-center">
          <DocumentTextIcon className="mx-auto h-10 w-10 text-gray-300 mb-2" />
          <p className="text-sm text-gray-600">No records found for this patient.</p>
        </Card>
      )}

      {hasAccess && records.length > 0 && (
        <div className="space-y-4">
          {/* Prescriptions summary when available */}
          {prescriptions.length > 0 && (
            <Card variant="outlined" className="p-4">
              <div className="text-sm font-medium text-gray-900 mb-2">Prescriptions</div>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {prescriptions.map(pr => (
                  <li key={`rx-${pr.id}`}>{pr.diagnosis || 'Prescription'} — {pr.date}</li>
                ))}
              </ul>
            </Card>
          )}

          {records.map((r) => (
            <Card key={r.id} variant="elevated" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{r.diagnosis || 'Medical Record'}</div>
                  <div className="text-sm text-gray-500">{r.date} • {r.doctorAddress?.slice(0,6)}...{r.doctorAddress?.slice(-4)}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setExpandedRecordId(expandedRecordId === r.id ? null : r.id)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    {expandedRecordId === r.id ? 'Close View' : 'View'}
                  </button>
                </div>
              </div>
              {expandedRecordId === r.id && (
                <div className="mt-3 border-t pt-3 text-sm">
                  {r.ipfsHash && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1 text-left">Medical Documents</div>
                      {(() => {
                        const ipfs = r.ipfsHash;
                        let docs = [];
                        try { docs = typeof ipfs === 'string' ? JSON.parse(ipfs) : (Array.isArray(ipfs) ? ipfs : []); }
                        catch (e) { docs = String(ipfs).split(','); }
                        docs = (docs || []).filter(Boolean);
                        return (
                          <div className="space-y-1 text-left">
                            {docs.map((cid, i) => {
                              const clean = String(cid).replace(/"/g,'').trim();
                              if (!clean) return null;
                              return (
                                <a
                                  key={`doc-${r.id}-${i}`}
                                  href={`https://ipfs.io/ipfs/${clean}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-200 font-medium text-xs shadow transition-all break-all mr-2"
                                >
                                  <span className="truncate max-w-xs sm:max-w-md">{clean}</span>
                                  <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1 flex-shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <div className="mt-2"><span className="font-medium">Prescription:</span> {r.prescription || '—'}</div>
                  <div><span className="font-medium">Treatment:</span> {r.treatmentPlan || '—'}</div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Section 3: All IPFS links grouped by doctor */}
      {hasAccess && Object.keys(groupedIpfs).length > 0 && (
        <Card variant="outlined" className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-900">IPFS Documents grouped by doctor</div>
            <select value={groupFilter} onChange={(e)=>setGroupFilter(e.target.value)} className="px-2 py-1 border rounded-lg text-sm">
              <option value="all">All</option>
              {Object.keys(groupedIpfs).map(d => (
                <option key={`f-${d}`} value={d}>{d.slice(0,6)}...{d.slice(-4)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            {Object.entries(groupedIpfs).filter(([d]) => groupFilter==='all' || groupFilter===d).map(([doctor, docs]) => (
              <div key={`g-${doctor}`} className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Doctor: <span className="font-mono">{doctor}</span></div>
                <div className="space-y-1">
                  {docs.map((x, i) => {
                    let cids = [];
                    try {
                      if (typeof x.ipfsHash === 'string' && (x.ipfsHash.trim().startsWith('[') || x.ipfsHash.trim().startsWith('{'))) {
                        const parsed = JSON.parse(x.ipfsHash);
                        cids = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
                      } else if (typeof x.ipfsHash === 'string') cids = [x.ipfsHash];
                      else if (Array.isArray(x.ipfsHash)) cids = x.ipfsHash;
                    } catch { cids = [String(x.ipfsHash)]; }
                    cids = (cids||[]).filter(Boolean);
                    return (
                      <div key={`doc-${doctor}-${i}`} className="space-y-1">
                        <div className="flex flex-wrap gap-2">
                          {cids.map((cid, j) => {
                            const clean = String(cid).replace(/"/g,'').trim();
                            if (!clean) return null;
                            return (
                              <a
                                key={`cid-${doctor}-${i}-${j}`}
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
                        <span className="text-xs text-gray-500">{x.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Section 4: Prescriptions grouped by doctor */}
      {hasAccess && Object.keys(groupedRx).length > 0 && (
        <Card variant="outlined" className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-900">Prescriptions grouped by doctor</div>
            <select value={groupFilter} onChange={(e)=>setGroupFilter(e.target.value)} className="px-2 py-1 border rounded-lg text-sm">
              <option value="all">All</option>
              {Object.keys(groupedRx).map(d => (
                <option key={`frx-${d}`} value={d}>{d.slice(0,6)}...{d.slice(-4)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            {Object.entries(groupedRx).filter(([d]) => groupFilter==='all' || groupFilter===d).map(([doctor, list]) => (
              <div key={`rx-${doctor}`} className="border rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Doctor: <span className="font-mono">{doctor}</span></div>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {list.map(item => (
                    <li key={`rxi-${item.id}`}>{item.prescription || 'Prescription'} — {item.date}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && (
        <Card variant="outlined" className="p-4 text-sm text-red-600">{error}</Card>
      )}

      <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title={viewRecord?.diagnosis || 'Record'} size="lg">
        {viewRecord && (
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Date:</span> {viewRecord.date}</div>
            <div><span className="font-medium">Doctor:</span> {viewRecord.doctorAddress}</div>
            <div><span className="font-medium">Symptoms:</span> {(viewRecord.symptoms||[]).join(', ')}</div>
            <div><span className="font-medium">Prescription:</span> {viewRecord.prescription || '—'}</div>
            <div><span className="font-medium">Treatment:</span> {viewRecord.treatmentPlan || '—'}</div>
            {viewRecord.ipfsHash && (
              <div className="pt-2">
                <div className="text-sm font-medium text-gray-700 mb-1">Medical Documents</div>
                {(() => {
                  const ipfs = viewRecord.ipfsHash;
                  let docs = [];
                  try {
                    docs = typeof ipfs === 'string' ? JSON.parse(ipfs) : (Array.isArray(ipfs) ? ipfs : []);
                  } catch (e) {
                    docs = String(ipfs).split(',');
                  }
                  docs = (docs || []).filter(Boolean);
                  return (
                    <div className="flex flex-wrap gap-2">
                      {docs.map((cid, i) => {
                        const clean = String(cid).replace(/"/g,'').trim();
                        if (!clean) return null;
                        return (
                          <a
                            key={`view-doc-${viewRecord.id}-${i}`}
                            href={`https://ipfs.io/ipfs/${clean}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-200 font-medium text-xs shadow transition-all break-all"
                          >
                            <span className="truncate max-w-xs sm:max-w-md">{clean}</span>
                            <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1 flex-shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GetPatientDetails;
