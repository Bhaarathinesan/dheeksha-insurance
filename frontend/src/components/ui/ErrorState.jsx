import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';
import { useTranslation } from '../../i18n';

const ErrorState = ({ title, message, onRetry }) => {
  const { t } = useTranslation();

  const displayTitle = title || t('common.somethingWentWrong');

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-ui-error/5 dark:bg-red-950/20 rounded-3xl border border-ui-error/20 dark:border-red-900/40">
      <div className="w-16 h-16 bg-ui-error/10 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-ui-error dark:text-red-400">
        <AlertCircle size={32} />
      </div>
      <h3 className="text-xl font-bold text-brand-navy dark:text-text-darkPrimary mb-2">{displayTitle}</h3>
      {message && <p className="text-text-secondary dark:text-text-darkSecondary mb-6 max-w-md">{message}</p>}
      
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="border-ui-error text-ui-error hover:bg-ui-error hover:text-white dark:border-red-400 dark:text-red-400">
          {t('common.tryAgain')}
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
