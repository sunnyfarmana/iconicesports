import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = 4000;
    const item: ToastItem = { id, type, title, message, duration };

    setToasts((prev) => [...prev, item]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const toastMethods = {
    success: (message: string, title?: string) => addToast('success', message, title || 'Success'),
    error: (message: string, title?: string) => addToast('error', message, title || 'Attention Required'),
    warning: (message: string, title?: string) => addToast('warning', message, title || 'Notice'),
    info: (message: string, title?: string) => addToast('info', message, title || 'Information')
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/50';
      case 'error':
        return 'border-red-500/50';
      case 'warning':
        return 'border-amber-500/50';
      case 'info':
        return 'border-blue-500/50';
    }
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}

      {/* Toast Notification Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[100] flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto bg-bgmi-surface/95 backdrop-blur-md border ${getBorderColor(
              t.type
            )} rounded-xl p-4 shadow-tactical flex items-start space-x-3 transition-all duration-200 animate-slideUp`}
          >
            {getToastIcon(t.type)}
            <div className="flex-1 min-w-0">
              {t.title && (
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                  {t.title}
                </h4>
              )}
              <p className="text-xs text-slate-300 font-sans mt-0.5 leading-relaxed break-words">
                {t.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors flex-shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
