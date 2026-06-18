import { Calculator, FileText, Layers3 } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

type TabId = 'constructor' | 'drawing' | 'spec';

type Tab = { id: TabId; label: string; icon: typeof Layers3 };

const tabs: Tab[] = [
  { id: 'constructor', label: 'Конструктор', icon: Layers3 },
  { id: 'drawing', label: 'Чертёж', icon: FileText },
  { id: 'spec', label: 'Спецификация', icon: Calculator },
];

type Props = {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
};

type IndicatorStyle = { left: number; width: number };

export const Tabs = ({ activeTab, onChange }: Props) => {
  const tabListRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<IndicatorStyle | null>(null);

  useLayoutEffect(() => {
    const container = tabListRef.current;
    if (!container) return;

    const activeButton = container.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`);
    if (!activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setIndicator({
      left: buttonRect.left - containerRect.left,
      width: buttonRect.width,
    });
  }, [activeTab]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      let nextIndex: number;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;

      event.preventDefault();
      onChange(tabs[nextIndex].id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIndex]?.focus();
    },
    [onChange],
  );

  return (
    <div className="view-tabs" ref={tabListRef} role="tablist" aria-label="Режим просмотра">
      {indicator && (
        <div
          className="view-tabs__indicator"
          style={{ left: indicator.left, width: indicator.width }}
          aria-hidden
        />
      )}
      {tabs.map((tab, index) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            data-tab-id={tab.id}
            aria-selected={isActive}
            aria-controls="canvas-area-export"
            tabIndex={isActive ? 0 : -1}
            className={`view-tab${isActive ? ' view-tab--active' : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            <Icon size={16} aria-hidden />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
