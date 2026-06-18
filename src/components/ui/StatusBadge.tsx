import { AlertTriangle, Check, Info } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'success' | 'warning' | 'error' | 'neutral';

type Props = {
  tone: Tone;
  children: ReactNode;
};

const icons: Record<Tone, ReactNode> = {
  success: <Check size={14} aria-hidden />,
  warning: <AlertTriangle size={14} aria-hidden />,
  error: <AlertTriangle size={14} aria-hidden />,
  neutral: <Info size={14} aria-hidden />,
};

export const StatusBadge = ({ tone, children }: Props) => (
  <span className={`ui-status-badge ui-status-badge--${tone}`}>
    {icons[tone]}
    {children}
  </span>
);
