import { Link } from 'react-router-dom';
import { cn } from '../../styles/design-system';
import type { NavItem } from './TopAppBar';

interface BottomNavProps {
  items: NavItem[];
  className?: string;
}

const BottomNav = ({ items, className }: BottomNavProps) => (
  <nav
    className={cn(
      'fixed inset-x-3 bottom-3 z-40 rounded-pebble border border-white/60 bg-white/85 p-2 shadow-cosmic backdrop-blur-xl md:hidden',
      className
    )}
    aria-label="Navegacion inferior"
  >
    <div
      className={cn(
        'grid gap-1',
        items.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'
      )}
    >
      {items.slice(0, 4).map(item => (
        <Link
          key={item.to}
          to={item.to}
          aria-label={item.label}
          className={cn(
            'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[0.7rem] font-bold transition-all duration-200',
            item.active
              ? 'bg-cosmic-action text-white shadow-soft'
              : 'text-neutral-600 hover:bg-white hover:text-primary-700'
          )}
          aria-current={item.active ? 'page' : undefined}
        >
          <span className="text-base" aria-hidden="true">
            {item.icon}
          </span>
          <span className="max-w-full truncate">{item.label}</span>
        </Link>
      ))}
    </div>
  </nav>
);

export default BottomNav;
