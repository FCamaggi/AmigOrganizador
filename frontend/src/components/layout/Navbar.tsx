import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import Button from '../common/Button';

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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="bg-white shadow-soft border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link to="/dashboard" onClick={closeMobileMenu}>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                AmigOrganizador
              </h1>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link
                to="/dashboard"
                className={`text-sm font-semibold transition-colors ${
                  isActive('/dashboard')
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-primary-600'
                }`}
              >
                Inicio
              </Link>
              <Link
                to="/schedule"
                className={`text-sm font-semibold transition-colors ${
                  isActive('/schedule')
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-primary-600'
                }`}
              >
                Mi Horario
              </Link>
              <Link
                to="/groups"
                className={`text-sm font-semibold transition-colors ${
                  location.pathname.startsWith('/groups')
                    ? 'text-primary-600'
                    : 'text-neutral-600 hover:text-primary-600'
                }`}
              >
                Grupos
              </Link>
            </nav>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/profile"
              className={`text-sm font-semibold transition-colors ${
                isActive('/profile')
                  ? 'text-primary-600'
                  : 'text-neutral-600 hover:text-primary-600'
              }`}
            >
              {user?.fullName || user?.username}
            </Link>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Salir
            </Button>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
            aria-label="Menú"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-2 border-t border-neutral-200 pt-4 space-y-2">
            <Link
              to="/dashboard"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/dashboard')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              🏠 Inicio
            </Link>
            <Link
              to="/schedule"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/schedule')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              📅 Mi Horario
            </Link>
            <Link
              to="/groups"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                location.pathname.startsWith('/groups')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              👥 Grupos
            </Link>
            <Link
              to="/profile"
              onClick={closeMobileMenu}
              className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/profile')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              👤 {user?.fullName || user?.username}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg text-sm font-semibold text-danger-600 hover:bg-danger-50 transition-colors"
            >
              🚪 Cerrar sesión
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
