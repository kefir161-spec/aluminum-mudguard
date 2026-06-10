import './App.css';
import { useEffect, useMemo, useState } from 'react';
import { AppModal } from '../components/AppModal';
import type { TopBarStatus } from '../components/TopBar';
import { CalculationPanel } from '../components/CalculationPanel';
import { ModulePalette } from '../components/ModulePalette';
import { PresetPanel } from '../components/PresetPanel';
import { ProjectStoragePanel } from '../components/ProjectStoragePanel';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { SpecPanel } from '../components/SpecPanel';
import { Tabs } from '../components/Tabs';
import { TopBar } from '../components/TopBar';
import { calculateConfig } from '../domain/calculations';
import { layoutPresets } from '../domain/presets';
import type { DimensionSource } from '../domain/types';
import { validateConfigWithCalculation } from '../domain/validation';
import { exportDrawingPdf, exportDrawingPng } from '../export/drawingExport';
import { DrawingSheet } from '../renderers/DrawingSheet';
import { TopViewRenderer } from '../renderers/TopViewRenderer';
import { useConfiguratorStore } from '../store/configuratorStore';

function App() {
  const {
    config,
    projects,
    selectedStripId,
    activeTab,
    applyPresetWarning,
    stripActionWarning,
    setActiveTab,
    setProjectMeta,
    setDimensions,
    addStrip,
    addMultipleStrips,
    selectStrip,
    updateSelectedStrip,
    applyPreset,
    autoFillRemainder,
    clearAllStrips,
    setFitToOrderSize,
    newProject,
    saveCurrentProject,
    loadProject,
    deleteProject,
    loadDemoProjects,
  } = useConfiguratorStore();

  const calculation = useMemo(() => calculateConfig(config), [config]);
  const warnings = useMemo(() => validateConfigWithCalculation(config, calculation), [config, calculation]);
  const selectedStrip = config.strips.find((strip) => strip.id === selectedStripId);
  const handleDimension = (
    key: 'orderWidthMm' | 'orderLengthMm' | 'defaultStripWidthMm' | 'cableEdgeOffsetMm' | 'dimensionSource',
    value: number | DimensionSource,
  ) => setDimensions({ [key]: value });
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<TopBarStatus>();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('Новый проект');
  const [alertModal, setAlertModal] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = window.setTimeout(() => setStatusMessage(undefined), 4000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const showSuccessAlert = (title: string, message: string) => {
    setAlertModal({ title, message });
  };

  const handleNewProject = () => {
    setNewProjectName('Новый проект');
    setIsNewProjectModalOpen(true);
  };

  const confirmNewProject = () => {
    const projectName = newProjectName.trim() || 'Новый проект';
    newProject(projectName);
    setIsNewProjectModalOpen(false);
    showSuccessAlert('Проект создан', `Проект «${projectName}» успешно создан.`);
  };

  const handleSave = () => {
    saveCurrentProject();
    const name = config.projectName.trim() || 'Без названия';
    showSuccessAlert('Проект сохранён', `Проект «${name}» успешно сохранён.`);
  };

  const runExport = async (format: 'pdf' | 'png') => {
    setIsExporting(true);
    setStatusMessage(undefined);
    try {
      if (format === 'pdf') {
        await exportDrawingPdf(config.projectName || 'drawing');
        setStatusMessage({ text: 'PDF сохранён.', tone: 'success' });
      } else {
        await exportDrawingPng(config.projectName || 'drawing');
        setStatusMessage({ text: 'PNG сохранён.', tone: 'success' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка экспорта.';
      setStatusMessage({ text: message, tone: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

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
      {alertModal && (
        <AppModal
          kind="alert"
          title={alertModal.title}
          message={alertModal.message}
          tone="success"
          onClose={() => setAlertModal(null)}
        />
      )}
      <TopBar
        projectName={config.projectName}
        onProjectName={(value) => setProjectMeta('projectName', value)}
        onNewProject={handleNewProject}
        onSave={handleSave}
        onExportPdf={() => runExport('pdf')}
        onExportPng={() => runExport('png')}
        isExporting={isExporting}
        statusMessage={statusMessage}
      />
      <div className="app-grid">
        <aside className="left-column">
          <ModulePalette
            onAdd={(type) => addStrip(type)}
            onAddMany={(type, count) => addMultipleStrips(type, count)}
            warning={stripActionWarning}
          />
          <ProjectStoragePanel projects={projects} currentProjectId={config.id} onLoad={loadProject} onDelete={deleteProject} onLoadDemo={loadDemoProjects} />
        </aside>
        <main className="center-column">
          <Tabs activeTab={activeTab} onChange={setActiveTab} />
          <section className="panel canvas-area" id="canvas-area-export">
            {activeTab === 'constructor' && (
              <TopViewRenderer config={config} selectedStripId={selectedStripId} onStripClick={selectStrip} />
            )}
            {activeTab === 'drawing' && <DrawingSheet config={config} calculation={calculation} forExport={false} />}
            {activeTab === 'spec' && <SpecPanel config={config} calculation={calculation} />}
          </section>
          <PresetPanel onApply={(presetId) => applyPreset(layoutPresets.find((item) => item.id === presetId) ?? layoutPresets[0])} warning={applyPresetWarning} />
        </main>
        <aside className="right-column">
          <PropertiesPanel
            config={config}
            selectedStrip={selectedStrip}
            onDimension={handleDimension}
            onFitToOrderSize={setFitToOrderSize}
            onClientName={(value) => setProjectMeta('clientName', value)}
            onManagerName={(value) => setProjectMeta('managerName', value)}
            onUpdateStrip={(key, value) => updateSelectedStrip({ [key]: value })}
            onAutoFill={() => autoFillRemainder()}
            onClearAll={clearAllStrips}
          />
          <CalculationPanel calculation={calculation} warnings={warnings} />
        </aside>
      </div>
      <div className="export-capture-root" aria-hidden="true">
        <DrawingSheet config={config} calculation={calculation} forExport />
      </div>

      <footer className="status-bar">
        <span>Заказ: {calculation.orderTargetWidthMm.toFixed(0)} мм</span>
        <span>По планкам: {Math.round(calculation.fitApplied ? calculation.effectiveLayoutWidthMm : calculation.nominalLayoutWidthMm)} мм</span>
        {calculation.isUnderfilled && (
          <span className="status-bar-warning">Остаток: {calculation.remainderMm} мм</span>
        )}
        {calculation.isOverfilled && (
          <span className="status-bar-error">Переполнение: {Math.abs(calculation.remainderMm)} мм</span>
        )}
        {calculation.fitApplied && calculation.isFullyFitted && (
          <span className="status-bar-ok">Подогнано под заказ</span>
        )}
        <span>Заглушки: {calculation.plugCount}</span>
        <span>Втулки: {calculation.bushingCount}</span>
        <span>Тросы: {calculation.cableLayout?.count ?? 0}</span>
        <span>Площадь: {calculation.totalAreaM2.toFixed(3)} м²</span>
        <span>Стоимость: {Math.round(calculation.totalPrice).toLocaleString('ru-RU')} ₽</span>
      </footer>
    </div>
  );
}

export default App;
