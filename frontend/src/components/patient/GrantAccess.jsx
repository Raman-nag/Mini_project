import React, { useEffect, useRef, useState } from 'react';
import { 
  KeyIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Alert from '../common/Alert';
import patientService from '../../services/patientService';
import { getPatientContract, getHospitalContract, getDoctorContract } from '../../utils/contract';
import { useToast } from '../../contexts/ToastContext';

const GrantAccess = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const showToast = (message, type = 'info') => {
    if (type === 'success') return showSuccess(message);
    if (type === 'error') return showError(message);
    if (type === 'warning') return showWarning(message);
    return showInfo(message);
  };

  const openDoctorDetails = async (doctorAddress) => {
    setSelectedDoctorAddress(doctorAddress);
    setShowDoctorModal(true);
    setDoctorDetails(null);
    setDoctorDetailsLoading(true);
    setPreviousVisits([]);
    try {
      // Fetch doctor profile from DoctorManagement mapping
      const doctorContract = await getDoctorContract();
      let profile = null;
      try {
        if (typeof doctorContract.doctors === 'function') {
          profile = await doctorContract.doctors(doctorAddress);
        }
      } catch {}

      // Enrich with hospital name (if available)
      let hospitalName = '';
      try {
        const hospitalAddr = profile?.hospitalAddress;
        if (hospitalAddr && hospitalAddr !== '0x0000000000000000000000000000000000000000') {
          const hospital = await getHospitalContract();
          const details = await hospital.getHospitalDetails(hospitalAddr);
          // getHospitalDetails returns tuple; first element is name
          hospitalName = Array.isArray(details) ? (details[0] || '') : '';
        }
      } catch {}

      if (!profile) {
        setDoctorDetails({ address: doctorAddress });
        showToast('Unable to load full doctor profile from chain', 'warning');
      } else {
        const ts = Number(profile?.timestamp || 0) * 1000;
        const years = ts ? Math.max(0, Math.floor((Date.now() - ts) / (365 * 24 * 60 * 60 * 1000))) : 0;
        setDoctorDetails({
          address: doctorAddress,
          name: profile?.name || '',
          specialization: profile?.specialization || '',
          licenseNumber: profile?.licenseNumber || '',
          hospital: hospitalName || (profile?.hospitalAddress || ''),
          yearsOfExperience: years,
          isActive: Boolean(profile?.isActive),
        });
      }

      // Fetch previous visits between this doctor and current patient
      try {
        const pc = await getPatientContract();
        const signer = await pc.signer;
        const patientAddr = await signer.getAddress();
        const res = await patientService.getMyRecords(patientAddr);
        const visits = (res?.records || [])
          .filter(r => String(r.doctorAddress || '').toLowerCase() === String(doctorAddress).toLowerCase())
          .map(r => ({
            id: r.id,
            date: r.date,
            diagnosis: r.diagnosis,
            prescription: r.prescription,
            treatmentPlan: r.treatmentPlan,
          }));
        setPreviousVisits(visits);
      } catch {}
    } catch (err) {
      console.error('Load doctor details error:', err);
      setDoctorDetails({ address: doctorAddress });
      showToast(err?.message || 'Failed to load doctor details', 'error');
    } finally {
      setDoctorDetailsLoading(false);
    }
  };
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [accessList, setAccessList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Doctor details modal state
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorDetailsLoading, setDoctorDetailsLoading] = useState(false);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [selectedDoctorAddress, setSelectedDoctorAddress] = useState('');
  const [previousVisits, setPreviousVisits] = useState([]);

  const [newAccess, setNewAccess] = useState({
    doctorAddress: '',
    purpose: ''
  });

  // Tabs and search state
  const [activeTab, setActiveTab] = useState('Pending'); // Pending | Granted | Rejected
  const [search, setSearch] = useState({ Pending: '', Granted: '', Rejected: '' });

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState(null);

  // Load access list from blockchain and subscribe to grant/revoke events
  const eventsSubRef = useRef(null);
  useEffect(() => {
    loadAccessList();
    (async () => {
      try {
        const contract = await getPatientContract();
        const signer = await contract.signer;
        const patient = await signer.getAddress();
        const onGranted = () => loadAccessList();
        const onRevoked = () => loadAccessList();
        const grantedFilter = contract.filters.AccessGranted(patient, null);
        const revokedFilter = contract.filters.AccessRevoked(patient, null);
        contract.on(grantedFilter, onGranted);
        contract.on(revokedFilter, onRevoked);
        eventsSubRef.current = { contract, grantedFilter, revokedFilter, onGranted, onRevoked };
      } catch {}
    })();
    return () => {
      (async () => {
        try {
          const sub = eventsSubRef.current;
          if (sub) {
            sub.contract.off(sub.grantedFilter, sub.onGranted);
            sub.contract.off(sub.revokedFilter, sub.onRevoked);
            eventsSubRef.current = null;
          }
        } catch {}
      })();
    };
  }, []);

  const loadAccessList = async () => {
    try {
      setIsLoading(true);
      const result = await patientService.getAccessList();
      if (result.success) {
        setAccessList((result.accessList || []).map(item => ({
          ...item,
          // fallback formatting for timestamps if service didn't provide
          grantedAtTs: item.grantedAtTs || (item.grantedAt ? Number(item.grantedAt) : 0),
          revokedAtTs: item.revokedAtTs || (item.revokedAt ? Number(item.revokedAt) : 0),
        })));
      } else {
        showToast('Failed to load access list', 'error');
      }
    } catch (error) {
      console.error('Error loading access list:', error);
      showToast('Error loading access list', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!newAccess.doctorAddress.trim()) {
      showToast('Please enter a doctor wallet address', 'error');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(newAccess.doctorAddress)) {
      showToast('Invalid Ethereum wallet address', 'error');
      return;
    }

    try {
      const result = await patientService.grantAccess(newAccess.doctorAddress);
      
      if (result.success) {
        showToast('Access granted successfully on blockchain!', 'success');
        setShowGrantModal(false);
        setNewAccess({
          doctorAddress: '',
          purpose: ''
        });
        // Reload access list
        await loadAccessList();
      } else {
        throw new Error(result.error || 'Failed to grant access');
      }
    } catch (error) {
      console.error('Error granting access:', error);
      showToast(error.message || 'Failed to grant access', 'error');
    }
  };

  const handleRevokeAccess = (access) => {
    setSelectedAccess(access);
    setShowRevokeModal(true);
  };

  const confirmRevoke = async () => {
    if (!selectedAccess) return;

    try {
      // Pre-check: verify access is currently active to avoid contract revert
      const contract = await getPatientContract();
      const signer = await contract.signer;
      const patientAddr = await signer.getAddress();
      const active = await patientService.hasAccess(selectedAccess.doctorAddress, patientAddr);

      if (!active) {
        showToast('No active access found for this doctor—it may have already been revoked.', 'warning');
        setShowRevokeModal(false);
        setSelectedAccess(null);
        await loadAccessList();
        return;
      }

      const result = await patientService.revokeAccess(selectedAccess.doctorAddress);
      
      if (result.success) {
        showToast('Access revoked successfully on blockchain!', 'success');
        setShowRevokeModal(false);
        // Optimistically mark as Revoked in the list immediately
        setAccessList(prev => prev.map(a => a.doctorAddress?.toLowerCase() === selectedAccess.doctorAddress?.toLowerCase()
          ? { ...a, status: 'Revoked', revokedAtTs: Math.floor(Date.now()/1000) }
          : a));
        setSelectedAccess(null);
        // Then refresh from chain to ensure live state
        await loadAccessList();
      } else {
        throw new Error(result.error || 'Failed to revoke access');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      const msg = String(error?.message || '').toLowerCase();
      if (error?.code === 'UNPREDICTABLE_GAS_LIMIT' || msg.includes('no active access') || msg.includes('revert')) {
        showToast('No active access found for this doctor—it may have already been revoked.', 'warning');
      } else {
        showToast(error.message || 'Failed to revoke access', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Grant Access</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage who can access your medical records
          </p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Grant Access
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
        <div className="px-4 pt-4">
          <div className="flex items-center space-x-2">
            {['Pending','Granted','Rejected'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-2 text-sm rounded-lg border ${activeTab === t ? 'border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                {t}
              </button>
            ))}
            <div className="ml-auto">
              <input
                type="text"
                value={search[activeTab]}
                onChange={(e) => setSearch(prev => ({ ...prev, [activeTab]: e.target.value }))}
                placeholder={`Search ${activeTab.toLowerCase()} by address...`}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Alert type="info" title="Access Control" dismissible>
        You have full control over who can access your medical records. All access grants are
        recorded on the blockchain for transparency and security.
      </Alert>

      {/* Access List */}
      {isLoading ? (
        <Card variant="outlined" className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-4">Loading access list...</p>
        </Card>
      ) : accessList.length === 0 ? (
        <Card variant="outlined" className="text-center py-12">
          <KeyIcon className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Access Granted</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No doctors currently have access to your medical records.
          </p>
          <button
            onClick={() => setShowGrantModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Grant First Access
          </button>
        </Card>
      ) : (
        <div className="space-y-6">
          {(() => {
            const pendingAll = accessList.filter(a => a.status === 'Pending');
            const activeAll = accessList.filter(a => a.status === 'Active');
            const revokedAll = accessList.filter(a => a.status === 'Revoked');

            const matches = (addr, q) => String(addr || '').toLowerCase().includes(String(q || '').toLowerCase());
            const pending = pendingAll.filter(a => matches(a.doctorAddress, search.Pending));
            const active = activeAll.filter(a => matches(a.doctorAddress, search.Granted));
            const revoked = revokedAll.filter(a => matches(a.doctorAddress, search.Rejected));

            return (
              <>
                {activeTab === 'Pending' && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Doctors who are waiting for your access permission</h3>
                    {pending.map((access, index) => (
                      <Card key={`pending-${access.doctorAddress || index}`} variant="elevated" className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doctor</h3>
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <WalletIcon className="w-4 h-4 text-gray-400" />
                                <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{access.doctorAddress}</p>
                              </div>
                              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                                <div>
                                  <span className="font-medium">Requested:</span>{' '}
                                  {access.requestedAtTs ? new Date(Number(access.requestedAtTs) * 1000).toLocaleString() : '—'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await patientService.grantAccess(access.doctorAddress);
                                  if (res?.success) {
                                    showToast('Access granted successfully on blockchain!', 'success');
                                    await loadAccessList();
                                  } else {
                                    showToast('Failed to grant access', 'error');
                                  }
                                } catch (e) {
                                  showToast(e?.message || 'Failed to grant access', 'error');
                                }
                              }}
                              className="inline-flex items-center px-3 py-2 border border-green-300 dark:border-green-700 rounded-lg text-sm font-medium text-green-700 dark:text-green-400 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-2" />
                              Approve
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await patientService.rejectRequest(access.doctorAddress);
                                  if (res?.success) {
                                    showToast('Request rejected on blockchain', 'success');
                                    await loadAccessList();
                                  } else {
                                    showToast('Failed to reject request', 'error');
                                  }
                                } catch (e) {
                                  showToast(e?.message || 'Failed to reject request', 'error');
                                }
                              }}
                              className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => openDoctorDetails(access.doctorAddress)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                            >
                              View Doctor Details
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {activeTab === 'Granted' && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Currently Granted</h3>
                    {active.map((access, index) => (
                      <Card key={`active-${access.doctorAddress || index}`} variant="elevated" className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doctor</h3>
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</span>
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <WalletIcon className="w-4 h-4 text-gray-400" />
                                <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{access.doctorAddress}</p>
                              </div>
                              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                                <div>
                                  <span className="font-medium">Granted:</span>{' '}
                                  {access.grantedAtTs ? new Date(Number(access.grantedAtTs) * 1000).toLocaleString() : 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Revoked:</span>{' '}
                                  {access.revokedAtTs ? new Date(Number(access.revokedAtTs) * 1000).toLocaleString() : '—'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRevokeAccess(access)}
                              className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4 mr-2" />
                              Revoke
                            </button>
                            <button
                              onClick={() => openDoctorDetails(access.doctorAddress)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                            >
                              View Doctor Details
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {activeTab === 'Rejected' && (
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Revoked / History</h3>
                    {revoked.map((access, index) => (
                      <Card key={`revoked-${access.doctorAddress || index}`} variant="elevated" className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doctor</h3>
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Revoked</span>
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <WalletIcon className="w-4 h-4 text-gray-400" />
                                <p className="text-sm font-mono text-gray-600 dark:text-gray-400">{access.doctorAddress}</p>
                              </div>
                              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                                <div>
                                  <span className="font-medium">Granted:</span>{' '}
                                  {access.grantedAtTs ? new Date(Number(access.grantedAtTs) * 1000).toLocaleString() : 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Revoked:</span>{' '}
                                  {access.revokedAtTs ? new Date(Number(access.revokedAtTs) * 1000).toLocaleString() : '—'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <button
                              onClick={() => openDoctorDetails(access.doctorAddress)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
                            >
                              View Doctor Details
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      {/* Grant Access Modal */}
      <Modal
        isOpen={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        title="Grant Access to Doctor"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Doctor Wallet Address *
            </label>
            <input
              type="text"
              value={newAccess.doctorAddress}
              onChange={(e) => setNewAccess({ ...newAccess, doctorAddress: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the wallet address of the doctor you want to grant access to
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Purpose (Optional)
            </label>
            <textarea
              value={newAccess.purpose}
              onChange={(e) => setNewAccess({ ...newAccess, purpose: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Describe why this doctor needs access to your records"
            />
          </div>

          <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>This action will be recorded on the blockchain</span>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowGrantModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleGrantAccess}
              className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Grant Access
            </button>
          </div>
        </div>
      </Modal>

      {/* Revoke Confirmation Modal */}
      <Modal.Confirmation
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={confirmRevoke}
        title="Revoke Access"
        message={`Are you sure you want to revoke access for doctor ${selectedAccess?.doctorAddress}? This action will be recorded on the blockchain.`}
        confirmText="Revoke Access"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Doctor Details Modal */}
      <Modal
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        title="Doctor Details"
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Address: <span className="font-mono">{selectedDoctorAddress}</span>
          </div>
          {doctorDetailsLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-4">Loading doctor profile...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Name</div>
                <div className="text-sm text-gray-900 dark:text-white">{doctorDetails?.name || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Specialization</div>
                <div className="text-sm text-gray-900 dark:text-white">{doctorDetails?.specialization || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">License Number</div>
                <div className="text-sm text-gray-900 dark:text-white">{doctorDetails?.licenseNumber || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Hospital</div>
                <div className="text-sm text-gray-900 dark:text-white">{doctorDetails?.hospital || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Years of Experience</div>
                <div className="text-sm text-gray-900 dark:text-white">{Number.isFinite(doctorDetails?.yearsOfExperience) ? `${doctorDetails.yearsOfExperience} years` : '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500 dark:text-gray-400">Status</div>
                <div className="text-sm text-gray-900 dark:text-white">{doctorDetails?.isActive ? 'Active' : 'Inactive'}</div>
              </div>
            </div>
          )}

          {previousVisits && previousVisits.length > 0 && (
            <div className="pt-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Previous Visits with You</h4>
              <div className="border rounded-lg divide-y">
                {previousVisits.map(v => (
                  <div key={v.id} className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 dark:text-white">{v.date}</div>
                      <div className="text-xs text-gray-500">#{v.id}</div>
                    </div>
                    <div className="mt-1 text-gray-700 dark:text-gray-300">
                      <div><span className="font-medium">Diagnosis:</span> {v.diagnosis || '—'}</div>
                      <div><span className="font-medium">Prescription:</span> {v.prescription || '—'}</div>
                      <div><span className="font-medium">Treatment:</span> {v.treatmentPlan || '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setShowDoctorModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GrantAccess;
