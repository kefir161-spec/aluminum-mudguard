import { useEffect, useRef } from 'react';

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
  const dialogRef = useRef<HTMLDivElement>(null);

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
      const input = dialogRef.current?.querySelector<HTMLInputElement>('input');
      input?.focus();
      input?.select();
    }
  }, [props.kind]);

  return (
    <div className="app-modal-overlay" role="presentation" onClick={props.kind === 'newProject' ? props.onCancel : props.onClose}>
      <div
        ref={dialogRef}
        className={`app-modal app-modal--${props.kind === 'alert' ? props.tone ?? 'success' : 'form'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        {props.kind === 'newProject' ? (
          <>
            <h2 id="app-modal-title" className="app-modal__title">
              Новый проект
            </h2>
            <p className="app-modal__text">Введите название проекта и нажмите «Создать».</p>
            <label className="app-modal__label" htmlFor="new-project-name">
              Название проекта
            </label>
            <input
              id="new-project-name"
              className="field-full app-modal__input"
              value={props.projectName}
              onChange={(event) => props.onProjectNameChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') props.onConfirm();
              }}
            />
            <div className="app-modal__actions">
              <button type="button" onClick={props.onCancel}>
                Отмена
              </button>
              <button type="button" className="app-modal__btn-primary" onClick={props.onConfirm}>
                Создать
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="app-modal-title" className="app-modal__title">
              {props.title}
            </h2>
            <p className="app-modal__text">{props.message}</p>
            <div className="app-modal__actions">
              <button type="button" className="app-modal__btn-primary" onClick={props.onClose}>
                OK
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
