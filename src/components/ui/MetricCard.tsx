type Props = {
  label: string;
  value: string;
};

export const MetricCard = ({ label, value }: Props) => (
  <div className="ui-metric-card">
    <span className="ui-metric-card__label">{label}</span>
    <span className="ui-metric-card__value">{value}</span>
  </div>
);
