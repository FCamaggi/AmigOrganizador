import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import IconButton from '../common/IconButton';
import BottomNav from './BottomNav';
import TopAppBar, { type NavItem } from './TopAppBar';
import { cn } from '../../styles/design-system';

const iconClassName = 'h-5 w-5';

const icons = {
  home: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 11 9-8 9 8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10v10h14V10" />
    </svg>
  ),
  schedule: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h14v15H5z" />
    </svg>
  ),
  groups: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  bell: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  menu: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  ),
  exit: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  ),
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const isGroupsActive = location.pathname.startsWith('/groups');
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const userName = user?.fullName || user?.username || 'Usuario';

  const navItems: NavItem[] = [
    { label: 'Inicio', to: '/dashboard', icon: icons.home, active: isActive('/dashboard') },
    { label: 'Mi Horario', to: '/schedule', icon: icons.schedule, active: isActive('/schedule') },
    { label: 'Grupos', to: '/groups', icon: icons.groups, active: isGroupsActive },
  ];

  const mobileMenu = (
    <nav className="space-y-2" aria-label="Menu movil">
      {[...navItems, { label: userName, to: '/profile', active: isActive('/profile'), icon: <Avatar name={userName} size="xs" /> }].map(item => (
        <Link
          key={item.to}
          to={item.to}
          onClick={closeMobileMenu}
          className={cn(
            'flex min-h-11 items-center gap-3 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
            item.active ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-white'
          )}
          aria-current={item.active ? 'page' : undefined}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
      <button
        onClick={handleLogout}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2 text-left text-sm font-semibold text-danger-700 transition-all hover:bg-danger-50"
      >
        {icons.exit}
        <span>Cerrar sesion</span>
      </button>
    </nav>
  );

  return (
    <>
      <TopAppBar
        brand={
          <span className="block truncate text-lg font-extrabold text-transparent bg-clip-text bg-cosmic-action sm:text-2xl">
            AmigOrganizador
          </span>
        }
        navItems={navItems}
        actions={
          <>
            <Link
              to="/notifications"
              className={cn(
                'inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-neutral-700 transition-all hover:bg-white hover:text-primary-700',
                isActive('/notifications') && 'bg-primary-50 text-primary-700'
              )}
              aria-label="Notificaciones"
              aria-current={isActive('/notifications') ? 'page' : undefined}
            >
              {icons.bell}
            </Link>
            <Link
              to="/profile"
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-xl px-2 pr-3 text-sm font-semibold transition-all',
                isActive('/profile')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-700 hover:bg-white hover:text-primary-700'
              )}
              aria-current={isActive('/profile') ? 'page' : undefined}
            >
              <Avatar name={userName} size="sm" />
              <span className="max-w-40 truncate">{userName}</span>
            </Link>
            <Button onClick={handleLogout} variant="outline" size="sm" icon={icons.exit}>
              Salir
            </Button>
          </>
        }
        mobileMenuButton={
          <IconButton
            onClick={() => setIsMobileMenuOpen(current => !current)}
            variant="glass"
            label={isMobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            icon={isMobileMenuOpen ? icons.close : icons.menu}
          />
        }
        mobileMenu={mobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <BottomNav items={navItems} />
    </>
  );
};

export default Navbar;
