import {
  Download,
  FilePlus,
  FileText,
  FolderOpen,
  Image,
  Layers3,
  Save,
  ChevronDown,
} from 'lucide-react';
import { useRef } from 'react';
import { Button } from './ui/Button';
import { DropdownMenu, DropdownMenuItem } from './ui/DropdownMenu';

export type TopBarStatus = {
  text: string;
  tone?: 'success' | 'error';
};

type Props = {
  projectName: string;
  onProjectName: (value: string) => void;
  onOpenProjects: () => void;
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
  onOpenProjects,
  onNewProject,
  onSave,
  onExportPdf,
  onExportPng,
  isExporting = false,
  statusMessage,
}: Props) => {
  const projectInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__logo" aria-hidden>
          <Layers3 size={20} />
        </div>
        <div className="topbar__titles">
          <h1 className="topbar__app-name">Конфигуратор грязезащиты</h1>
          <div className="topbar__project-row">
            <input
              ref={projectInputRef}
              className="topbar__project-input"
              value={projectName}
              onChange={(event) => onProjectName(event.target.value)}
              aria-label="Название проекта"
            />
          </div>
        </div>
      </div>

      {statusMessage && (
        <p className={`topbar__message topbar__message--${statusMessage.tone ?? 'success'}`} role="status">
          {statusMessage.text}
        </p>
      )}

      <div className="topbar__actions">
        <Button variant="secondary" onClick={onOpenProjects} disabled={isExporting} className="topbar__btn-projects">
          <FolderOpen size={16} aria-hidden />
          <span>Проекты</span>
        </Button>
        <Button variant="secondary" onClick={onNewProject} disabled={isExporting} className="topbar__btn-new">
          <FilePlus size={16} aria-hidden />
          <span>Новый</span>
        </Button>
        <Button variant="primary" onClick={onSave} disabled={isExporting} loading={isExporting} className="topbar__btn-save">
          <Save size={16} aria-hidden />
          <span>Сохранить</span>
        </Button>
        <DropdownMenu
          trigger={
            <Button variant="secondary" disabled={isExporting} className="topbar__btn-export">
              <Download size={16} aria-hidden />
              <span>{isExporting ? 'Экспорт…' : 'Экспорт'}</span>
              <ChevronDown size={14} aria-hidden />
            </Button>
          }
        >
          <DropdownMenuItem
            onClick={() => {
              onExportPdf();
            }}
          >
            <FileText size={16} aria-hidden />
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onExportPng();
            }}
          >
            <Image size={16} aria-hidden />
            PNG
          </DropdownMenuItem>
        </DropdownMenu>
      </div>

      <div className="topbar__actions-compact">
        <Button variant="primary" onClick={onSave} disabled={isExporting} size="sm">
          <Save size={16} aria-hidden />
        </Button>
        <DropdownMenu
          trigger={
            <Button variant="secondary" size="sm" disabled={isExporting}>
              <span>Меню</span>
              <ChevronDown size={14} aria-hidden />
            </Button>
          }
        >
          <DropdownMenuItem onClick={onOpenProjects}>
            <FolderOpen size={16} aria-hidden />
            Проекты
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onNewProject}>
            <FilePlus size={16} aria-hidden />
            Новый проект
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPdf}>
            <FileText size={16} aria-hidden />
            Экспорт PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPng}>
            <Image size={16} aria-hidden />
            Экспорт PNG
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
    </header>
  );
};
