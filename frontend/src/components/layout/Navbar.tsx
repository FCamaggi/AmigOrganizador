import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Button from '../common/Button';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-soft border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/dashboard">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
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
          <div className="flex items-center gap-4">
            <Link
              to="/profile"
              className={`text-sm font-semibold transition-colors ${
                isActive('/profile')
                  ? 'text-primary-600'
                  : 'text-neutral-600 hover:text-primary-600'
              }`}
            >
              <span className="hidden sm:inline">
                {user?.fullName || user?.username}
              </span>
              <span className="sm:hidden">Perfil</span>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-sm"
            >
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
