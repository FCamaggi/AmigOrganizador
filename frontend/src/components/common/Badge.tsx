import { getBadgeClasses, cn } from '../../styles/design-system';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
  icon?: React.ReactNode;
}

const Badge = ({
  children,
  variant = 'neutral',
  className,
  icon,
}: BadgeProps) => {
  return (
    <span className={cn(getBadgeClasses(variant), className)}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
