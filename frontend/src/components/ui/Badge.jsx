import React from 'react';

const Badge = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: "bg-brand-light dark:bg-brand-darkElevated text-brand-strong dark:text-brand-sky",
    success: "bg-ui-success/10 text-ui-success dark:bg-emerald-500/20 dark:text-emerald-300",
    error: "bg-ui-error/10 text-ui-error dark:bg-red-500/20 dark:text-red-300",
    navy: "bg-brand-navy dark:bg-brand-darkElevated text-white dark:text-brand-sky border dark:border-brand-darkBorder",
  };

  const variantStyle = variants[variant] || variants.primary;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantStyle} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
