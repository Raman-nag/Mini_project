import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Alert = ({
  type = 'info',
  title,
  message,
  children,
  dismissible = false,
  onDismiss,
  autoClose = false,
  autoCloseDelay = 5000,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  const variants = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: 'text-green-400',
      iconComponent: CheckCircleIcon,
      title: 'text-green-800',
      message: 'text-green-700'
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-400',
      iconComponent: XCircleIcon,
      title: 'text-red-800',
      message: 'text-red-700'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: 'text-yellow-400',
      iconComponent: ExclamationTriangleIcon,
      title: 'text-yellow-800',
      message: 'text-yellow-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-400',
      iconComponent: InformationCircleIcon,
      title: 'text-blue-800',
      message: 'text-blue-700'
    }
  };

  const variant = variants[type];
  const IconComponent = variant.iconComponent;

  return (
    <div
      className={`
        rounded-lg border p-4 transition-all duration-300
        ${variant.container}
        ${className}
      `}
      {...props}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${variant.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${variant.title}`}>
              {title}
            </h3>
          )}
          {message && (
            <div className={`mt-1 text-sm ${variant.message}`}>
              {message}
            </div>
          )}
          {children && (
            <div className={`mt-2 text-sm ${variant.message}`}>
              {children}
            </div>
          )}
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleDismiss}
                className={`
                  inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${variant.icon} hover:opacity-75
                `}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Medical-themed alerts
const MedicalAlert = ({
  type = 'patient',
  severity = 'info',
  title,
  message,
  className = '',
  ...props
}) => {
  const medicalTypes = {
    patient: {
      icon: '🩺',
      title: title || 'Patient Alert',
      color: 'from-green-50 to-emerald-50 border-green-200'
    },
    doctor: {
      icon: '👨‍⚕️',
      title: title || 'Doctor Notification',
      color: 'from-blue-50 to-indigo-50 border-blue-200'
    },
    hospital: {
      icon: '🏥',
      title: title || 'Hospital Alert',
      color: 'from-orange-50 to-amber-50 border-orange-200'
    },
    emergency: {
      icon: '🚨',
      title: title || 'Emergency Alert',
      color: 'from-red-50 to-pink-50 border-red-200'
    },
    prescription: {
      icon: '💊',
      title: title || 'Prescription Alert',
      color: 'from-yellow-50 to-orange-50 border-yellow-200'
    }
  };

  const config = medicalTypes[type] || medicalTypes.patient;

  return (
    <Alert
      type={severity}
      title={config.title}
      message={message}
      className={`bg-gradient-to-r ${config.color} ${className}`}
      {...props}
    >
      <div className="flex items-center">
        <span className="text-2xl mr-3">{config.icon}</span>
        <div>
          {message}
        </div>
      </div>
    </Alert>
  );
};

// Toast notification
const Toast = ({
  type = 'info',
  title,
  message,
  position = 'top-right',
  duration = 5000,
  className = '',
  ...props
}) => {
  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div
      className={`
        fixed z-50 max-w-sm w-full shadow-lg rounded-lg pointer-events-auto
        ${positions[position]}
        ${className}
      `}
      {...props}
    >
      <Alert
        type={type}
        title={title}
        message={message}
        dismissible
        autoClose
        autoCloseDelay={duration}
      />
    </div>
  );
};

// Alert group for multiple alerts
const AlertGroup = ({ children, className = '', ...props }) => (
  <div className={`space-y-2 ${className}`} {...props}>
    {children}
  </div>
);

// Export all components
Alert.Medical = MedicalAlert;
Alert.Toast = Toast;
Alert.Group = AlertGroup;

export default Alert;
