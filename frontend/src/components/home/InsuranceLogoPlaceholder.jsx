import React from 'react';
import { Shield } from 'lucide-react';

const InsuranceLogoPlaceholder = ({ name }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center text-center w-full h-full"
      aria-label={`${name} logo placeholder`}
    >
      {/* Neutral placeholder icon */}
      <Shield className="w-8 h-8 md:w-10 md:h-10 text-brand-sky/60 mb-2" />
      {/* Company name */}
      <span className="text-brand-navy font-semibold text-xs md:text-sm leading-tight line-clamp-2 px-2">
        {name}
      </span>
    </div>
  );
};

export default InsuranceLogoPlaceholder;
