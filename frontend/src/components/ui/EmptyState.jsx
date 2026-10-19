import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';
import { useTranslation } from '../../i18n';

const EmptyState = ({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  icon: Icon = PackageOpen,
  className = '' 
}) => {
  const { t } = useTranslation();

  const displayTitle = title || t('common.noDataFound');
  const displayDesc = description || t('common.noDataDesc');

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center bg-brand-light dark:bg-brand-darkElevated rounded-3xl border border-ui-border dark:border-brand-darkBorder ${className}`}>
      <div className="w-16 h-16 bg-white dark:bg-brand-darkSurface rounded-full flex items-center justify-center shadow-sm mb-4">
        <Icon className="w-8 h-8 text-brand-strong dark:text-brand-sky" />
      </div>
      <h3 className="text-xl font-bold text-brand-navy dark:text-text-darkPrimary mb-2">{displayTitle}</h3>
      <p className="text-text-secondary dark:text-text-darkSecondary max-w-md mb-6">{displayDesc}</p>
      
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
