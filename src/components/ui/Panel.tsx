import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  flush?: boolean;
  className?: string;
};

export const Panel = ({ children, flush = false, className = '' }: Props) => (
  <section className={['ui-panel', flush ? 'ui-panel--flush' : '', className].filter(Boolean).join(' ')}>
    {children}
  </section>
);
