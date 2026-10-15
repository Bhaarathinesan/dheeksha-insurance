import React from 'react';

const Card = ({ children, className = '', hover = true, ...props }) => {
  return (
    <div 
      className={`bg-white dark:bg-brand-darkSurface rounded-[24px] p-6 md:p-8 border border-ui-border dark:border-brand-darkBorder shadow-sm transition-all duration-300 ${hover ? 'hover:shadow-md dark:hover:border-brand-sky/40' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
