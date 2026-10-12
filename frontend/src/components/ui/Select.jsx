import React from 'react';
import { ChevronDown } from 'lucide-react';

const Select = React.forwardRef(({ label, error, options = [], className = '', ...props }, ref) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-brand-navy mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={props.id || props.name}
          className={`w-full px-4 py-2.5 rounded-xl border bg-white appearance-none focus:outline-none focus:ring-2 transition-colors ${
            error 
              ? 'border-ui-error focus:border-ui-error focus:ring-ui-error/20' 
              : 'border-ui-border focus:border-brand-sky focus:ring-brand-sky/20'
          }`}
          {...props}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value} disabled={opt.disabled} hidden={opt.hidden}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-ui-error animate-fade-in">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
