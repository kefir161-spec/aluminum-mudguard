import { FolderOpen, Upload } from 'lucide-react';
import { useState } from 'react';
import { DEMO_PROJECT_IDS } from '../data/demoProjects';
import type { ProductConfig } from '../domain/types';
import { Button } from './ui/Button';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { useToast } from './ui/useToast';

type Props = {
  projects: ProductConfig[];
  currentProjectId: string;
  onLoad: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onLoadDemo: () => void;
};

const hasAllDemoProjects = (projects: ProductConfig[]): boolean => {
  const demoIds = Object.values(DEMO_PROJECT_IDS);
  const demoNames = [
    'Входная группа ТЦ — Резина–Ворс',
    'Офис — Ворс–Скребок–Резина',
    'Интенсивный вход — Резина–Щетка–Скребок',
  ];
  return (
    demoIds.every((id) => projects.some((project) => project.id === id)) &&
    projects.filter((project) => demoNames.includes(project.projectName)).length === demoIds.length
  );
};

export const ProjectStoragePanel = ({ projects, currentProjectId, onLoad, onDelete, onLoadDemo }: Props) => {
  const { showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<ProductConfig | null>(null);

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleLoadDemo = () => {
    if (hasAllDemoProjects(projects)) {
      showToast('Типовые проекты уже загружены', 'neutral');
      return;
    }
    onLoadDemo();
    showToast('Типовые проекты добавлены', 'success');
  };

  const handleLoadSavedProject = () => {
    showToast('Загрузка сохранённого проекта из файла — в разработке', 'neutral');
  };

  return (
    <>
      <div className="project-storage">
        <div className="project-storage__actions">
          <Button variant="secondary" fullWidth onClick={handleLoadDemo}>
            <Upload size={16} aria-hidden />
            Загрузить типовые проекты
          </Button>
          <Button variant="secondary" fullWidth onClick={handleLoadSavedProject}>
            <FolderOpen size={16} aria-hidden />
            Загрузить сохранённый проект
          </Button>
        </div>
        <div className="project-list">
          {projects.length === 0 && <p className="field-hint">Пока нет сохранённых проектов.</p>}
          {projects.map((project) => (
            <div
              key={project.id}
              className={`project-card${project.id === currentProjectId ? ' project-card--active' : ''}`}
            >
              <div className="project-card__info">
                <strong className="project-card__name">{project.projectName}</strong>
                <span className="field-hint">{new Date(project.updatedAt).toLocaleString('ru-RU')}</span>
              </div>
              <div className="project-card__actions">
                <Button variant="primary" size="sm" onClick={() => onLoad(project.id)}>
                  Открыть
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(project)}>
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Удалить проект?"
        message={`Проект «${deleteTarget?.projectName ?? ''}» будет удалён без возможности восстановления.`}
        confirmLabel="Удалить"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};
