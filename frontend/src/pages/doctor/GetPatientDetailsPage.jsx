import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import GetPatientDetails from '../../components/doctor/GetPatientDetails';

const GetPatientDetailsPage = () => {
  return (
    <DashboardLayout userRole="doctor">
      <GetPatientDetails />
    </DashboardLayout>
  );
};

export default GetPatientDetailsPage;
