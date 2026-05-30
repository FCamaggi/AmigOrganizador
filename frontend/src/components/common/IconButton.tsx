import { forwardRef } from 'react';
import { cn } from '../../styles/design-system';
import LoadingSpinner from './LoadingSpinner';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses = {
  primary: 'bg-cosmic-action text-white shadow-luxury hover:brightness-105',
  secondary: 'bg-white text-neutral-800 border border-white/70 shadow-soft hover:shadow-luxury',
  ghost: 'bg-transparent text-neutral-700 hover:bg-white/70 hover:text-primary-700',
  danger: 'bg-danger-50 text-danger-700 hover:bg-danger-100',
  glass: 'bg-white/70 text-neutral-800 border border-white/60 shadow-soft backdrop-blur-md hover:bg-white',
};

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      label,
      variant = 'ghost',
      size = 'md',
      loading = false,
      disabled = false,
      className,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-label={label}
        title={label}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-xl transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...rest}
      >
        {loading ? <LoadingSpinner size="sm" /> : icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
