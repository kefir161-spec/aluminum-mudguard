import { create } from 'zustand';
import { CABLE_EDGE_OFFSET_DEFAULT_MM } from '../domain/constants';
import {
  getOrderTargetDimensions,
  resolveCarpetDimensions,
} from '../domain/pitDimensions';
import {
  buildStripsFromPattern,
  canInsertScraperAt,
  createStrip,
  derivePatternFromStrips,
  getStripNominalWidth,
  hasScraperAtStart,
  normalizeStrips,
  rebuildLayoutToTargetWidth,
  SCRAPER_AT_START_WARNING,
} from '../domain/layoutRules';
import type { DimensionSource, LayoutPreset, ModuleType, ProductConfig, Strip } from '../domain/types';
import { clampCableEdgeOffset, clampMm } from '../domain/numbers';
import { productionConstants } from '../domain/validation';
import { createDemoProjects } from '../data/demoProjects';
import { deleteProjectById, loadStorage, upsertProject } from '../storage/projectStorage';
type ViewTab = 'constructor' | 'drawing' | 'spec';

type StoreState = {
  config: ProductConfig;
  selectedStripId?: string;
  activeTab: ViewTab;
  projects: ProductConfig[];
  applyPresetWarning?: string;
  stripActionWarning?: string;
  setActiveTab: (tab: ViewTab) => void;
  setProjectMeta: (key: 'projectName' | 'clientName' | 'managerName', value: string) => void;
  setDimensions: (
    partial: Partial<
      Pick<ProductConfig, 'orderWidthMm' | 'orderLengthMm' | 'defaultStripWidthMm' | 'dimensionSource' | 'cableEdgeOffsetMm'>
    >,
  ) => void;
  addStrip: (type: ModuleType, widthMm?: number, afterSelected?: boolean) => void;
  addMultipleStrips: (type: ModuleType, count: number) => void;
  selectStrip: (stripId?: string) => void;
  updateSelectedStrip: (partial: Partial<Pick<Strip, 'type' | 'widthMm'>>) => void;
  applyPreset: (preset: LayoutPreset) => void;
  autoFillRemainder: () => void;
  clearAllStrips: () => void;
  setFitToOrderSize: (fitToOrderSize: boolean) => void;
  newProject: (projectName?: string) => void;
  saveCurrentProject: () => void;
  loadProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  loadDemoProjects: () => void;
};

/** Синхронизирует габариты полотна с заказными размерами (без изменения раскладки). */
const syncOrderDimensions = (config: ProductConfig): ProductConfig => {
  const source = config.dimensionSource ?? 'carpet';
  const carpet = resolveCarpetDimensions(config.orderWidthMm, config.orderLengthMm, source);

  return {
    ...config,
    totalWidthMm: carpet.totalWidthMm,
    totalLengthMm: carpet.totalLengthMm,
  };
};

const normalizeConfig = (config: ProductConfig): ProductConfig => {
  const dimensionSource: DimensionSource = config.dimensionSource ?? 'carpet';
  const orderWidthMm = config.orderWidthMm ?? config.totalWidthMm;
  const orderLengthMm = config.orderLengthMm ?? config.totalLengthMm;

  return syncOrderDimensions({
    ...config,
    dimensionSource,
    orderWidthMm,
    orderLengthMm,
    cableEdgeOffsetMm: config.cableEdgeOffsetMm ?? CABLE_EDGE_OFFSET_DEFAULT_MM,
    defaultStripWidthMm: config.defaultStripWidthMm ?? productionConstants.defaultStripWidthMm,
    fitToOrderSize: config.fitToOrderSize ?? false,
    autoFillEnabled: config.autoFillEnabled ?? false,
    strips: normalizeStrips(config.strips),
  });
};

const applyPatternToWidth = (config: ProductConfig): ProductConfig => {
  const pattern = config.layoutPattern;
  if (!config.autoFillEnabled || !pattern?.length) return config;

  const targetWidth = getOrderTargetDimensions(config).totalWidthMm;
  const strips = rebuildLayoutToTargetWidth(pattern, targetWidth);

  return { ...config, strips };
};

const createNewProject = (): ProductConfig => {
  const now = new Date().toISOString();
  const orderWidthMm = 1000;
  const orderLengthMm = 1500;
  const carpet = resolveCarpetDimensions(orderWidthMm, orderLengthMm, 'carpet');

  return {
    id: crypto.randomUUID(),
    projectName: 'Новый проект',
    clientName: '',
    managerName: '',
    orderWidthMm,
    orderLengthMm,
    totalWidthMm: carpet.totalWidthMm,
    totalLengthMm: carpet.totalLengthMm,
    dimensionSource: 'carpet',
    defaultStripWidthMm: productionConstants.defaultStripWidthMm,
    layoutPattern: ['rubber', 'pile'],
    cableEdgeOffsetMm: CABLE_EDGE_OFFSET_DEFAULT_MM,
    fitToOrderSize: false,
    autoFillEnabled: false,
    strips: [],
    createdAt: now,
    updatedAt: now,
  };
};

const withUpdatedAt = (config: ProductConfig): ProductConfig => ({ ...config, updatedAt: new Date().toISOString() });

const initialStorage = loadStorage();
const initialProject = normalizeConfig(
  initialStorage.projects.find((item) => item.id === initialStorage.lastOpenedProjectId) ??
    initialStorage.projects[0] ??
    createNewProject(),
);

export const useConfiguratorStore = create<StoreState>((set, get) => ({
  config: initialProject,
  selectedStripId: initialProject.strips[0]?.id,
  activeTab: 'constructor',
  projects: initialStorage.projects.map(normalizeConfig),
  applyPresetWarning: undefined,
  stripActionWarning: undefined,
  setActiveTab: (activeTab) => set({ activeTab }),
  setProjectMeta: (key, value) =>
    set((state) => ({
      config: withUpdatedAt({
        ...state.config,
        [key]: value,
      }),
    })),
  setDimensions: (partial) =>
    set((state) => {
      const next = { ...state.config, ...partial };
      if (partial.orderWidthMm !== undefined) next.orderWidthMm = clampMm(partial.orderWidthMm, 100);
      if (partial.orderLengthMm !== undefined) next.orderLengthMm = clampMm(partial.orderLengthMm, 100);
      if (partial.defaultStripWidthMm !== undefined) next.defaultStripWidthMm = clampMm(partial.defaultStripWidthMm);
      if (partial.cableEdgeOffsetMm !== undefined) next.cableEdgeOffsetMm = clampCableEdgeOffset(partial.cableEdgeOffsetMm);
      if (partial.dimensionSource !== undefined) next.dimensionSource = partial.dimensionSource;

      const synced = syncOrderDimensions(next);
      const widthChanged =
        partial.orderWidthMm !== undefined || partial.dimensionSource !== undefined;
      const refilled = widthChanged ? applyPatternToWidth(synced) : synced;

      return {
        config: withUpdatedAt(refilled),
        selectedStripId: widthChanged ? refilled.strips[0]?.id : state.selectedStripId,
      };
    }),
  addStrip: (type, _widthMm, afterSelected = true) =>
    set((state) => {
      const strip = createStrip(type);
      const strips = [...state.config.strips];
      const selectedIndex = strips.findIndex((item) => item.id === state.selectedStripId);
      const preferredInsertAt = afterSelected && selectedIndex >= 0 ? selectedIndex + 1 : strips.length;

      const insertAt = preferredInsertAt;
      if (type === 'scraper' && !canInsertScraperAt(insertAt)) {
        return {
          stripActionWarning: `${SCRAPER_AT_START_WARNING} Добавьте сначала широкую планку.`,
        };
      }

      strips.splice(insertAt, 0, strip);
      const normalized = normalizeStrips(strips);

      return {
        config: withUpdatedAt(
          syncOrderDimensions({ ...state.config, strips: normalized, autoFillEnabled: false }),
        ),
        selectedStripId: strip.id,
        stripActionWarning: undefined,
      };
    }),
  addMultipleStrips: (type, count) =>
    set((state) => {
      const strips = [...state.config.strips];
      const addCount = Math.max(1, count);

      for (let index = 0; index < addCount; index += 1) {
        if (type === 'scraper' && strips.length === 0) {
          return {
            stripActionWarning: `${SCRAPER_AT_START_WARNING} Добавьте сначала широкую планку.`,
          };
        }
        strips.push(createStrip(type));
      }
      const normalized = normalizeStrips(strips);
      return {
        config: withUpdatedAt(
          syncOrderDimensions({ ...state.config, strips: normalized, autoFillEnabled: false }),
        ),
        stripActionWarning: undefined,
      };
    }),
  selectStrip: (selectedStripId) => set({ selectedStripId }),
  updateSelectedStrip: (partial) =>
    set((state) => {
      if (!state.selectedStripId) return state;
      const strips = state.config.strips.map((strip) => {
        if (strip.id !== state.selectedStripId) return strip;
        const nextType = partial.type ?? strip.type;
        return {
          ...strip,
          ...partial,
          type: nextType,
          widthMm: getStripNominalWidth(nextType),
        };
      });
      if (hasScraperAtStart(strips)) {
        return { stripActionWarning: SCRAPER_AT_START_WARNING };
      }
      return {
        config: withUpdatedAt(
          syncOrderDimensions({
            ...state.config,
            strips: normalizeStrips(strips),
            autoFillEnabled: false,
          }),
        ),
        stripActionWarning: undefined,
      };
    }),
  applyPreset: (preset) =>
    set((state) => {
      const targetWidth = getOrderTargetDimensions(state.config).totalWidthMm;
      const { strips, warning } = buildStripsFromPattern(preset.pattern, targetWidth);

      const nextConfig = syncOrderDimensions({
        ...state.config,
        strips,
        layoutPattern: preset.pattern,
        autoFillEnabled: true,
      });

      return {
        config: withUpdatedAt(nextConfig),
        selectedStripId: strips[0]?.id,
        applyPresetWarning: warning,
      };
    }),
  autoFillRemainder: () =>
    set((state) => {
      const pattern =
        state.config.autoFillEnabled && state.config.layoutPattern?.length
          ? state.config.layoutPattern
          : derivePatternFromStrips(state.config.strips);
      if (pattern.length === 0) {
        return {
          stripActionWarning:
            'Сначала соберите на полотне комбинацию профилей — она будет повторяться на всю ширину.',
        };
      }

      const targetWidth = getOrderTargetDimensions(state.config).totalWidthMm;
      const strips = rebuildLayoutToTargetWidth(pattern, targetWidth);

      return {
        config: withUpdatedAt(
          syncOrderDimensions({
            ...state.config,
            strips,
            layoutPattern: pattern,
            autoFillEnabled: true,
          }),
        ),
        selectedStripId: strips[0]?.id,
        stripActionWarning: undefined,
      };
    }),
  clearAllStrips: () =>
    set((state) => ({
      config: withUpdatedAt({
        ...state.config,
        strips: [],
        autoFillEnabled: false,
      }),
      selectedStripId: undefined,
      stripActionWarning: undefined,
    })),
  setFitToOrderSize: (fitToOrderSize) =>
    set((state) => ({
      config: withUpdatedAt({ ...state.config, fitToOrderSize }),
    })),
  newProject: (projectName) => {
    const project = createNewProject();
    const trimmedName = projectName?.trim();
    if (trimmedName) {
      project.projectName = trimmedName;
    }
    set({
      config: project,
      selectedStripId: undefined,
      stripActionWarning: undefined,
      applyPresetWarning: undefined,
    });
  },
  saveCurrentProject: () => {
    const config = get().config;
    const saved = withUpdatedAt(config);
    upsertProject(saved);
    set((state) => ({ config: saved, projects: [saved, ...state.projects.filter((item) => item.id !== saved.id)] }));
  },
  loadProject: (projectId) =>
    set((state) => {
      const project = state.projects.find((item) => item.id === projectId);
      if (!project) return state;
      const normalized = normalizeConfig(project);
      return { config: normalized, selectedStripId: normalized.strips[0]?.id };
    }),
  deleteProject: (projectId) =>
    set((state) => {
      deleteProjectById(projectId);
      const projects = state.projects.filter((project) => project.id !== projectId);
      const config = state.config.id === projectId ? normalizeConfig(projects[0] ?? createNewProject()) : state.config;
      return { projects, config, selectedStripId: config.strips[0]?.id };
    }),
  loadDemoProjects: () =>
    set((state) => {
      const demos = createDemoProjects().map(normalizeConfig);
      const projects = [...demos, ...state.projects];
      return { projects };
    }),
}));
