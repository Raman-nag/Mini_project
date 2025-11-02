import React from 'react';
import { useNavigate } from 'react-router-dom';
import AddDoctor from '../../components/hospital/AddDoctor';

const AddDoctorPage = () => {
  const navigate = useNavigate();

  const handleDoctorAdded = (doctorData) => {
    // For now, log and redirect back to doctors list. In future, integrate with backend or context/state.
    console.log('Doctor added:', doctorData);
    // You may want to persist to local state or call an API here.
    navigate('/hospital/doctors');
  };

  const handleCancel = () => {
    navigate('/hospital/doctors');
  };

  return (
    <div className="space-y-6">
      <AddDoctor onDoctorAdded={handleDoctorAdded} onCancel={handleCancel} />
    </div>
  );
};

export default AddDoctorPage;
