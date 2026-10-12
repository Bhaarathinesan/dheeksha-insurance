import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ 
  title = "No data found", 
  description = "There is currently no data to display in this section.", 
  actionLabel, 
  onAction,
  icon: Icon = PackageOpen,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center bg-brand-light rounded-3xl border border-ui-border ${className}`}>
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
        <Icon className="w-8 h-8 text-brand-strong" />
      </div>
      <h3 className="text-xl font-bold text-brand-navy mb-2">{title}</h3>
      <p className="text-text-secondary max-w-md mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
