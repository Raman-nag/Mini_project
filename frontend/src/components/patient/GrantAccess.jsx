import React, { useState, useEffect } from 'react';
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
import { useToast } from '../../contexts/ToastContext';

const GrantAccess = () => {
  const { showToast } = useToast();
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [accessList, setAccessList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newAccess, setNewAccess] = useState({
    doctorAddress: '',
    purpose: ''
  });

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState(null);

  // Load access list from blockchain
  useEffect(() => {
    loadAccessList();
  }, []);

  const loadAccessList = async () => {
    try {
      setIsLoading(true);
      const result = await patientService.getAccessList();
      if (result.success) {
        setAccessList(result.accessList || []);
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
      const result = await patientService.revokeAccess(selectedAccess.doctorAddress);
      
      if (result.success) {
        showToast('Access revoked successfully on blockchain!', 'success');
        setShowRevokeModal(false);
        setSelectedAccess(null);
        // Reload access list
        await loadAccessList();
      } else {
        throw new Error(result.error || 'Failed to revoke access');
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      showToast(error.message || 'Failed to revoke access', 'error');
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
        <div className="space-y-4">
          {accessList.map((access, index) => (
            <Card key={access.doctorAddress || index} variant="elevated" className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <UserGroupIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Doctor
                      </h3>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <WalletIcon className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {access.doctorAddress}
                      </p>
                    </div>
                    {access.purpose && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{access.purpose}</p>
                    )}
                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Granted:</span>{' '}
                        {access.grantedAt ? new Date(Number(access.grantedAt) * 1000).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeAccess(access)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Revoke
                </button>
              </div>
            </Card>
          ))}
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
    </div>
  );
};

export default GrantAccess;
