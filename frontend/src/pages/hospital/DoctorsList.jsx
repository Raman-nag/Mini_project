import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import hospitalService from '../../services/hospitalService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const truncate = (addr = '') => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const DoctorsList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await hospitalService.getDoctors();
      if (res?.success) {
        setDoctors(res.doctors || []);
      } else {
        setError(res?.message || 'Failed to load doctors');
      }
    } catch (e) {
      setError(e?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetails = async (d) => {
    setSelected(d);
    setDetails(null);
    setDetailsError('');
    setDetailsLoading(true);
    try {
      const res = await hospitalService.getDoctorDetailsWithStats(d.walletAddress);
      if (res?.success) {
        setDetails(res);
      } else {
        setDetailsError(res?.message || 'Failed to load doctor details');
      }
    } catch (e) {
      setDetailsError(e?.message || 'Failed to load doctor details');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div>
              <Card.Title>Doctors ({doctors.length})</Card.Title>
              <Card.Description>All doctors registered by your hospital</Card.Description>
            </div>
            <Button onClick={() => navigate('/hospital/add-doctor')}>Add Doctor</Button>
          </div>
        </Card.Header>
        <Card.Body>
          {loading && <p className="text-sm text-gray-500">Loading doctors...</p>}
          {error && !loading && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specialization</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">License</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Wallet</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {doctors.map((d) => (
                    <tr key={d.walletAddress}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {d.name && d.name.trim().length > 0 ? d.name : truncate(d.walletAddress)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {d.specialization || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {d.licenseNumber || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                        {d.walletAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Button variant="ghost" size="sm" onClick={() => openDetails(d)}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        No doctors found. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Doctor Details"
        size="lg"
      >
        {selected && (
          <div className="space-y-6">
            {detailsLoading && (
              <p className="text-sm text-gray-500">Loading details...</p>
            )}
            {detailsError && !detailsLoading && (
              <div className="text-sm text-red-600">{detailsError}</div>
            )}
            {!detailsLoading && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <p className="text-sm text-gray-900 dark:text-white">{(details?.doctor?.name || selected.name) || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Specialist</label>
                    <p className="text-sm text-gray-900 dark:text-white">{(details?.doctor?.specialization || selected.specialization) || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Doctor ID</label>
                    <p className="text-sm text-gray-900 dark:text-white">{(details?.doctor?.licenseNumber || selected.licenseNumber) || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Address</label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">{selected.walletAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hospital</label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono">{details?.doctor?.hospitalAddress || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <p className="text-sm text-gray-900 dark:text-white">{details?.doctor?.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registered At</label>
                    <p className="text-sm text-gray-900 dark:text-white">{details?.doctor?.timestamp ? new Date(details.doctor.timestamp * 1000).toLocaleString() : '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Activity</label>
                    <p className="text-sm text-gray-900 dark:text-white">{details?.stats?.lastRecordAt ? new Date(details.stats.lastRecordAt * 1000).toLocaleString() : '—'}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="text-xs text-gray-500">Patients</div>
                      <div className="text-xl font-semibold">{details?.stats?.patientsCount ?? '0'}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="text-xs text-gray-500">Records Created</div>
                      <div className="text-xl font-semibold">{details?.stats?.recordsCount ?? '0'}</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                      <div className="text-xs text-gray-500">Prescriptions</div>
                      <div className="text-xl font-semibold">{details?.stats?.prescriptionsCount ?? '0'}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DoctorsList;
