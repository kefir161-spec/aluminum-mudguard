import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export const SectionHeader = ({ title, subtitle, action }: Props) => (
  <div className="ui-section-header">
    <div className="ui-section-header__text">
      <h2 className="ui-section-header__title">{title}</h2>
      {subtitle && <p className="ui-section-header__subtitle">{subtitle}</p>}
    </div>
    {action}
  </div>
);
