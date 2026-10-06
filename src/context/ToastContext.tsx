import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }: Omit<ToastMessage, 'id'>) => {
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newToast: ToastMessage = { id, title, message, type, duration };
      setToasts((prev) => [...prev.slice(-3), newToast]); // Keep maximum 4 concurrent toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-bottom-3 ${
                isSuccess
                  ? 'bg-[#142F29] border-[#274E45] text-[#F9F6EE]'
                  : isWarning
                  ? 'bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412]'
                  : isError
                  ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                  : 'bg-[#1B3E36] border-[#2E6F5E] text-[#F9F6EE]'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {isError && <XCircle className="w-5 h-5 text-rose-500" />}
                {!isSuccess && !isWarning && !isError && <Info className="w-5 h-5 text-[#E5A952]" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="text-xs font-bold leading-tight font-sans">
                  {toast.title}
                </div>
                {toast.message && (
                  <p className="text-[11px] opacity-90 mt-0.5 leading-snug font-sans">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
