import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: 'md' | 'lg';
  children: ReactNode;
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ label, size = 'md', className = '', children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={['ui-icon-btn', size === 'lg' ? 'ui-icon-btn--lg' : '', className].filter(Boolean).join(' ')}
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  ),
);

IconButton.displayName = 'IconButton';
