import { cn } from '../../styles/design-system';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const roundedClasses = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

const Skeleton = ({ className, rounded = 'md' }: SkeletonProps) => (
  <span
    className={cn(
      'block animate-pulse bg-gradient-to-r from-white/70 via-neutral-100 to-white/70',
      roundedClasses[rounded],
      className
    )}
    aria-hidden="true"
  />
);

export const SkeletonText = ({ lines = 3, className }: { lines?: number; className?: string }) => (
  <div className={cn('space-y-2', className)} aria-hidden="true">
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}
      />
    ))}
  </div>
);

export default Skeleton;
