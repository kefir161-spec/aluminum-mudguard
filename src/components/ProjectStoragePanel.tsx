import { useState } from 'react';
import type { ProductConfig } from '../domain/types';

type Props = {
  projects: ProductConfig[];
  currentProjectId: string;
  onLoad: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onLoadDemo: () => void;
};

export const ProjectStoragePanel = ({ projects, currentProjectId, onLoad, onDelete, onLoadDemo }: Props) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Сохраненные проекты</h2>
        <button className="toggle-btn" onClick={() => setIsExpanded((prev) => !prev)}>
          {isExpanded ? 'Свернуть' : 'Развернуть'}
        </button>
      </div>
      {isExpanded && (
        <div className="collapsible-content">
          <button onClick={onLoadDemo}>Загрузить демо-проекты</button>
          <div className="storage-list">
            {projects.length === 0 && <p className="muted">Пока нет сохраненных проектов.</p>}
            {projects.map((project) => (
              <div key={project.id} className={project.id === currentProjectId ? 'project-row active' : 'project-row'}>
                <div>
                  <strong>{project.projectName}</strong>
                  <p>{new Date(project.updatedAt).toLocaleString('ru-RU')}</p>
                </div>
                <div className="row row-actions">
                  <button type="button" onClick={() => onLoad(project.id)}>
                    Открыть
                  </button>
                  <button type="button" className="danger" onClick={() => onDelete(project.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
