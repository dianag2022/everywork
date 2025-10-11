import { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'error', onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slideIn">
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-md flex items-start gap-3">
        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
        <p className="text-red-800 flex-1 text-sm font-medium">{message}</p>
        <button onClick={onClose} className="text-red-500 hover:opacity-70">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}