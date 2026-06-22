import './App.css';
import '../components/ui/ui.css';
import { useEffect, useMemo, useState } from 'react';
import { Calculator, Layers3, Settings2 } from 'lucide-react';
import { AppModal } from '../components/AppModal';
import { CalculationPanel, CalculationSummary } from '../components/CalculationPanel';
import { ConstructorView } from '../components/ConstructorView';
import { LayoutActionsPanel } from '../components/LayoutActionsPanel';
import { ModulePalette } from '../components/ModulePalette';
import { PresetPanel } from '../components/PresetPanel';
import { ProjectStoragePanel } from '../components/ProjectStoragePanel';
import { SaveStatusIndicator } from '../components/SaveStatusIndicator';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { SpecPanel } from '../components/SpecPanel';
import { Tabs } from '../components/Tabs';
import { TopBar } from '../components/TopBar';
import { BottomSheet } from '../components/ui/BottomSheet';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Drawer } from '../components/ui/Drawer';
import { ToastProvider } from '../components/ui/Toast';
import { useToast } from '../components/ui/useToast';
import { calculateConfig } from '../domain/calculations';
import { layoutPresets } from '../domain/presets';
import type { DimensionSource } from '../domain/types';
import { validateConfigWithCalculation } from '../domain/validation';
import { exportDrawingPdf, exportDrawingPng } from '../export/drawingExport';
import { DrawingSheet } from '../renderers/DrawingSheet';
import { useConfiguratorStore } from '../store/configuratorStore';

type MobileSheet = 'profiles' | 'params' | 'calc' | null;

function AppContent() {
  const {
    config,
    projects,
    selectedStripId,
    activeTab,
    stripActionWarning,
    setActiveTab,
    setProjectMeta,
    setDimensions,
    addStrip,
    removeStrip,
    selectStrip,
    updateSelectedStrip,
    applyPreset,
    autoFillRemainder,
    clearAllStrips,
    setFitToOrderSize,
    setNarrowWidthDiscountEnabled,
    newProject,
    saveCurrentProject,
    loadProject,
    deleteProject,
    loadDemoProjects,
  } = useConfiguratorStore();

  const { showToast } = useToast();
  const calculation = useMemo(() => calculateConfig(config), [config]);
  const warnings = useMemo(() => validateConfigWithCalculation(config, calculation), [config, calculation]);
  const selectedStrip = config.strips.find((strip) => strip.id === selectedStripId);

  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; tone?: 'success' | 'error' }>();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('Новый проект');
  const [isProjectsDrawerOpen, setIsProjectsDrawerOpen] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [lastSavedUpdatedAt, setLastSavedUpdatedAt] = useState(config.updatedAt);

  const isDirty = config.updatedAt !== lastSavedUpdatedAt;

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = window.setTimeout(() => setStatusMessage(undefined), 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const handleDimension = (
    key: 'orderWidthMm' | 'orderLengthMm' | 'defaultStripWidthMm' | 'cableEdgeOffsetMm' | 'dimensionSource',
    value: number | DimensionSource,
  ) => setDimensions({ [key]: value });

  const handleNewProject = () => {
    setNewProjectName('Новый проект');
    setIsNewProjectModalOpen(true);
  };

  const confirmNewProject = () => {
    const projectName = newProjectName.trim() || 'Новый проект';
    newProject(projectName);
    const fresh = useConfiguratorStore.getState().config;
    setLastSavedUpdatedAt(fresh.updatedAt);
    setIsNewProjectModalOpen(false);
    showToast(`Проект «${projectName}» создан`, 'success');
  };

  const handleSave = () => {
    saveCurrentProject();
    const saved = useConfiguratorStore.getState().config;
    setLastSavedUpdatedAt(saved.updatedAt);
    const name = config.projectName.trim() || 'Без названия';
    showToast(`Проект «${name}» сохранён`, 'success');
  };

  const handleLoadProject = (projectId: string) => {
    loadProject(projectId);
    const loaded = useConfiguratorStore.getState().config;
    setLastSavedUpdatedAt(loaded.updatedAt);
    setIsProjectsDrawerOpen(false);
    showToast('Проект загружен', 'success');
  };

  const handleClearAll = () => {
    clearAllStrips();
    setIsClearConfirmOpen(false);
    showToast('Полотно очищено', 'neutral');
  };

  const runExport = async (format: 'pdf' | 'png') => {
    setIsExporting(true);
    setStatusMessage(undefined);
    try {
      if (format === 'pdf') {
        await exportDrawingPdf(config.projectName || 'drawing');
        setStatusMessage({ text: 'PDF сохранён.', tone: 'success' });
        showToast('PDF сохранён', 'success');
      } else {
        await exportDrawingPng(config.projectName || 'drawing');
        setStatusMessage({ text: 'PNG сохранён.', tone: 'success' });
        showToast('PNG сохранён', 'success');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка экспорта.';
      setStatusMessage({ text: message, tone: 'error' });
      showToast(message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const propertiesPanel = (
    <PropertiesPanel
      config={config}
      selectedStrip={selectedStrip}
      onDimension={handleDimension}
      onFitToOrderSize={setFitToOrderSize}
      onNarrowWidthDiscount={setNarrowWidthDiscountEnabled}
      onClientName={(value) => setProjectMeta('clientName', value)}
      onManagerName={(value) => setProjectMeta('managerName', value)}
      onUpdateStrip={(key, value) => updateSelectedStrip({ [key]: value })}
    />
  );

  const profilesContent = (
    <>
      <ModulePalette
        onAdd={(type) => addStrip(type)}
        warning={stripActionWarning}
        presets={
          <PresetPanel
            embedded
            onApply={(presetId) => applyPreset(layoutPresets.find((item) => item.id === presetId) ?? layoutPresets[0])}
          />
        }
      />
      <LayoutActionsPanel
        config={config}
        onAutoFill={() => autoFillRemainder()}
        onRequestClearAll={() => setIsClearConfirmOpen(true)}
      />
    </>
  );

  return (
    <div className="app-root">
      {isNewProjectModalOpen && (
        <AppModal
          kind="newProject"
          projectName={newProjectName}
          onProjectNameChange={setNewProjectName}
          onConfirm={confirmNewProject}
          onCancel={() => setIsNewProjectModalOpen(false)}
        />
      )}

      <ConfirmDialog
        open={isClearConfirmOpen}
        title="Очистить полотно?"
        message="Полотно будет очищено. Отменить это действие нельзя."
        confirmLabel="Очистить"
        variant="danger"
        onConfirm={handleClearAll}
        onCancel={() => setIsClearConfirmOpen(false)}
      />

      <TopBar
        projectName={config.projectName}
        onProjectName={(value) => setProjectMeta('projectName', value)}
        onOpenProjects={() => setIsProjectsDrawerOpen(true)}
        onNewProject={handleNewProject}
        onSave={handleSave}
        onExportPdf={() => runExport('pdf')}
        onExportPng={() => runExport('png')}
        isExporting={isExporting}
        statusMessage={statusMessage}
      />

      <SaveStatusIndicator isDirty={isDirty} />

      <div className="app-workspace">
        <aside className="left-panel" aria-label="Профили и шаблоны">
          {profilesContent}
        </aside>

        <button
          type="button"
          className="left-panel-toggle"
          onClick={() => setIsLeftDrawerOpen(true)}
          aria-label="Открыть панель профилей"
        >
          <Layers3 size={18} aria-hidden />
        </button>

        <main className="center-panel">
          <Tabs activeTab={activeTab} onChange={setActiveTab} />
          <section
            key={activeTab}
            className={`canvas-area${activeTab === 'drawing' ? ' canvas-area--drawing' : ''}`}
            id="canvas-area-export"
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'constructor' && (
              <ConstructorView
                config={config}
                selectedStripId={selectedStripId}
                onStripClick={selectStrip}
                onStripRemove={removeStrip}
              />
            )}
            {activeTab === 'drawing' && (
              <div className="drawing-desk">
                <DrawingSheet config={config} calculation={calculation} forExport={false} />
              </div>
            )}
            {activeTab === 'spec' && <SpecPanel config={config} calculation={calculation} />}
          </section>
        </main>

        <aside className="right-panel" aria-label="Параметры и расчёт">
          {propertiesPanel}
          <div className="right-panel__calc">
            <CalculationPanel calculation={calculation} warnings={warnings} />
          </div>
        </aside>
      </div>

      <div className="mobile-sticky-summary">
        <CalculationSummary
          calculation={calculation}
          compact
          showStatusBadge={!warnings[0]}
          footerNote={warnings[0]}
          onExpandDetails={() => setMobileSheet('calc')}
        />
      </div>

      <div className="mobile-bottom-bar" role="navigation" aria-label="Мобильная навигация">
        <button
          type="button"
          className={`mobile-bottom-bar__item${mobileSheet === 'profiles' ? ' mobile-bottom-bar__item--active' : ''}`}
          onClick={() => setMobileSheet((prev) => (prev === 'profiles' ? null : 'profiles'))}
        >
          <Layers3 size={20} aria-hidden />
          <span>Профили</span>
        </button>
        <button
          type="button"
          className={`mobile-bottom-bar__item${mobileSheet === 'params' ? ' mobile-bottom-bar__item--active' : ''}`}
          onClick={() => setMobileSheet((prev) => (prev === 'params' ? null : 'params'))}
        >
          <Settings2 size={20} aria-hidden />
          <span>Параметры</span>
        </button>
        <button
          type="button"
          className={`mobile-bottom-bar__item${mobileSheet === 'calc' ? ' mobile-bottom-bar__item--active' : ''}`}
          onClick={() => setMobileSheet((prev) => (prev === 'calc' ? null : 'calc'))}
        >
          <Calculator size={20} aria-hidden />
          <span>Итог</span>
        </button>
      </div>

      <Drawer open={isProjectsDrawerOpen} onClose={() => setIsProjectsDrawerOpen(false)} title="Проекты" side="right">
        <ProjectStoragePanel
          projects={projects}
          currentProjectId={config.id}
          onLoad={handleLoadProject}
          onDelete={deleteProject}
          onLoadDemo={loadDemoProjects}
        />
      </Drawer>

      <Drawer open={isLeftDrawerOpen} onClose={() => setIsLeftDrawerOpen(false)} title="Профили" side="left">
        {profilesContent}
      </Drawer>

      <BottomSheet open={mobileSheet === 'profiles'} onClose={() => setMobileSheet(null)} title="Профили">
        {profilesContent}
      </BottomSheet>

      <BottomSheet open={mobileSheet === 'params'} onClose={() => setMobileSheet(null)} title="Параметры">
        {propertiesPanel}
      </BottomSheet>

      <BottomSheet open={mobileSheet === 'calc'} onClose={() => setMobileSheet(null)} title="Расчёт и итог">
        <CalculationPanel calculation={calculation} warnings={warnings} />
      </BottomSheet>

      <div className="export-capture-root" aria-hidden="true">
        <DrawingSheet config={config} calculation={calculation} forExport />
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
