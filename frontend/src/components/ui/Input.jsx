import React from 'react';

const Input = React.forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-brand-navy mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={props.id || props.name}
        className={`w-full px-4 py-2.5 rounded-xl border bg-white focus:outline-none focus:ring-2 transition-colors ${
          error 
            ? 'border-ui-error focus:border-ui-error focus:ring-ui-error/20' 
            : 'border-ui-border focus:border-brand-sky focus:ring-brand-sky/20'
        }`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-ui-error animate-fade-in">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
