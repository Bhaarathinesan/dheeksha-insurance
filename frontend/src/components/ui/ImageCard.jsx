import React from 'react';

const ImageCard = ({ imageSrc, title, description, children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-brand-darkSurface rounded-3xl overflow-hidden border border-ui-border dark:border-brand-darkBorder shadow-sm transition-all duration-400 hover:shadow-xl dark:hover:border-brand-sky/40 hover:-translate-y-1 group ${className}`}>
      <div className="relative h-56 w-full overflow-hidden">
        {/* Placeholder if no image provided */}
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt={title} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-brand-light dark:bg-brand-darkElevated flex items-center justify-center">
            <span className="text-brand-strong dark:text-brand-sky opacity-50">No Image</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-brand-navy dark:text-text-darkPrimary mb-2">{title}</h3>
        {description && <p className="text-text-secondary dark:text-text-darkSecondary leading-relaxed mb-4">{description}</p>}
        {children}
      </div>
    </div>
  );
};

export default ImageCard;
