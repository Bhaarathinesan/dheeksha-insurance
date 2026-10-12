import React from 'react';

const ImageCard = ({ imageSrc, title, description, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-3xl overflow-hidden border border-ui-border shadow-sm transition-all duration-400 hover:shadow-xl hover:-translate-y-1 group ${className}`}>
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
          <div className="w-full h-full bg-brand-light flex items-center justify-center">
            <span className="text-brand-strong opacity-50">No Image</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-brand-navy mb-2">{title}</h3>
        {description && <p className="text-text-secondary mb-4">{description}</p>}
        {children}
      </div>
    </div>
  );
};

export default ImageCard;
