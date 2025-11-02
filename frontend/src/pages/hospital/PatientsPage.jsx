import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PatientList from '../../components/hospital/PatientList';

const PatientsPage = () => {
  return (
    <DashboardLayout userRole="hospital">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Patient Management</h1>
        <PatientList />
      </div>
    </DashboardLayout>
  );
};

export default PatientsPage;