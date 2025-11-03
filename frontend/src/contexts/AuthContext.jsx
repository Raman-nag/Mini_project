import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockUsers } from '../data/mockData';
import { getHospitalContract, getDoctorContract, getPatientContract } from '../utils/contract';

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
  const [token, setToken] = useState(null);
  
  // Error handling
  const [error, setError] = useState(null);

  // Check for persisted authentication on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  // Check authentication state from localStorage
  const checkAuthState = () => {
    try {
      setIsLoading(true);
      
      // Check localStorage for persisted auth state
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');
      const savedRole = localStorage.getItem('auth_role');
      
      if (savedToken && savedUser && savedRole) {
        // Restore user session
        setUser(JSON.parse(savedUser));
        setUserRole(savedRole);
        setToken(savedToken);
        setIsAuthenticated(true);
        
        // Load user profile based on role
        loadUserProfile(savedRole);
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
      setError('Failed to restore authentication state');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user profile based on role
  const loadUserProfile = (role) => {
    // Fallback to mock profile for UI continuity
    const profile = mockUsers[role];
    setUserProfile(profile);
  };

  // Login function
  const login = async (email, password, role) => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // Mock authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate authentication check (frontend-only auth)
      const userData = mockUsers[role];
      
      if (!userData || userData.email !== email) {
        throw new Error('Invalid credentials');
      }

      // Generate mock token
      const authToken = `mock_token_${Date.now()}`;

      // Set authentication state
      setUser({
        email,
        role,
        ...userData,
      });
      setUserRole(role);
      setUserProfile(userData);
      setToken(authToken);
      setIsAuthenticated(true);

      // Persist to localStorage
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('auth_user', JSON.stringify({ email, role, ...userData }));
      localStorage.setItem('auth_role', role);

      console.log('Logged in as:', email, role);

      // Navigate to appropriate dashboard
      navigate(`/${role}/dashboard`);

      return { success: true };
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: verify role on-chain (non-blocking)
  useEffect(() => {
    const verifyRole = async () => {
      try {
        if (!user?.walletAddress && !user?.address) return;
        const addr = user.walletAddress || user.address;
        // Example role checks; adjust to your contract APIs
        if (userRole === 'hospital') {
          const c = await getHospitalContract();
          await c.getHospitalDoctors(); // probe call
        } else if (userRole === 'doctor') {
          const c = await getDoctorContract();
          // e.g., await c.isRegistered(addr)
        } else if (userRole === 'patient') {
          const c = await getPatientContract();
          // e.g., await c.isRegistered(addr)
        }
      } catch (e) {
        // Keep UI usable; log for debugging
        console.warn('Role verification failed (non-blocking):', e?.message || e);
      }
    };
    verifyRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, user?.walletAddress, user?.address]);

  // Logout function
  const logout = () => {
    try {
      // Clear authentication state
      setIsAuthenticated(false);
      setUser(null);
      setUserRole(null);
      setUserProfile(null);
      setToken(null);
      setError(null);

      // Clear localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_role');

      console.log('Logged out');

      // Navigate to login page
      navigate('/login');

    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
    }
  };

  // Update user profile
  const updateProfile = (profileData) => {
    try {
      // TODO: Replace with actual API call
      setUserProfile(prev => ({ ...prev, ...profileData }));
      
      // Update localStorage
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      
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
    return isAuthenticated && token !== null;
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!userProfile) return null;
    
    if (userRole === 'patient') {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    } else if (userRole === 'doctor') {
      return `Dr. ${userProfile.firstName} ${userProfile.lastName}`;
    } else if (userRole === 'hospital') {
      return userProfile.name;
    }
    return user?.email || 'User';
  };

  // Get user avatar (placeholder)
  const getUserAvatar = () => {
    // TODO: Replace with actual avatar URL from user profile
    return null;
  };

  const value = {
    // State
    isAuthenticated,
    isLoading,
    user,
    userRole,
    userProfile,
    token,
    error,
    
    // Computed
    isPatient: userRole === 'patient',
    isDoctor: userRole === 'doctor',
    isHospital: userRole === 'hospital',
    displayName: getUserDisplayName(),
    avatar: getUserAvatar(),
    
    // Functions
    login,
    logout,
    updateProfile,
    hasRole,
    checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
