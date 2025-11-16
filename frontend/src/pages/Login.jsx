import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HeartIcon, 
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { connectWallet, ensureCorrectNetwork } from '../utils/web3';
import { ADMIN_ADDRESS } from '../config/contractConfig';

const Login = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState(null);
  const navigate = useNavigate();

  const roleOptions = [
    { value: 'patient', label: 'Patient', description: 'Patient dashboard' },
    { value: 'hospital', label: 'Hospital', description: 'Hospital admin dashboard (assigned by admin)' },
    { value: 'doctor', label: 'Doctor', description: 'Doctor dashboard (granted by hospital)' },
    { value: 'insurance', label: 'Insurance', description: 'Insurance admin (assigned by admin)' },
    { value: 'research', label: 'Research Institute', description: 'Research admin (assigned by admin)' },
  ];

  // Connect wallet first
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      setError('');

      await ensureCorrectNetwork();
      const { accounts } = await connectWallet();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet accounts found. Please connect MetaMask.');
      }

      setWalletAddress(accounts[0]);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet. Please make sure MetaMask is installed and unlocked.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Login after wallet is connected
  const handleLogin = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const roleForLogin = selectedRole === 'patient' ? null : selectedRole;
      const result = await login(roleForLogin);
      
      if (!result.success) {
        if (selectedRole === 'patient' && /not registered/i.test(result.error || '')) {
          navigate('/register');
          return;
        }
        throw new Error(result.error || 'Login failed');
      }
      
      // Navigation happens in AuthContext
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError(''); // Clear error when role changes
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
      
      <div className="relative max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <HeartIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Welcome Back
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Sign in with your wallet to access your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          {!walletAddress ? (
            <>
              {/* Wallet Connection Step */}
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <WalletIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Connect your MetaMask wallet to sign in to your account
                  </p>
                </div>
                
                {error && (
                  <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4">
                    <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isConnecting ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Connecting...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <WalletIcon className="w-5 h-5 mr-2" />
                      Connect MetaMask
                    </div>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Role Selection and Login */}
              <div className="space-y-6">
                {/* Connected Wallet Info */}
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary-700 dark:text-primary-300">Connected Wallet</p>
                      <p className="text-sm text-primary-600 dark:text-primary-400 font-mono">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </p>
                    </div>
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Select your login type
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {roleOptions.map((role) => (
                      <label
                        key={role.value}
                        className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          selectedRole === role.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={selectedRole === role.value}
                          onChange={() => handleRoleChange(role.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3 w-full">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedRole === role.value
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {selectedRole === role.value && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {role.label}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {role.description}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Admin login is restricted to the configured admin address. Users can self-register.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4">
                    <div className="flex items-center">
                      <div className="w-5 h-5 text-error-500 mr-3">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWalletAddress(null);
                      setSelectedRole(null);
                      setError('');
                    }}
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Change Wallet
                  </button>
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="flex-1 flex justify-center items-center px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Sign In
                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-300">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>

        {/* Security Features */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
            <ShieldCheckIcon className="w-4 h-4 mr-2 text-green-500" />
            Your Security is Our Priority
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-2" />
              Wallet-Based Auth
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-2" />
              HIPAA Compliant
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-2" />
              Blockchain Secured
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-2" />
              End-to-End Encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
