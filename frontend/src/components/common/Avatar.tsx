import { cn } from '../../styles/design-system';

export interface AvatarProps {
  name?: string | null;
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'busy' | 'away' | 'offline';
  className?: string;
}

const sizeClasses = {
  xs: 'h-7 w-7 text-[0.65rem]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

const statusClasses = {
  online: 'bg-success-500',
  busy: 'bg-danger-500',
  away: 'bg-warning-500',
  offline: 'bg-neutral-300',
};

const getInitials = (name?: string | null) => {
  if (!name?.trim()) return 'A';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(part => part[0]?.toUpperCase()).join('');
};

const Avatar = ({
  name,
  src,
  alt,
  size = 'md',
  status,
  className,
}: AvatarProps) => {
  const label = alt || name || 'Usuario';

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center overflow-hidden rounded-full border border-white/70',
          'bg-cosmic-action font-bold text-white shadow-soft',
          sizeClasses[size]
        )}
      >
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true">{getInitials(name)}</span>
        )}
      </span>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
            statusClasses[status]
          )}
          aria-label={`Estado ${status}`}
        />
      )}
    </span>
  );
};

export interface AvatarGroupProps {
  users: Array<{ name?: string | null; src?: string | null; alt?: string }>;
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

export const AvatarGroup = ({
  users,
  max = 4,
  size = 'sm',
  className,
}: AvatarGroupProps) => {
  const visibleUsers = users.slice(0, max);
  const extraCount = Math.max(users.length - max, 0);

  return (
    <div className={cn('flex items-center -space-x-2', className)} aria-label={`${users.length} usuarios`}>
      {visibleUsers.map((user, index) => (
        <Avatar
          key={`${user.name || 'usuario'}-${index}`}
          name={user.name}
          src={user.src}
          alt={user.alt}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {extraCount > 0 && (
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-white/70 bg-white px-2 text-xs font-bold text-neutral-700 shadow-soft ring-2 ring-white">
          +{extraCount}
        </span>
      )}
    </div>
  );
};

export default Avatar;
