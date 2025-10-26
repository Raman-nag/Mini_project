import { useAuth as useAuthContext } from '../contexts/AuthContext';

/**
 * Custom hook for user authentication and authorization
 * Wraps the AuthContext for easier component usage
 * 
 * @returns {Object} Authentication state and functions
 */
export const useAuth = () => {
  const {
    // State
    isAuthenticated,
    isLoading,
    user,
    userRole,
    userProfile,
    token,
    error,
    
    // Computed
    isPatient,
    isDoctor,
    isHospital,
    displayName,
    avatar,
    
    // Functions
    login,
    logout,
    updateProfile,
    hasRole,
    checkAuth,
    clearError,
  } = useAuthContext();

  return {
    // State
    isAuthenticated,
    isLoading,
    user,
    userRole,
    userProfile,
    token,
    error,
    
    // Computed
    isPatient,
    isDoctor,
    isHospital,
    displayName,
    avatar,
    
    // Functions
    login,
    logout,
    updateProfile,
    hasRole,
    checkAuth,
    clearError,
  };
};

export default useAuth;
