import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardDocumentListIcon, PencilSquareIcon, TrashIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Button from '../common/Button';
import doctorService from '../../services/doctorService';
import { getProvider } from '../../utils/web3';
import { useToast } from '../../contexts/ToastContext';
import { DISEASE_CATEGORIES } from '../../data/diseaseCategories';

const parseItems = (prescription) => {
  try {
    const parsed = typeof prescription === 'string' ? JSON.parse(prescription) : prescription;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const DoctorPrescriptions = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null); // record object
  const [form, setForm] = useState({ title: '', notes: '', items: [] });
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ disease: '', patient: '', from: '', to: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = getProvider();
      const signer = await provider.getSigner();
      const doctorAddress = await signer.getAddress();
      const res = await doctorService.getDoctorPrescriptions(doctorAddress, 1000);
      const arr = Array.isArray(res?.prescriptions) ? res.prescriptions : [];
      setList(arr.map(r => ({
        id: r.id,
        date: r.date,
        patientAddress: r.patientAddress,
        doctorAddress: r.doctorAddress,
        diagnosis: r.diagnosis,
        prescription: r.prescription,
        treatmentPlan: r.treatmentPlan,
        ipfsHash: r.ipfsHash,
        isActive: r.isActive !== undefined ? r.isActive : true,
      })));
    } catch (e) {
      setError(e?.message || 'Failed to load prescriptions');
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getDiseaseCategory = (diagnosis) => {
    if (!diagnosis) return '';
    const text = String(diagnosis);
    const parts = text.split(' - ');
    const head = parts[0]?.trim();
    const match = DISEASE_CATEGORIES.find(
      (cat) => cat.toLowerCase() === head.toLowerCase()
    );
    return match || head;
  };

  const filteredList = useMemo(() => {
    let rows = [...list];

    if (filters.disease) {
      const target = filters.disease.toLowerCase();
      rows = rows.filter((r) => getDiseaseCategory(r.diagnosis).toLowerCase() === target);
    }

    if (filters.patient) {
      const q = filters.patient.toLowerCase();
      rows = rows.filter((r) =>
        (r.patientAddress || '').toLowerCase().includes(q)
      );
    }

    if (filters.from || filters.to) {
      rows = rows.filter((r) => {
        if (!r.date) return false;
        const d = new Date(r.date);
        if (Number.isNaN(d.getTime())) return false;
        if (filters.from) {
          const from = new Date(filters.from);
          if (d < from) return false;
        }
        if (filters.to) {
          const to = new Date(filters.to);
          to.setHours(23, 59, 59, 999);
          if (d > to) return false;
        }
        return true;
      });
    }

    return rows;
  }, [list, filters]);

  const openEdit = (rec) => {
    if (!rec.isActive) {
      showWarning('This prescription is closed and cannot be edited.');
      return;
    }
    const items = parseItems(rec.prescription);
    setForm({
      title: rec.diagnosis || 'Prescription',
      notes: rec.treatmentPlan || '',
      items: items.length > 0 ? items : [{ type: 'Tablet', name: '', dosage: '', unit: 'mg', frequency: '', duration: '', instructions: '' }],
    });
    setEditing(rec);
  };

  const updateItem = (idx, field, value) => {
    setForm(prev => ({ ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, [field]: value } : it) }));
  };
  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { type: 'Tablet', name: '', dosage: '', unit: 'mg', frequency: '', duration: '', instructions: '' }] }));
  const removeItem = (idx) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const submitEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        diagnosis: form.title,
        symptoms: [],
        prescription: JSON.stringify(form.items || []),
        treatmentPlan: form.notes || '',
      };
      await doctorService.updateRecord(editing.id, payload, []);
      showSuccess('Prescription updated');
      setEditing(null);
      await load();
    } catch (e) {
      showError(e?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (rec) => {
    if (!rec.isActive) {
      showWarning('This prescription is already closed. Delete is not available.');
      return;
    }
    // Smart contract does not expose delete/deactivate; inform user.
    showWarning('Delete is not supported by the current smart contract. You can edit the prescription instead.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Prescriptions</h2>
        <div className="text-xs text-gray-500">Doctor: auto-detected from connected wallet</div>
      </div>

      <Card variant="outlined">
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="mb-1 font-medium text-gray-700">Disease Category</div>
              <select
                value={filters.disease}
                onChange={(e) => setFilters((prev) => ({ ...prev, disease: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 hover:border-purple-300 bg-white"
              >
                <option value="">All</option>
                {DISEASE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 font-medium text-gray-700">Patient (address)</div>
              <input
                type="text"
                value={filters.patient}
                onChange={(e) => setFilters((prev) => ({ ...prev, patient: e.target.value }))}
                placeholder="Search by wallet..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 hover:border-purple-300 bg-white"
              />
            </div>
            <div>
              <div className="mb-1 font-medium text-gray-700">From date</div>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 hover:border-purple-300 bg-white"
              />
            </div>
            <div>
              <div className="mb-1 font-medium text-gray-700">To date</div>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 hover:border-purple-300 bg-white"
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <Card variant="outlined" className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Loading...</h3>
        </Card>
      ) : error ? (
        <Card variant="outlined" className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load</h3>
          <p className="text-sm text-gray-500">{error}</p>
        </Card>
      ) : list.length === 0 ? (
        <Card variant="outlined" className="text-center py-12">
          <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No prescriptions yet</h3>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredList.map((r) => (
            <Card
              key={r.id}
              variant="elevated"
              className="p-4 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center"><UserIcon className="w-4 h-4 mr-2" />{r.patientAddress ? `${r.patientAddress.slice(0,6)}...${r.patientAddress.slice(-4)}` : '—'}</div>
                    <div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2" />{r.date}</div>
                  </div>
                  <div className="mt-2 text-gray-900 font-medium">{r.diagnosis || 'Prescription'}</div>
                  <div className="text-sm text-gray-600">Items: {parseItems(r.prescription).length}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {!r.isActive && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Closed</span>
                  )}
                  <button onClick={() => openEdit(r)} disabled={!r.isActive} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60">
                    <PencilSquareIcon className="w-4 h-4 mr-1" /> Edit
                  </button>
                  <button onClick={() => onDelete(r)} disabled={!r.isActive} className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm text-red-700 hover:bg-red-50 disabled:opacity-60">
                    <TrashIcon className="w-4 h-4 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Prescription" size="xl">
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input value={form.title} onChange={(e)=>setForm(prev=>({...prev,title:e.target.value}))} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                <input value={form.notes} onChange={(e)=>setForm(prev=>({...prev,notes:e.target.value}))} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
            </div>

            <div className="space-y-4">
              {form.items.map((it, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Item #{idx+1}</div>
                    {form.items.length > 1 && (
                      <button type="button" onClick={()=>removeItem(idx)} className="text-xs px-2 py-1 border rounded-md">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500">Type</label>
                      <select value={it.type} onChange={(e)=>updateItem(idx,'type',e.target.value)} className="mt-1 block w-full border rounded-md px-2 py-1">
                        <option>Tablet</option>
                        <option>Capsule</option>
                        <option>Injection</option>
                        <option>Syrup</option>
                        <option>Tonic</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Name</label>
                      <input value={it.name} onChange={(e)=>updateItem(idx,'name',e.target.value)} className="mt-1 block w-full border rounded-md px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Dosage</label>
                      <input value={it.dosage} onChange={(e)=>updateItem(idx,'dosage',e.target.value)} className="mt-1 block w-full border rounded-md px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Unit</label>
                      <select value={it.unit} onChange={(e)=>updateItem(idx,'unit',e.target.value)} className="mt-1 block w-full border rounded-md px-2 py-1">
                        <option>mg</option>
                        <option>ml</option>
                        <option>IU</option>
                        <option>g</option>
                        <option>mcg</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Frequency</label>
                      <input value={it.frequency} onChange={(e)=>updateItem(idx,'frequency',e.target.value)} className="mt-1 block w-full border rounded-md px-2 py-1" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">Duration</label>
                      <input value={it.duration} onChange={(e)=>updateItem(idx,'duration',e.target.value)} className="mt-1 block w-full border rounded-md px-2 py-1" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-500">Instructions</label>
                      <textarea value={it.instructions} onChange={(e)=>updateItem(idx,'instructions',e.target.value)} rows={2} className="mt-1 block w-full border rounded-md px-2 py-1" />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-sm px-3 py-2 border rounded-md">Add Item</button>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="ghost" onClick={()=>setEditing(null)}>Cancel</Button>
              <Button onClick={submitEdit} loading={saving}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorPrescriptions;
