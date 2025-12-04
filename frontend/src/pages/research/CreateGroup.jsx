import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProvider } from '../../utils/web3';
import { createGroup } from '../../services/researchOrgService';
import hospitalService from '../../services/hospitalService';
import { useToast } from '../../contexts/ToastContext';
import { DISEASE_CATEGORIES } from '../../data/diseaseCategories';

const CreateGroup = () => {
  const { showSuccess, showError } = useToast();
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');
  const [filters, setFilters] = useState({ disease: '' });
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState({});
  const [form, setForm] = useState({ name: '', groupIdHuman: '', purpose: '', leaderName: '' });
  const [leaderWallet, setLeaderWallet] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState('');

  const isFiltersActive = !!(searchQuery || filters.disease);

  useEffect(() => {
    const init = async () => {
      setLoadingPatients(true);
      setError('');
      try {
        const provider = getProvider();
        if (!provider) throw new Error('Wallet provider not available');
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        setLeaderWallet(address);
        setNetworkStatus('connected');

        // Load lightweight patient summaries for research (wallet, name, diseaseType)
        const summaries = await hospitalService.getPatientsSummary();
        console.debug('[CreateGroup] patient summaries', summaries);
        const transformed = summaries.map((p, idx) => ({
          id: p.walletAddress || `pat_${idx}`,
          walletAddress: p.walletAddress,
          name:
            p.name ||
            (p.walletAddress
              ? `${p.walletAddress.slice(0, 6)}...${p.walletAddress.slice(-4)}`
              : ''),
          diseases: Array.isArray(p.diseases)
            ? p.diseases.map((d) => (d || '').trim()).filter(Boolean)
            : [],
        }));
        console.debug('[CreateGroup] transformed patients for filtering', transformed);
        setPatients(transformed);
        setFilteredPatients(transformed);
      } catch (e) {
        setNetworkStatus('disconnected');
        setError(e?.message || 'Failed to load patients from Hospital Management. Please check your connection or try again.');
      } finally {
        setLoadingPatients(false);
      }
    };
    init();
  }, []);

  const toggleSelectAll = () => {
    if (filteredPatients.length === 0) return;
    const allSelected = Object.keys(selected).length === filteredPatients.length;
    if (allSelected) {
      setSelected({});
    } else {
      const next = {};
      filteredPatients.forEach((p) => { next[p.walletAddress] = true; });
      setSelected(next);
    }
  };

  const togglePatient = (addr) => {
    setSelected((prev) => ({ ...prev, [addr]: !prev[addr] }));
  };

  const onChangeFilter = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    // If no filters are active, reset to the full dataset
    if (!isFiltersActive) {
      setFilteredPatients(patients || []);
      return;
    }

    if (!patients || patients.length === 0) {
      setFilteredPatients([]);
      return;
    }

    setFiltering(true);
    let list = patients;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.walletAddress || '').toLowerCase().includes(q)
      );
    }

    if (filters.disease) {
      const target = filters.disease.toLowerCase().trim();
      list = list.filter((p) =>
        Array.isArray(p.diseases)
          ? p.diseases.some((d) => (d || '').toLowerCase().trim() === target)
          : false
      );
    }

    console.debug('[CreateGroup] filters applied', { filters, searchQuery, resultCount: list.length, results: list });
    setFilteredPatients(list);
    setFiltering(false);
  };

  const handleClearFilters = () => {
    setFilters({ disease: '' });
    setSearchQuery('');
    setFilteredPatients(patients || []);
  };

  const onChangeForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!form.name || !form.groupIdHuman || !form.purpose) {
      showError('Please fill all group details');
      return;
    }
    const selectedAddrs = Object.entries(selected)
      .filter(([_, v]) => v)
      .map(([addr]) => addr);
    setSubmitting(true);
    try {
      await createGroup({
        name: form.name,
        groupIdHuman: form.groupIdHuman,
        purpose: form.purpose,
        leaderName: form.leaderName,
        leaderWallet,
        diseaseCategory: filters.disease,
        patients: selectedAddrs,
      });
      showSuccess('Group created and access requested from selected patients');
      setForm({ name: '', groupIdHuman: '', purpose: '', leaderName: '' });
      setSelected({});
    } catch (e) {
      showError(e?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout userRole="research" userProfile={{}} walletAddress={walletAddress} networkStatus={networkStatus}>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2 rounded-xl">
            {error}
          </div>
        )}
        <div className="bg-gradient-to-r from-sky-600 to-cyan-600 rounded-2xl p-6 text-white shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create New Research Group</h1>
          <p className="text-sky-100 mt-1 text-sm md:text-base">Filter patients, select participants, and define the study</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: filters + matching patients */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters card */}
            <div className="bg-white rounded-2xl shadow-md p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3 md:space-y-0">
                <input
                  type="text"
                  placeholder="Search by patient name or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <select
                  value={filters.disease}
                  onChange={(e) => onChangeFilter('disease', e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="">Disease category</option>
                  {DISEASE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Filters use the live patient dataset from Hospital Management (name, diagnosis, demographics).
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    disabled={loadingPatients || filtering}
                    className="inline-flex items-center px-3 py-1.5 rounded-full border border-sky-100 text-xs text-sky-700 hover:bg-sky-50"
                  >
                    Clear Filters
                  </button>
                  <button
                    type="button"
                    onClick={applyFilters}
                    disabled={loadingPatients || filtering}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-sky-600 text-xs text-white font-semibold shadow-sm hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {filtering ? 'Searching…' : 'Search'}
                  </button>
                </div>
              </div>
            </div>

            {/* Matching patients card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Matching patients</h2>
                <p className="text-[11px] text-gray-500">
                  {loadingPatients
                    ? 'Loading the list of registered patients from Hospital Management…'
                    : !isFiltersActive
                      ? `All registered patients are listed below. Use filters and click "Search" to narrow results. (${filteredPatients.length} patients total)`
                      : filteredPatients.length === 0
                        ? 'No patients found matching the filters. Try adjusting one or more criteria or clear filters.'
                        : `${filteredPatients.length} patients found matching the current filters.`}
                </p>
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Select</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Address</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Disease type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPatients.length === 0 && !loadingPatients && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-400 text-xs">
                          No patients found matching the current filters. Try different criteria or clear filters.
                        </td>
                      </tr>
                    )}
                    {filteredPatients.map((p) => {
                      const addr = p.walletAddress;
                      return (
                        <tr key={addr} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={!!selected[addr]}
                              onChange={() => togglePatient(addr)}
                              className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-gray-700">{addr}</td>
                          <td className="px-3 py-2 text-gray-600 text-[11px]">{p.name || 'Unnamed patient'}</td>
                          <td className="px-3 py-2 text-gray-600 text-[11px]">
                            {Array.isArray(p.diseases) && p.diseases.length > 0
                              ? p.diseases.join(', ')
                              : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column: group details */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-md p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Group details</h2>
              <input
                type="text"
                placeholder="Group name"
                value={form.name}
                onChange={(e) => onChangeForm('name', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <input
                type="text"
                placeholder="Group ID (unique per org)"
                value={form.groupIdHuman}
                onChange={(e) => onChangeForm('groupIdHuman', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <textarea
                placeholder="Purpose of this group/study"
                value={form.purpose}
                onChange={(e) => onChangeForm('purpose', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <input
                type="text"
                placeholder="Group leader name"
                value={form.leaderName}
                onChange={(e) => onChangeForm('leaderName', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <input
                type="text"
                placeholder="Group leader wallet"
                value={leaderWallet}
                onChange={(e) => setLeaderWallet(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={submitting}
                className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-sky-600 text-white text-sm font-semibold py-2.5 shadow-sm hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating group...' : 'Create Group & Send Requests'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateGroup;
