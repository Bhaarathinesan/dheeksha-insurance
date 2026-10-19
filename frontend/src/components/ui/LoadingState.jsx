import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n';

const LoadingState = ({ message, fullScreen = false }) => {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white/90 dark:bg-brand-darkBg/90 z-50 flex flex-col items-center justify-center'
    : 'flex flex-col items-center justify-center p-12';

  return (
    <div className={containerClasses}>
      <Loader2 className="h-10 w-10 text-brand-strong dark:text-brand-sky animate-spin mb-4" />
      <p className="text-text-secondary dark:text-text-darkSecondary font-medium animate-pulse">{displayMessage}</p>
    </div>
  );
};

export default LoadingState;
