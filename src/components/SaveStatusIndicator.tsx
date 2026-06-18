import { StatusBadge } from './ui/StatusBadge';

type Props = {
  isDirty: boolean;
  savedLabel?: string;
};

export const SaveStatusIndicator = ({ isDirty, savedLabel = 'Сохранено' }: Props) => (
  <div className="app-save-status" aria-live="polite">
    <StatusBadge tone={isDirty ? 'warning' : 'success'}>
      {isDirty ? 'Есть изменения' : savedLabel}
    </StatusBadge>
  </div>
);
