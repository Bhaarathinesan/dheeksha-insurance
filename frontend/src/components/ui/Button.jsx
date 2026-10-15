import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5";
  
  const variants = {
    primary: "bg-brand-strong text-white hover:bg-brand-navy dark:hover:bg-brand-sky dark:hover:text-brand-navy hover:shadow-lg focus:ring-brand-strong",
    secondary: "bg-transparent text-brand-navy dark:text-text-darkPrimary border border-ui-border dark:border-brand-darkBorder hover:bg-brand-light dark:hover:bg-brand-darkElevated hover:border-brand-navy dark:hover:border-brand-sky focus:ring-brand-navy dark:focus:ring-brand-sky",
    outline: "border-2 border-brand-navy dark:border-brand-sky text-brand-navy dark:text-brand-sky hover:bg-brand-light dark:hover:bg-brand-darkElevated focus:ring-brand-navy dark:focus:ring-brand-sky",
    ghost: "text-text-secondary dark:text-text-darkSecondary hover:text-brand-navy dark:hover:text-text-darkPrimary hover:bg-brand-light dark:hover:bg-brand-darkElevated focus:ring-brand-light"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg"
  };

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[props.size] || sizes.md;

  return (
    <button 
      className={`${baseStyles} ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
