import { getCardClasses, cn } from '../../styles/design-system';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive' | 'gradient' | 'soft';
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
    'bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm hover:shadow transition-all duration-200';
  const cardClasses =
    variant === 'soft' ? softCardClasses : getCardClasses(variant);

  return (
    <Component
      onClick={onClick}
      className={cn(cardClasses, paddingClasses[padding], className)}
    >
      {children}
    </Component>
  );
};

export default Card;
