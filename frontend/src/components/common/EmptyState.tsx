import Button from './Button';
import Card from './Card';
import { cn } from '../../styles/design-system';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => (
  <Card variant="glass" padding="xl" className={cn('text-center', className)}>
    {icon && (
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/75 text-primary-700 shadow-soft">
        {icon}
      </div>
    )}
    <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
    {description && (
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">{description}</p>
    )}
    {actionLabel && onAction && (
      <Button onClick={onAction} className="mt-6">
        {actionLabel}
      </Button>
    )}
  </Card>
);

export default EmptyState;
