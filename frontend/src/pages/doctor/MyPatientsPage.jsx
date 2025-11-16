import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import MyPatients from '../../components/doctor/MyPatients';
import { getProvider } from '../../utils/web3';

const MyPatientsPage = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [networkStatus, setNetworkStatus] = useState('connecting');

  useEffect(() => {
    const load = async () => {
      try {
        const provider = getProvider();
        const signer = await provider?.getSigner?.();
        const addr = await signer?.getAddress?.();
        if (addr) {
          setWalletAddress(addr);
          setNetworkStatus('connected');
        } else {
          setNetworkStatus('disconnected');
        }
      } catch {
        setNetworkStatus('disconnected');
      }
    };
    load();
  }, []);

  return (
    <DashboardLayout userRole="doctor" userProfile={{}} walletAddress={walletAddress} networkStatus={networkStatus}>
      <MyPatients />
    </DashboardLayout>
  );
};

export default MyPatientsPage;
