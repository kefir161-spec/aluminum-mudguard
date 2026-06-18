import { createContext, useContext } from 'react';

type ToastTone = 'success' | 'warning' | 'error' | 'neutral';

export type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
