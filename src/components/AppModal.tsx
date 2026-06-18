import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Button } from './ui/Button';

type NewProjectModalProps = {
  kind: 'newProject';
  projectName: string;
  onProjectNameChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

type AlertModalProps = {
  kind: 'alert';
  title: string;
  message: string;
  tone?: 'success' | 'error';
  onClose: () => void;
};

export type AppModalProps = NewProjectModalProps | AlertModalProps;

export const AppModal = (props: AppModalProps) => {
  const trapRef = useFocusTrap(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (props.kind === 'newProject') props.onCancel();
        else props.onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [props]);

  useEffect(() => {
    if (props.kind === 'newProject') {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [props.kind]);

  const onBackdropClick = props.kind === 'newProject' ? props.onCancel : props.onClose;

  return (
    <div className="ui-dialog" role="presentation">
      <div className="ui-dialog__backdrop" onClick={onBackdropClick} />
      <div
        ref={trapRef}
        className="ui-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {props.kind === 'newProject' ? (
          <>
            <h2 id="app-modal-title" className="ui-dialog__title">
              Новый проект
            </h2>
            <p className="ui-dialog__text">Введите название проекта и нажмите «Создать».</p>
            <label className="ui-field-label" htmlFor="new-project-name">
              Название проекта
            </label>
            <input
              ref={inputRef}
              id="new-project-name"
              className="ui-input"
              style={{ marginBottom: 16 }}
              value={props.projectName}
              onChange={(event) => props.onProjectNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') props.onConfirm();
              }}
            />
            <div className="ui-dialog__actions">
              <Button variant="secondary" onClick={props.onCancel}>
                Отмена
              </Button>
              <Button variant="primary" onClick={props.onConfirm}>
                Создать
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 id="app-modal-title" className="ui-dialog__title">
              {props.title}
            </h2>
            <p className="ui-dialog__text">{props.message}</p>
            <div className="ui-dialog__actions">
              <Button variant={props.tone === 'error' ? 'danger' : 'primary'} onClick={props.onClose}>
                OK
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
