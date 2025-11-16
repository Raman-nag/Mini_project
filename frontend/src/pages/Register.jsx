import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HeartIcon, 
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { connectWallet, ensureCorrectNetwork } from '../utils/web3';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    role: 'patient',
    // Patient fields
    name: '',
    dateOfBirth: '',
    bloodGroup: '',
    // Hospital fields
    organization: '',
    registrationNumber: '',
    // Doctor fields (not used in registration - doctors are added by hospitals)
    licenseNumber: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const roleOptions = [
    { 
      value: 'patient', 
      label: 'Patient', 
      description: 'Access and manage your medical records',
      icon: UserIcon,
    }
  ];

  const currentRole = roleOptions.find(role => role.value === formData.role);

  // Connect wallet
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      setErrors({});
      
      await ensureCorrectNetwork();
      const { accounts } = await connectWallet();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet accounts found. Please connect MetaMask.');
      }

      setWalletAddress(accounts[0]);
      setCurrentStep(2);
    } catch (err) {
      setErrors({ 
        wallet: err.message || 'Failed to connect wallet. Please make sure MetaMask is installed and unlocked.' 
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!walletAddress) {
      newErrors.wallet = 'Please connect your wallet first';
      return false;
    }

    // Role-specific validations
    if (formData.role === 'patient') {
      if (!formData.name || formData.name.trim().length === 0) {
        newErrors.name = 'Name is required';
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      }
      if (!formData.bloodGroup || formData.bloodGroup.trim().length === 0) {
        newErrors.bloodGroup = 'Blood group is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      let registrationData = {};
      
      if (formData.role === 'patient') {
        registrationData = {
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          bloodGroup: formData.bloodGroup
        };
      } else if (formData.role === 'hospital') {
        registrationData = {
          name: formData.organization,
          registrationNumber: formData.registrationNumber
        };
      }

      const result = await register(formData.role, registrationData);
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }
      
    } catch (err) {
      setErrors({ 
        general: err.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.role) {
        setErrors({ role: 'Please select a role' });
        return;
      }
      
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
      
      <div className="relative max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
              <HeartIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Join Multimedia EHR
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Create your secure healthcare account with blockchain
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              1
            </div>
            <div className={`w-16 h-1 rounded-full ${
              currentStep >= 2 ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              2
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {currentStep === 1 ? 'Select Role' : walletAddress ? 'Complete Registration' : 'Connect Wallet'}
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <>
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                    I am a...
                  </label>
                  <div className="grid grid-cols-1 gap-4">
                    {roleOptions.map((role) => (
                      <label
                        key={role.value}
                        className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          role.disabled
                            ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-600'
                            : formData.role === role.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={role.value}
                          checked={formData.role === role.value}
                          onChange={handleInputChange}
                          disabled={role.disabled}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-4 w-full">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            formData.role === role.value
                              ? 'bg-primary-100 dark:bg-primary-900/30'
                              : 'bg-slate-100 dark:bg-slate-700'
                          }`}>
                            <role.icon className={`w-6 h-6 ${
                              formData.role === role.value
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }`} />
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
                  {errors.role && <p className="mt-2 text-sm text-error-600 dark:text-error-400">{errors.role}</p>}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={formData.role === 'doctor'}
                  className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Continue
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
              </>
            )}

            {currentStep === 2 && !walletAddress && (
              <>
                {/* Wallet Connection */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <WalletIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Connect Your Wallet
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Connect your MetaMask wallet to register on the blockchain
                  </p>
                  {errors.wallet && (
                    <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4">
                      <p className="text-sm text-error-700 dark:text-error-300">{errors.wallet}</p>
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
                  <button
                    type="button"
                    onClick={prevStep}
                    className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {currentStep === 2 && walletAddress && (
              <>
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

                {/* Role-specific registration fields */}
                {formData.role === 'patient' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Enter your full name"
                      />
                      {errors.name && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                      {errors.dateOfBirth && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.dateOfBirth}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Blood Group
                      </label>
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      >
                        <option value="">Select blood group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                      {errors.bloodGroup && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.bloodGroup}</p>}
                    </div>
                  </>
                )}

                {formData.role === 'hospital' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Hospital Name
                      </label>
                      <input
                        type="text"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Enter hospital name"
                      />
                      {errors.organization && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.organization}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Enter registration number"
                      />
                      {errors.registrationNumber && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.registrationNumber}</p>}
                    </div>
                  </>
                )}

                {/* General Error */}
                {errors.general && (
                  <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-4">
                    <p className="text-sm text-error-700 dark:text-error-300">{errors.general}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex justify-center items-center px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Registering...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Register on Blockchain
                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                      </div>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-slate-600 dark:text-slate-300">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Security Features */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mt-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
            <ShieldCheckIcon className="w-4 h-4 mr-2 text-green-500" />
            Your Data is Protected
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-2" />
              Blockchain Encrypted
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-2" />
              HIPAA Compliant
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-2" />
              IPFS Storage
            </div>
            <div className="flex items-center">
              <CheckCircleIcon className="w-3 h-3 text-green-500 mr-2" />
              Wallet-Based Auth
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
