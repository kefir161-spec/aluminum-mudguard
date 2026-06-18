import { useState } from 'react';
import { formatMmInput } from '../domain/numbers';

type Props = {
  value: number;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  fractionDigits?: number;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'mm';
};

const parseDraft = (raw: string): number | null => {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '' || normalized === '-' || normalized === '.') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampValue = (value: number, min?: number, max?: number): number => {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
};

export const NumericMmField = ({
  value,
  onCommit,
  min,
  max,
  fractionDigits = 0,
  disabled = false,
  className = 'field-full',
  variant = 'default',
}: Props) => {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const formattedValue = String(formatMmInput(value, fractionDigits));

  const commit = (raw: string) => {
    const parsed = parseDraft(raw);
    if (parsed === null) {
      setDraft(formattedValue);
      return;
    }
    const rounded =
      fractionDigits === 0 ? Math.round(parsed) : formatMmInput(parsed, fractionDigits);
    onCommit(clampValue(rounded, min, max));
  };

  const inputProps = {
    type: 'text' as const,
    inputMode: 'decimal' as const,
    disabled,
    value: focused ? draft : formattedValue,
    onFocus: () => {
      setFocused(true);
      setDraft(formattedValue);
    },
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setDraft(event.target.value),
    onBlur: () => {
      setFocused(false);
      commit(draft);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') event.currentTarget.blur();
    },
  };

  if (variant === 'mm') {
    return (
      <div className={`ui-mm-field ${className}`}>
        <input className="ui-mm-field__input" {...inputProps} />
        <span className="ui-mm-field__unit">мм</span>
      </div>
    );
  }

  return <input className={className} {...inputProps} />;
};
