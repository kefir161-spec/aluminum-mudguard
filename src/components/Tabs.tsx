type Tab = { id: 'constructor' | 'drawing' | 'spec'; label: string };

const tabs: Tab[] = [
  { id: 'constructor', label: 'Конструктор' },
  { id: 'drawing', label: 'Чертёж' },
  { id: 'spec', label: 'Спецификация' },
];

type Props = {
  activeTab: Tab['id'];
  onChange: (tab: Tab['id']) => void;
};

export const Tabs = ({ activeTab, onChange }: Props) => (
  <div className="tabs">
    {tabs.map((tab) => (
      <button key={tab.id} className={activeTab === tab.id ? 'tab active' : 'tab'} onClick={() => onChange(tab.id)}>
        {tab.label}
      </button>
    ))}
  </div>
);
