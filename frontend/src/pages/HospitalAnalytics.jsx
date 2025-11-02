import React from 'react';
import Card from '../components/common/Card';

const HospitalAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Hospital Analytics</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">Placeholder analytics dashboard. Integrate charts and metrics here (e.g. patient growth, record creation rate, doctor activity).</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <Card.Content>
                <h3 className="text-sm font-medium text-gray-500">Patients Growth</h3>
                <p className="mt-2 text-2xl font-semibold">+12% <span className="text-sm text-gray-400">(30d)</span></p>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content>
                <h3 className="text-sm font-medium text-gray-500">Records Created</h3>
                <p className="mt-2 text-2xl font-semibold">1,234 <span className="text-sm text-gray-400">(week)</span></p>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content>
                <h3 className="text-sm font-medium text-gray-500">Active Doctors</h3>
                <p className="mt-2 text-2xl font-semibold">24</p>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalAnalytics;
