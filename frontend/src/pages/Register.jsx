import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  HeartIcon, 
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    phone: '',
    organization: '',
    licenseNumber: '',
    terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const roleOptions = [
    { 
      value: 'patient', 
      label: 'Patient', 
      description: 'Access and manage your medical records',
      icon: UserIcon,
      fields: ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone']
    },
    { 
      value: 'doctor', 
      label: 'Doctor', 
      description: 'Manage patient records and prescriptions',
      icon: UserGroupIcon,
      fields: ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phone', 'licenseNumber']
    },
    { 
      value: 'hospital', 
      label: 'Hospital', 
      description: 'Administrative dashboard and staff management',
      icon: BuildingOfficeIcon,
      fields: ['organization', 'email', 'password', 'confirmPassword', 'phone', 'licenseNumber']
    }
  ];

  const currentRole = roleOptions.find(role => role.value === formData.role);

  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.terms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    // Role-specific validations
    if (currentRole.fields.includes('firstName') && !formData.firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (currentRole.fields.includes('lastName') && !formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    if (currentRole.fields.includes('organization') && !formData.organization) {
      newErrors.organization = 'Organization name is required';
    }

    if (currentRole.fields.includes('phone') && !formData.phone) {
      newErrors.phone = 'Phone number is required';
    }

    if (currentRole.fields.includes('licenseNumber') && !formData.licenseNumber) {
      newErrors.licenseNumber = 'License number is required';
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

    try {
      // TODO: Replace with actual blockchain registration
      // This is mock registration for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // TODO: Create blockchain wallet and store user data
      const userData = {
        id: `${formData.role}_${Date.now()}`,
        ...formData,
        // TODO: Generate blockchain wallet address
        walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        // TODO: Store user data hash on IPFS
        ipfsHash: `QmHash${Math.random().toString(16).substr(2, 8)}...`,
        registeredAt: new Date().toISOString()
      };

      // TODO: Store authentication token and user data
      localStorage.setItem('userRole', formData.role);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Navigate to appropriate dashboard
      navigate(`/${formData.role}/dashboard`);
    } catch (err) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
      // Validate role selection and basic info
      const step1Errors = {};
      if (!formData.role) step1Errors.role = 'Please select a role';
      if (currentRole.fields.includes('firstName') && !formData.firstName) step1Errors.firstName = 'First name is required';
      if (currentRole.fields.includes('lastName') && !formData.lastName) step1Errors.lastName = 'Last name is required';
      if (currentRole.fields.includes('organization') && !formData.organization) step1Errors.organization = 'Organization name is required';
      
      if (Object.keys(step1Errors).length === 0) {
        setCurrentStep(2);
      } else {
        setErrors(step1Errors);
      }
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
            Create your secure healthcare account
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
              {currentStep === 1 ? 'Account Type & Basic Info' : 'Security & Verification'}
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
                          formData.role === role.value
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
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-4">
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
                          <div>
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

                {/* Dynamic Fields Based on Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentRole.fields.includes('firstName') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.firstName}</p>}
                    </div>
                  )}

                  {currentRole.fields.includes('lastName') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.lastName}</p>}
                    </div>
                  )}

                  {currentRole.fields.includes('organization') && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        name="organization"
                        value={formData.organization}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Enter your organization name"
                      />
                      {errors.organization && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.organization}</p>}
                    </div>
                  )}
                </div>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Continue
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
              </>
            )}

            {currentStep === 2 && (
              <>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.email}</p>}
                </div>

                {/* Phone */}
                {currentRole.fields.includes('phone') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.phone}</p>}
                  </div>
                )}

                {/* License Number */}
                {currentRole.fields.includes('licenseNumber') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter your license number"
                    />
                    {errors.licenseNumber && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.licenseNumber}</p>}
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.confirmPassword}</p>}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-primary-500 focus:ring-2 mt-1"
                  />
                  <label className="ml-3 text-sm text-slate-600 dark:text-slate-300">
                    I agree to the{' '}
                    <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.terms && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.terms}</p>}

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
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Create Account
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
              Zero-Knowledge Proof
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;