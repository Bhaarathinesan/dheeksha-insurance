import React from 'react';
import { AlertCircle } from 'lucide-react';
import Button from './Button';

const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-ui-error bg-opacity-5 rounded-3xl border border-ui-error border-opacity-20">
      <div className="w-16 h-16 bg-ui-error bg-opacity-10 rounded-full flex items-center justify-center mb-4 text-ui-error">
        <AlertCircle size={32} />
      </div>
      <h3 className="text-xl font-bold text-brand-navy mb-2">{title}</h3>
      {message && <p className="text-text-secondary mb-6 max-w-md">{message}</p>}
      
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="border-ui-error text-ui-error hover:bg-ui-error hover:text-white">
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
