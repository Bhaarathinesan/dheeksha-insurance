import React from 'react';

const SectionHeading = ({ title, subtitle, centered = false, className = '' }) => {
  return (
    <div className={`mb-10 ${centered ? 'text-center' : ''} ${className}`}>
      {subtitle && (
        <span className="text-brand-strong dark:text-brand-sky font-semibold tracking-wider uppercase text-sm mb-2 block animate-fade-in">
          {subtitle}
        </span>
      )}
      <h2 className="text-h2 md:text-h1 text-brand-navy dark:text-text-darkPrimary font-bold leading-tight animate-slide-up">
        {title}
      </h2>
      <div className={`w-16 h-1 bg-brand-sky mt-4 rounded-full ${centered ? 'mx-auto' : ''}`}></div>
    </div>
  );
};

export default SectionHeading;
