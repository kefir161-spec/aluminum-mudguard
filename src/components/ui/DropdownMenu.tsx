import { Check } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react';
import { useDisclosure } from '../../hooks/useDisclosure';
import { releaseDropdown, requestDropdownOpen } from './dropdownRegistry';

const DropdownContext = createContext<() => void>(() => undefined);

type Props = {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
};

export const DropdownMenu = ({ trigger, children, align = 'right' }: Props) => {
  const { state, isMounted, isOpen, surfaceState, close, toggle } = useDisclosure({ duration: 'dropdown' });
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReturnFocusRef = useRef(false);
  const menuId = useId();

  const focusTrigger = useCallback(() => {
    const child = containerRef.current?.querySelector<HTMLElement>('.ui-dropdown__trigger > *');
    child?.focus();
  }, []);

  const beginClose = useCallback(
    (returnFocus = false) => {
      shouldReturnFocusRef.current = returnFocus;
      close();
    },
    [close],
  );

  useEffect(() => {
    const triggerEl = containerRef.current?.querySelector<HTMLElement>('.ui-dropdown__trigger > *');
    if (!triggerEl) return;

    triggerEl.setAttribute('aria-expanded', String(isOpen));
    triggerEl.setAttribute('aria-haspopup', 'menu');
    if (isMounted) triggerEl.setAttribute('aria-controls', menuId);
    else triggerEl.removeAttribute('aria-controls');
  }, [isOpen, isMounted, menuId]);

  useEffect(() => {
    if (state === 'closed') {
      releaseDropdown(beginClose);
      if (shouldReturnFocusRef.current) {
        focusTrigger();
        shouldReturnFocusRef.current = false;
      }
      return;
    }
    if (state === 'opening') {
      requestDropdownOpen(beginClose);
    }
  }, [state, beginClose, focusTrigger]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onClick = (event: globalThis.MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) beginClose(true);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') beginClose(true);
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, beginClose]);

  const handleTriggerClick = () => {
    if (isOpen) beginClose(true);
    else toggle();
  };

  return (
    <DropdownContext.Provider value={() => beginClose(false)}>
      <div className="ui-dropdown" ref={containerRef}>
        <div className="ui-dropdown__trigger" onClick={handleTriggerClick}>
          {trigger}
        </div>
        {isMounted && (
          <div
            id={menuId}
            className={`ui-dropdown__menu ui-dropdown__menu--${align}`}
            data-state={surfaceState}
            style={align === 'left' ? { left: 0, right: 'auto' } : undefined}
            role="menu"
          >
            {children}
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
};

type ItemProps = {
  onClick: () => void;
  children: ReactNode;
  variant?: 'default' | 'danger';
  selected?: boolean;
};

export const DropdownMenuItem = ({ onClick, children, variant = 'default', selected = false }: ItemProps) => {
  const close = useContext(DropdownContext);
  return (
    <button
      type="button"
      className={['ui-dropdown__item', variant === 'danger' ? 'ui-dropdown__item--danger' : '', selected ? 'ui-dropdown__item--selected' : '']
        .filter(Boolean)
        .join(' ')}
      role="menuitem"
      onClick={() => {
        onClick();
        close();
      }}
    >
      <span className="ui-dropdown__item-check" aria-hidden>
        {selected ? <Check size={14} /> : null}
      </span>
      <span className="ui-dropdown__item-label">{children}</span>
    </button>
  );
};
