import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Records from '../../components/doctor/Records';
import DoctorPrescriptions from '../../components/doctor/DoctorPrescriptions';

const RecordsPage = () => {
  const [activeTab, setActiveTab] = useState('records');

  return (
    <DashboardLayout userRole="doctor">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Records</h1>
          <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('records')}
              className={`px-3 py-1 rounded-full font-medium ${activeTab === 'records' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Medical Records
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prescriptions')}
              className={`px-3 py-1 rounded-full font-medium ${activeTab === 'prescriptions' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              Prescriptions
            </button>
          </div>
        </div>

        {activeTab === 'records' ? <Records /> : <DoctorPrescriptions />}
      </div>
    </DashboardLayout>
  );
};

export default RecordsPage;
