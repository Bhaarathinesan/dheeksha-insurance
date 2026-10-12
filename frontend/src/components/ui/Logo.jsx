import React from 'react';
import logoImage from '../../assets/logo/dheeksha-logo-transparent.png';

export const Logo = ({ className = '' }) => (
  <div className={`flex items-center w-[140px] md:w-[180px] ${className}`}>
    <img 
      src={logoImage} 
      alt="Dheeksha Insurance Logo" 
      className="w-full h-auto max-h-[60px] object-contain"
    />
  </div>
);
