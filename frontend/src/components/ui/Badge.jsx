import React from 'react';

const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: "bg-brand-light text-brand-strong",
    success: "bg-ui-success bg-opacity-10 text-ui-success",
    error: "bg-ui-error bg-opacity-10 text-ui-error",
    navy: "bg-brand-navy text-white",
  };

  const variantStyle = variants[variant] || variants.primary;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyle} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
