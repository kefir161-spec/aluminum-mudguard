import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
};

const variantClass: Record<Variant, string> = {
  primary: 'ui-btn--primary',
  secondary: 'ui-btn--secondary',
  ghost: 'ui-btn--ghost',
  danger: 'ui-btn--danger',
  success: 'ui-btn--success',
};

const sizeClass: Record<Size, string> = {
  sm: 'ui-btn--sm',
  md: '',
  lg: 'ui-btn--lg',
};

export const Button = ({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  children,
  ...rest
}: Props) => (
  <button
    type="button"
    className={[
      'ui-btn',
      variantClass[variant],
      sizeClass[size],
      fullWidth ? 'ui-btn--full' : '',
      loading ? 'ui-btn--loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    disabled={disabled || loading}
    {...rest}
  >
    {children}
  </button>
);
