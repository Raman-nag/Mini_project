import React from 'react';

const Card = ({
  children,
  variant = 'default',
  glassmorphism = false,
  hover = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'rounded-lg transition-all duration-300';
  
  const variants = {
    default: 'bg-white shadow-md border border-gray-200',
    elevated: 'bg-white shadow-lg border border-gray-200',
    outlined: 'bg-white border-2 border-gray-200 shadow-sm',
    filled: 'bg-gray-50 border border-gray-200',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-md'
  };

  const glassmorphismClasses = glassmorphism 
    ? 'bg-white/20 backdrop-blur-md border border-white/30 shadow-xl' 
    : '';

  const hoverClasses = hover 
    ? 'hover:shadow-xl hover:scale-105 cursor-pointer' 
    : '';

  const cardClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${glassmorphismClasses}
    ${hoverClasses}
    ${className}
  `.trim();

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-t border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

// Medical-themed card variants
const MedicalCard = ({ children, type = 'default', className = '', ...props }) => {
  const medicalVariants = {
    default: 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200',
    patient: 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200',
    doctor: 'bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200',
    hospital: 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200',
    emergency: 'bg-gradient-to-br from-red-50 to-pink-50 border border-red-200',
    prescription: 'bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200'
  };

  return (
    <Card
      className={`${medicalVariants[type]} ${className}`}
      {...props}
    >
      {children}
    </Card>
  );
};

// Export all components
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Medical = MedicalCard;

export default Card;
