import { Link } from 'react-router-dom';
import { cn } from '../../styles/design-system';

export interface NavItem {
  label: string;
  to: string;
  icon?: React.ReactNode;
  active?: boolean;
  endSlot?: React.ReactNode;
}

interface TopAppBarProps {
  brand: React.ReactNode;
  brandTo?: string;
  navItems?: NavItem[];
  actions?: React.ReactNode;
  mobileMenuButton?: React.ReactNode;
  mobileMenu?: React.ReactNode;
  isMobileMenuOpen?: boolean;
  className?: string;
}

const TopAppBar = ({
  brand,
  brandTo = '/dashboard',
  navItems = [],
  actions,
  mobileMenuButton,
  mobileMenu,
  isMobileMenuOpen = false,
  className,
}: TopAppBarProps) => (
  <header className={cn('sticky top-0 z-50 border-b border-white/50 bg-white/75 shadow-soft backdrop-blur-xl', className)}>
    <div className="mx-auto max-w-content px-3 py-3 sm:px-4 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <Link to={brandTo} className="min-w-0 shrink-0">
            {brand}
          </Link>
          {navItems.length > 0 && (
            <nav className="hidden items-center gap-2 md:flex" aria-label="Navegacion principal">
              {navItems.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-all duration-200',
                    item.active
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-neutral-600 hover:bg-white hover:text-primary-700'
                  )}
                  aria-current={item.active ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.endSlot}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">{actions}</div>
        <div className="md:hidden">{mobileMenuButton}</div>
      </div>

      {isMobileMenuOpen && mobileMenu && (
        <div className="mt-3 border-t border-white/60 pt-3 md:hidden">{mobileMenu}</div>
      )}
    </div>
  </header>
);

export default TopAppBar;
