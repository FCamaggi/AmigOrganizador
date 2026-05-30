import { getCardClasses, cn } from '../../styles/design-system';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive' | 'gradient' | 'soft' | 'glass' | 'highlight';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  onClick,
}: CardProps) => {
  const Component = onClick ? 'button' : 'div';

  // Manejar variante 'soft' manualmente
  const softCardClasses =
    'bg-surface-low border border-white/70 rounded-xl shadow-sm hover:shadow transition-all duration-200';
  const cardClasses =
    variant === 'soft' ? softCardClasses : getCardClasses(variant);

  return (
    <Component
      onClick={onClick}
      className={cn(
        cardClasses,
        paddingClasses[padding],
        onClick && 'text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className
      )}
    >
      {children}
    </Component>
  );
};

export default Card;
