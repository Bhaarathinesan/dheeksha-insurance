import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-brand-light border-ui-border text-brand-navy',
  };

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    info: <Info className="text-brand-strong" size={20} />,
  };

  return (
    <div className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 flex items-center p-4 rounded-lg border shadow-lg min-w-[300px] animate-slide-up z-50 ${styles[type]}`}>
      <div className="flex-shrink-0 mr-3">
        {icons[type]}
      </div>
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button 
        onClick={onClose}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
