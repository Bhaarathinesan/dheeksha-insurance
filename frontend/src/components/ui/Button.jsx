import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5";
  
  const variants = {
    primary: "bg-brand-strong text-white hover:bg-brand-navy hover:shadow-lg focus:ring-brand-strong",
    secondary: "bg-transparent text-brand-navy border border-ui-border hover:bg-brand-light hover:border-brand-navy focus:ring-brand-navy",
    outline: "border-2 border-brand-navy text-brand-navy hover:bg-brand-light hover:text-brand-navy focus:ring-brand-navy",
    ghost: "text-text-secondary hover:text-brand-navy hover:bg-brand-light focus:ring-brand-light"
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
