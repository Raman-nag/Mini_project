import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Records from '../../components/doctor/Records';

const RecordsPage = () => {
  return (
    <DashboardLayout userRole="doctor">
      <Records />
    </DashboardLayout>
  );
};

export default RecordsPage;
