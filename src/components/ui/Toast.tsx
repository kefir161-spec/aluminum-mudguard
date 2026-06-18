import { Check, AlertTriangle, Info } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ToastContext, type ToastContextValue } from './useToast';

type ToastTone = 'success' | 'warning' | 'error' | 'neutral';

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

const icons: Record<ToastTone, ReactNode> = {
  success: <Check size={16} aria-hidden />,
  warning: <AlertTriangle size={16} aria-hidden />,
  error: <AlertTriangle size={16} aria-hidden />,
  neutral: <Info size={16} aria-hidden />,
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback<ToastContextValue['showToast']>((message, tone = 'neutral') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ui-toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`ui-toast ui-toast--${toast.tone}`} role="status">
            {icons[toast.tone]}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
