import React, { useState } from 'react';
import { 
  KeyIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Alert from '../common/Alert';

const GrantAccess = () => {
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [accessList] = useState([
    {
      id: 'acc_001',
      provider: 'Health Insurance Co.',
      type: 'Insurance',
      grantedDate: '2024-01-15',
      expirationDate: '2024-12-31',
      purpose: 'Claims processing and verification',
      status: 'Active'
    },
    {
      id: 'acc_002',
      provider: 'Research Institute',
      type: 'Research',
      grantedDate: '2024-02-01',
      expirationDate: '2025-02-01',
      purpose: 'Medical research and statistical analysis',
      status: 'Active'
    }
  ]);

  const [newAccess, setNewAccess] = useState({
    provider: '',
    type: 'insurance',
    expirationDate: '',
    purpose: ''
  });

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState(null);

  const handleGrantAccess = () => {
    // TODO: Implement blockchain access grant
    console.log('Grant access:', newAccess);
    setShowGrantModal(false);
    setNewAccess({
      provider: '',
      type: 'insurance',
      expirationDate: '',
      purpose: ''
    });
  };

  const handleRevokeAccess = (access) => {
    setSelectedAccess(access);
    setShowRevokeModal(true);
  };

  const confirmRevoke = () => {
    // TODO: Implement blockchain access revoke
    console.log('Revoke access:', selectedAccess);
    setShowRevokeModal(false);
    setSelectedAccess(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grant Access</h2>
          <p className="text-sm text-gray-500 mt-1">
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
      {accessList.length === 0 ? (
        <Card variant="outlined" className="text-center py-12">
          <KeyIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Access Granted</h3>
          <p className="text-sm text-gray-500 mb-4">
            No third parties currently have access to your medical records.
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
          {accessList.map((access) => (
            <Card key={access.id} variant="elevated" className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    access.type === 'Insurance' 
                      ? 'bg-blue-100' 
                      : 'bg-purple-100'
                  }`}>
                    {access.type === 'Insurance' ? (
                      <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                    ) : (
                      <UserGroupIcon className="w-6 h-6 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {access.provider}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        access.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {access.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{access.purpose}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Type:</span> {access.type}
                      </div>
                      <div>
                        <span className="font-medium">Granted:</span>{' '}
                        {new Date(access.grantedDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span>{' '}
                        {new Date(access.expirationDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeAccess(access)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors"
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
        title="Grant Access"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider Name
            </label>
            <input
              type="text"
              value={newAccess.provider}
              onChange={(e) => setNewAccess({ ...newAccess, provider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Health Insurance Co."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Type
            </label>
            <select
              value={newAccess.type}
              onChange={(e) => setNewAccess({ ...newAccess, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="insurance">Insurance</option>
              <option value="research">Research</option>
              <option value="family">Family Member</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration Date
            </label>
            <input
              type="date"
              value={newAccess.expirationDate}
              onChange={(e) => setNewAccess({ ...newAccess, expirationDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose
            </label>
            <textarea
              value={newAccess.purpose}
              onChange={(e) => setNewAccess({ ...newAccess, purpose: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe why this provider needs access to your records"
            />
          </div>

          <div className="flex items-center space-x-2 text-sm text-amber-600">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span>This action will be recorded on the blockchain</span>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowGrantModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
        message={`Are you sure you want to revoke access for ${selectedAccess?.provider}? This action will be recorded on the blockchain.`}
        confirmText="Revoke Access"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default GrantAccess;
