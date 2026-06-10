export type TopBarStatus = {
  text: string;
  tone?: 'success' | 'error';
};

type Props = {
  projectName: string;
  onProjectName: (value: string) => void;
  onNewProject: () => void;
  onSave: () => void;
  onExportPdf: () => void;
  onExportPng: () => void;
  isExporting?: boolean;
  statusMessage?: TopBarStatus;
};

export const TopBar = ({
  projectName,
  onProjectName,
  onNewProject,
  onSave,
  onExportPdf,
  onExportPng,
  isExporting = false,
  statusMessage,
}: Props) => (
  <header className="topbar">
    <div className="topbar-main">
      <h1>Конфигуратор алюминиевой грязезащиты</h1>
      <input value={projectName} onChange={(event) => onProjectName(event.target.value)} placeholder="Название проекта" />
    </div>
    <div className="topbar-actions">
      <button onClick={onNewProject} disabled={isExporting}>
        Новый проект
      </button>
      <button onClick={onSave} disabled={isExporting}>
        Сохранить
      </button>
      <button onClick={onExportPdf} disabled={isExporting}>
        {isExporting ? 'Экспорт…' : 'Экспорт PDF'}
      </button>
      <button onClick={onExportPng} disabled={isExporting}>
        {isExporting ? 'Экспорт…' : 'Экспорт PNG'}
      </button>
    </div>
    {statusMessage && (
      <p className={`topbar-message topbar-message--${statusMessage.tone ?? 'success'}`}>{statusMessage.text}</p>
    )}
  </header>
);
