import React, { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const showSuccess = (message, options = {}) => {
    return toast.success(message, {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
      ...options,
    });
  };

  const showError = (message, options = {}) => {
    return toast.error(message, {
      duration: options.duration || 5000,
      position: options.position || 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
      ...options,
    });
  };

  const showInfo = (message, options = {}) => {
    return toast(message, {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      icon: 'ℹ️',
      ...options,
    });
  };

  const showWarning = (message, options = {}) => {
    return toast(message, {
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      style: {
        background: '#f59e0b',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      icon: '⚠️',
      ...options,
    });
  };

  const showLoading = (message, options = {}) => {
    return toast.loading(message, {
      position: options.position || 'top-right',
      ...options,
    });
  };

  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  const promise = (promise, messages, options = {}) => {
    return toast.promise(promise, messages, {
      position: options.position || 'top-right',
      ...options,
    });
  };

  const value = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismiss,
    promise,
    toast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          className: '',
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1e293b',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ToastContext.Provider>
  );
};
