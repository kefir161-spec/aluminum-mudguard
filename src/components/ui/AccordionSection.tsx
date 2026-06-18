import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

type Props = {
  title: string;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  children: ReactNode;
};

export const AccordionSection = ({ title, defaultOpen = false, open, onToggle, children }: Props) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? open : internalOpen;
  const contentId = useId();

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onToggle?.(next);
  };

  return (
    <div className="ui-accordion">
      <button
        type="button"
        className="ui-accordion__trigger"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={toggle}
      >
        <span>{title}</span>
        <ChevronDown size={16} className="ui-accordion__chevron" aria-hidden />
      </button>
      <div className="ui-accordion__content" data-state={isOpen ? 'open' : 'closed'} id={contentId}>
        <div className="ui-accordion__content-inner">{children}</div>
      </div>
    </div>
  );
};
