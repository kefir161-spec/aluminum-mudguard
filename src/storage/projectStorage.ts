import type { ProductConfig } from '../domain/types';

const STORAGE_KEY = 'mudguard-projects-v1';

type StorageShape = {
  projects: ProductConfig[];
  lastOpenedProjectId?: string;
};

const fallback: StorageShape = { projects: [] };

export const loadStorage = (): StorageShape => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as StorageShape;
    return {
      projects: parsed.projects ?? [],
      lastOpenedProjectId: parsed.lastOpenedProjectId,
    };
  } catch {
    return fallback;
  }
};

export const saveStorage = (data: StorageShape): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const upsertProject = (project: ProductConfig): void => {
  const data = loadStorage();
  const existingIndex = data.projects.findIndex((item) => item.id === project.id);
  if (existingIndex >= 0) {
    data.projects[existingIndex] = project;
  } else {
    data.projects.unshift(project);
  }
  data.lastOpenedProjectId = project.id;
  saveStorage(data);
};

export const deleteProjectById = (projectId: string): void => {
  const data = loadStorage();
  data.projects = data.projects.filter((project) => project.id !== projectId);
  if (data.lastOpenedProjectId === projectId) {
    data.lastOpenedProjectId = data.projects[0]?.id;
  }
  saveStorage(data);
};
