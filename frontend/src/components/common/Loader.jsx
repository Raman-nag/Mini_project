import React from 'react';
import { HeartIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const Loader = ({
  size = 'md',
  variant = 'default',
  text,
  className = '',
  ...props
}) => {
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // Medical-themed spinner variants
  const getSpinnerContent = () => {
    switch (variant) {
      case 'heartbeat':
        return (
          <div className="relative">
            <HeartIcon className={`${sizes[size]} text-red-500 animate-pulse`} />
            <div className="absolute inset-0 animate-ping">
              <HeartIcon className={`${sizes[size]} text-red-300`} />
            </div>
          </div>
        );
      case 'shield':
        return (
          <div className="relative">
            <ShieldCheckIcon className={`${sizes[size]} text-blue-500 animate-spin`} />
            <div className="absolute inset-0 animate-pulse">
              <ShieldCheckIcon className={`${sizes[size]} text-blue-300`} />
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="relative">
            <UserGroupIcon className={`${sizes[size]} text-green-500 animate-bounce`} />
            <div className="absolute inset-0 animate-ping">
              <UserGroupIcon className={`${sizes[size]} text-green-300`} />
            </div>
          </div>
        );
      case 'pulse':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizes[size]} bg-blue-500 rounded-full animate-pulse`}
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        );
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizes[size]} bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        );
      case 'medical':
        return (
          <div className="relative">
            <div className={`${sizes[size]} border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <HeartIcon className={`${sizes[size]} text-blue-500 animate-pulse`} style={{ fontSize: '0.5em' }} />
            </div>
          </div>
        );
      default:
        return (
          <div className={`${sizes[size]} border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin`} />
        );
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} {...props}>
      {getSpinnerContent()}
      {text && (
        <p className={`mt-2 text-gray-600 ${textSizes[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Full-screen loader
const FullScreenLoader = ({ 
  text = 'Loading...', 
  variant = 'medical',
  className = '',
  ...props 
}) => (
  <div className={`fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 ${className}`} {...props}>
    <div className="text-center">
      <Loader size="xl" variant={variant} />
      <p className="mt-4 text-lg font-medium text-gray-900">{text}</p>
    </div>
  </div>
);

// Inline loader
const InlineLoader = ({ 
  text, 
  variant = 'default',
  size = 'sm',
  className = '',
  ...props 
}) => (
  <div className={`inline-flex items-center space-x-2 ${className}`} {...props}>
    <Loader size={size} variant={variant} />
    {text && <span className="text-sm text-gray-600">{text}</span>}
  </div>
);

// Button loader
const ButtonLoader = ({ size = 'sm', className = '', ...props }) => (
  <div className={`inline-flex items-center ${className}`} {...props}>
    <div className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} border-2 border-white border-t-transparent rounded-full animate-spin`} />
  </div>
);

// Medical-themed loading states
const MedicalLoader = ({ 
  type = 'patient',
  text,
  size = 'md',
  className = '',
  ...props 
}) => {
  const medicalTypes = {
    patient: { variant: 'heartbeat', text: text || 'Processing patient data...' },
    doctor: { variant: 'shield', text: text || 'Verifying doctor credentials...' },
    hospital: { variant: 'users', text: text || 'Loading hospital data...' },
    records: { variant: 'medical', text: text || 'Securing medical records...' },
    blockchain: { variant: 'pulse', text: text || 'Connecting to blockchain...' }
  };

  const config = medicalTypes[type] || medicalTypes.patient;

  return (
    <Loader
      size={size}
      variant={config.variant}
      text={config.text}
      className={className}
      {...props}
    />
  );
};

// Export all components
Loader.FullScreen = FullScreenLoader;
Loader.Inline = InlineLoader;
Loader.Button = ButtonLoader;
Loader.Medical = MedicalLoader;

export default Loader;
