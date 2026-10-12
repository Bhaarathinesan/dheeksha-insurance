import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = 'Loading...', fullScreen = false }) => {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center'
    : 'flex flex-col items-center justify-center p-12';

  return (
    <div className={containerClasses}>
      <Loader2 className="h-10 w-10 text-brand-strong animate-spin mb-4" />
      <p className="text-text-secondary font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingState;
