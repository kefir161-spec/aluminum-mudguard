import type { ReactNode } from 'react';

type Props = {
  text: string;
  children: ReactNode;
};

export const Tooltip = ({ text, children }: Props) => (
  <span className="ui-tooltip-wrap">
    {children}
    <span className="ui-tooltip" role="tooltip">
      {text}
    </span>
  </span>
);
