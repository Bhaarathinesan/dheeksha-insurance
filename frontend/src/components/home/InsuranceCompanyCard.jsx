import React from 'react';
import InsuranceLogoPlaceholder from './InsuranceLogoPlaceholder';

// Sizing and balance rules tailored to each logo's canvas aspect ratio and internal padding
const LOGO_DISPLAY_CONFIG = {
  // Horizontal banners with large vertical whitespace in their original canvas
  'icici-lombard': {
    wrapperClass: 'w-full h-full flex items-center justify-center overflow-hidden p-1',
    imgClass: 'w-full h-full object-contain scale-[1.4] md:scale-[1.5] transition-transform duration-300 group-hover:scale-[1.55]',
  },
  'shriram-general': {
    wrapperClass: 'w-full h-full flex items-center justify-center overflow-hidden p-1',
    imgClass: 'w-full h-full object-contain scale-[1.4] md:scale-[1.5] transition-transform duration-300 group-hover:scale-[1.55]',
  },

  // Wide banner with top/bottom whitespace
  'united-india': {
    wrapperClass: 'w-full h-full flex items-center justify-center overflow-hidden px-1 py-2',
    imgClass: 'w-full h-full object-contain scale-[1.2] md:scale-[1.25] transition-transform duration-300 group-hover:scale-[1.3]',
  },

  // Circular emblem - sized to achieve visual balance with wide banners
  'oriental-insurance': {
    wrapperClass: 'w-full h-full flex items-center justify-center p-1',
    imgClass: 'h-full w-auto max-h-[90%] max-w-[90%] object-contain scale-[1.08] md:scale-[1.12] transition-transform duration-300 group-hover:scale-[1.16]',
  },

  // Square badge
  'tata-aig': {
    wrapperClass: 'w-full h-full flex items-center justify-center p-2',
    imgClass: 'h-full w-auto max-h-[82%] max-w-[82%] object-contain transition-transform duration-300 group-hover:scale-105',
  },

  // Ultra-wide horizontal logos
  'sbi-general': {
    wrapperClass: 'w-full h-full flex items-center justify-center px-2 py-1',
    imgClass: 'w-full h-full max-w-[94%] max-h-[66%] object-contain transition-transform duration-300 group-hover:scale-105',
  },
  'magma-hdi': {
    wrapperClass: 'w-full h-full flex items-center justify-center px-2 py-1',
    imgClass: 'w-full h-full max-w-[92%] max-h-[62%] object-contain transition-transform duration-300 group-hover:scale-105',
  },
  'cholamandalam-ms': {
    wrapperClass: 'w-full h-full flex items-center justify-center p-2',
    imgClass: 'w-full h-full max-h-[85%] max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105',
  },

  // Standard and compact aspect-ratio logos
  'iffco-tokio': {
    wrapperClass: 'w-full h-full flex items-center justify-center p-2',
    imgClass: 'w-full h-full max-w-[88%] max-h-[75%] object-contain transition-transform duration-300 group-hover:scale-105',
  },
  'national-insurance': {
    wrapperClass: 'w-full h-full flex items-center justify-center p-2',
    imgClass: 'w-full h-full max-w-[90%] max-h-[75%] object-contain transition-transform duration-300 group-hover:scale-105',
  },
  'royal-sundaram': {
    wrapperClass: 'w-full h-full flex items-center justify-center p-2',
    imgClass: 'w-full h-full max-w-[88%] max-h-[75%] object-contain transition-transform duration-300 group-hover:scale-105',
  },
  'star-health': {
    wrapperClass: 'w-full h-full flex items-center justify-center p-2',
    imgClass: 'w-full h-full max-w-[88%] max-h-[75%] object-contain transition-transform duration-300 group-hover:scale-105',
  },
  'universal-sompo': {
    wrapperClass: 'w-full h-full flex items-center justify-center p-2',
    imgClass: 'w-full h-full max-w-[88%] max-h-[72%] object-contain transition-transform duration-300 group-hover:scale-105',
  },
};

const DEFAULT_CONFIG = {
  wrapperClass: 'w-full h-full flex items-center justify-center p-2',
  imgClass: 'w-full h-full max-w-[90%] max-h-[75%] object-contain transition-transform duration-300 group-hover:scale-105',
};

const InsuranceCompanyCard = ({ company }) => {
  const config = LOGO_DISPLAY_CONFIG[company.id] || DEFAULT_CONFIG;

  return (
    <div 
      className="group bg-white rounded-[20px] p-3 md:p-5 border border-ui-border shadow-sm hover:shadow-md hover:-translate-y-1 hover:border-brand-sky/30 transition-all duration-300 flex items-center justify-center h-28 md:h-36 lg:h-40 overflow-hidden"
    >
      {company.logo ? (
        <div className={config.wrapperClass}>
          <img 
            src={company.logo} 
            alt={`${company.name} logo`} 
            className={config.imgClass}
            loading="lazy"
          />
        </div>
      ) : (
        <InsuranceLogoPlaceholder name={company.name} />
      )}
    </div>
  );
};

export default InsuranceCompanyCard;
