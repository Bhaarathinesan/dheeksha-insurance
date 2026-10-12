import React from 'react';

const Card = ({ children, className = '', hover = true, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-[24px] p-6 border border-ui-border shadow-sm transition-all duration-300 ${hover ? 'hover:shadow-md' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
