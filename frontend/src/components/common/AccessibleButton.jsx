import React from 'react';

/**
 * Accessible Button Component
 * 
 * Features:
 * - ARIA labels
 * - Keyboard navigation
 * - Focus states
 * - Screen reader support
 * - Loading states
 * 
 * @param {Object} props
 * @param {string} props.ariaLabel - ARIA label for screen readers
 * @param {boolean} props.isLoading - Show loading state
 * @param {boolean} props.disabled - Disable button
 * @param {string} props.variant - Button variant (primary, secondary, danger)
 * @param {string} props.size - Button size (sm, md, lg)
 */
const AccessibleButton = ({
  children,
  ariaLabel,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-slate-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    outline: 'border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const combinedClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      type={type}
      className={combinedClasses}
      aria-label={ariaLabel || (typeof children === 'string' ? children : 'Button')}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span aria-label="Loading">Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default AccessibleButton;
