import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useControlledDisclosure } from '../../hooks/useDisclosure';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { IconButton } from './IconButton';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export const BottomSheet = ({ open, onClose, title, children }: Props) => {
  const { isMounted, isInteractive, surfaceState } = useControlledDisclosure(open, 'sheet');
  const trapRef = useFocusTrap(isInteractive);

  useEffect(() => {
    if (!isMounted) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isInteractive) onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMounted, isInteractive, onClose]);

  if (!isMounted) return null;

  return (
    <>
      <div className="ui-overlay" data-state={surfaceState} onClick={onClose} role="presentation" />
      <div
        ref={trapRef}
        className="ui-bottom-sheet"
        data-state={surfaceState}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <div className="ui-bottom-sheet__handle" aria-hidden />
        <header className="ui-bottom-sheet__header">
          <h2 id="sheet-title" className="ui-bottom-sheet__title">
            {title}
          </h2>
          <IconButton label="Закрыть" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div className="ui-bottom-sheet__body">{children}</div>
      </div>
    </>
  );
};
