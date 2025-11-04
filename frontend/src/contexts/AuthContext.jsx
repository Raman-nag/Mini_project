import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectWallet, getProvider, getSigner, ensureCorrectNetwork } from '../utils/web3';
import { getHospitalContract, getDoctorContract, getPatientContract } from '../utils/contract';
import patientService from '../services/patientService';
import hospitalService from '../services/hospitalService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  
  // User authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // User information
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  
  // Error handling
  const [error, setError] = useState(null);

  // Check for persisted authentication on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  // Check authentication state from localStorage and blockchain
  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      
      // Check localStorage for persisted wallet address
      const savedAddress = localStorage.getItem('wallet_address');
      const savedRole = localStorage.getItem('auth_role');
      
      if (savedAddress) {
        // Verify wallet is still connected
        try {
          await ensureCorrectNetwork();
          const { accounts } = await connectWallet();
          
          if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
            setWalletAddress(savedAddress);
            
            // Check role on blockchain
            const detectedRole = await detectUserRole(savedAddress);
            if (detectedRole) {
              setUserRole(detectedRole);
              setIsAuthenticated(true);
              await loadUserProfile(savedAddress, detectedRole);
            } else if (savedRole) {
              // Fallback to saved role if blockchain check fails
              setUserRole(savedRole);
              setIsAuthenticated(true);
            }
          }
        } catch (err) {
          console.warn('Wallet connection failed:', err);
          // Clear invalid state
          clearAuthState();
        }
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
      setError('Failed to restore authentication state');
    } finally {
      setIsLoading(false);
    }
  };

  // Detect user role from blockchain
  const detectUserRole = async (address) => {
    try {
      // Check if user is a registered hospital
      try {
        const hospitalContract = await getHospitalContract();
        const hospital = await hospitalContract.hospitals(address);
        if (hospital && hospital.isActive) {
          return 'hospital';
        }
      } catch (e) {
        // Not a hospital, continue checking
      }

      // Check if user is a registered doctor
      try {
        const doctorContract = await getDoctorContract();
        const doctor = await doctorContract.doctors(address);
        if (doctor && doctor.isActive) {
          return 'doctor';
        }
      } catch (e) {
        // Not a doctor, continue checking
      }

      // Check if user is a registered patient
      try {
        const patientContract = await getPatientContract();
        const isRegistered = await patientContract.registeredPatients(address);
        if (isRegistered) {
          const patient = await patientContract.patients(address);
          if (patient && patient.isActive) {
            return 'patient';
          }
        }
      } catch (e) {
        // Not a patient
      }

      return null;
    } catch (error) {
      console.error('Error detecting user role:', error);
      return null;
    }
  };

  // Load user profile from blockchain
  const loadUserProfile = async (address, role) => {
    try {
      if (role === 'patient') {
        const profile = await patientService.getMyProfile(address);
        setUserProfile(profile.profile);
        setUser({
          walletAddress: address,
          role: 'patient',
          ...profile.profile
        });
      } else if (role === 'doctor') {
        const doctorContract = await getDoctorContract();
        const doctor = await doctorContract.doctors(address);
        setUserProfile({
          walletAddress: address,
          name: doctor.name || '',
          specialization: doctor.specialization || '',
          licenseNumber: doctor.licenseNumber || '',
          hospitalAddress: doctor.hospitalAddress || '',
          isActive: doctor.isActive
        });
        setUser({
          walletAddress: address,
          role: 'doctor',
          name: doctor.name || '',
          specialization: doctor.specialization || ''
        });
      } else if (role === 'hospital') {
        const hospital = await hospitalService.getHospitalDetails();
        setUserProfile(hospital.hospital);
        setUser({
          walletAddress: address,
          role: 'hospital',
          ...hospital.hospital
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Login function - connects wallet and detects role
  const login = async (role = null) => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure correct network
      await ensureCorrectNetwork();

      // Connect wallet
      const { accounts } = await connectWallet();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet accounts found. Please connect MetaMask.');
      }

      const address = accounts[0];
      setWalletAddress(address);

      // Detect role from blockchain
      const detectedRole = await detectUserRole(address);
      
      if (!detectedRole) {
        throw new Error('Wallet address not registered. Please register first.');
      }

      // If role was specified, verify it matches
      if (role && detectedRole !== role) {
        throw new Error(`This wallet is registered as ${detectedRole}, not ${role}.`);
      }

      setUserRole(detectedRole);
      setIsAuthenticated(true);
      await loadUserProfile(address, detectedRole);

      // Persist to localStorage
      localStorage.setItem('wallet_address', address);
      localStorage.setItem('auth_role', detectedRole);

      console.log('Logged in as:', address, detectedRole);

      // Navigate to appropriate dashboard
      navigate(`/${detectedRole}/dashboard`);

      return { success: true, role: detectedRole };
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function - registers user on blockchain
  const register = async (role, registrationData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure correct network
      await ensureCorrectNetwork();

      // Connect wallet
      const { accounts } = await connectWallet();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet accounts found. Please connect MetaMask.');
      }

      const address = accounts[0];
      setWalletAddress(address);

      // Check if already registered
      const existingRole = await detectUserRole(address);
      if (existingRole) {
        throw new Error(`Wallet is already registered as ${existingRole}. Please login instead.`);
      }

      // Register based on role
      if (role === 'patient') {
        const { name, dateOfBirth, bloodGroup } = registrationData;
        await patientService.registerPatient(name, dateOfBirth, bloodGroup);
      } else if (role === 'hospital') {
        const { name, registrationNumber } = registrationData;
        await hospitalService.registerHospital(name, registrationNumber);
      } else if (role === 'doctor') {
        // Doctors must be added by hospital first
        throw new Error('Doctors must be registered by a hospital administrator. Please contact your hospital.');
      } else {
        throw new Error('Invalid role');
      }

      // Set role and authenticate
      setUserRole(role);
      setIsAuthenticated(true);
      await loadUserProfile(address, role);

      // Persist to localStorage
      localStorage.setItem('wallet_address', address);
      localStorage.setItem('auth_role', role);

      console.log('Registered and logged in as:', address, role);

      // Navigate to appropriate dashboard
      navigate(`/${role}/dashboard`);

      return { success: true, role };
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    try {
      // Clear authentication state
      setIsAuthenticated(false);
      setUser(null);
      setUserRole(null);
      setUserProfile(null);
      setWalletAddress(null);
      setError(null);

      // Clear localStorage
      clearAuthState();

      console.log('Logged out');

      // Navigate to login page
      navigate('/login');

    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
    }
  };

  // Clear auth state
  const clearAuthState = () => {
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      if (userRole === 'doctor') {
        const doctorService = (await import('../services/doctorService')).default;
        await doctorService.updateProfile(profileData.name, profileData.specialization);
      }
      
      // Reload profile
      await loadUserProfile(walletAddress, userRole);
      
      console.log('Profile updated:', profileData);
      return { success: true };
      
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
      return { success: false, error: err.message };
    }
  };

  // Check if user has specific role
  const hasRole = (roles) => {
    if (!Array.isArray(roles)) {
      roles = [roles];
    }
    return roles.includes(userRole);
  };

  // Check if user is authenticated
  const checkAuth = () => {
    return isAuthenticated && walletAddress !== null;
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!userProfile) return walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null;
    
    if (userRole === 'patient') {
      return userProfile.name || `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`;
    } else if (userRole === 'doctor') {
      return userProfile.name ? `Dr. ${userProfile.name}` : `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`;
    } else if (userRole === 'hospital') {
      return userProfile.name || `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`;
    }
    return walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'User';
  };

  // Get user avatar (placeholder)
  const getUserAvatar = () => {
    return null;
  };

  const value = {
    // State
    isAuthenticated,
    isLoading,
    user,
    userRole,
    userProfile,
    walletAddress,
    error,
    
    // Computed
    isPatient: userRole === 'patient',
    isDoctor: userRole === 'doctor',
    isHospital: userRole === 'hospital',
    displayName: getUserDisplayName(),
    avatar: getUserAvatar(),
    
    // Functions
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    checkAuth,
    clearError,
    detectUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
