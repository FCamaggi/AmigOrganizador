import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/layout/Navbar';

const Dashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="card">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3 sm:mb-4">
            ¡Bienvenido a AmigOrganizador! 🎉
          </h2>

          <div className="space-y-3 sm:space-y-4 text-neutral-700 text-sm sm:text-base">
            <p>
              Has iniciado sesión exitosamente. Esta es tu página de inicio
              donde próximamente podrás:
            </p>

            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 ml-2 sm:ml-4">
              <li>Gestionar tus horarios mensuales</li>
              <li>Ver y administrar tus grupos de amigos</li>
              <li>Visualizar disponibilidad grupal</li>
              <li>Recibir notificaciones importantes</li>
            </ul>

            <div className="mt-4 sm:mt-6">
              <h3 className="font-semibold text-neutral-900 mb-3 sm:mb-4">
                Acciones rápidas:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <Link
                  to="/schedule"
                  className="block p-4 sm:p-6 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📅</div>
                  <h4 className="text-lg sm:text-xl font-semibold mb-1">
                    Mi Horario
                  </h4>
                  <p className="text-primary-100 text-xs sm:text-sm">
                    Gestiona tu disponibilidad mensual
                  </p>
                </Link>

                <Link
                  to="/groups"
                  className="block p-4 sm:p-6 bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">👥</div>
                  <h4 className="text-lg sm:text-xl font-semibold mb-1">
                    Mis Grupos
                  </h4>
                  <p className="text-accent-100 text-xs sm:text-sm">
                    Organiza horarios con tus amigos
                  </p>
                </Link>

                <Link
                  to="/profile"
                  className="block p-4 sm:p-6 bg-gradient-to-br from-neutral-600 to-neutral-700 text-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">⚙️</div>
                  <h4 className="text-lg sm:text-xl font-semibold mb-1">
                    Mi Perfil
                  </h4>
                  <p className="text-neutral-200 text-xs sm:text-sm">
                    Configuración y preferencias
                  </p>
                </Link>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-200 rounded-xl sm:rounded-2xl">
              <h3 className="font-semibold text-primary-900 mb-2 sm:mb-3 text-sm sm:text-base">
                Información de tu cuenta:
              </h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Username:</strong> {user?.username}
                </p>
                {user?.fullName && (
                  <p>
                    <strong>Nombre:</strong> {user.fullName}
                  </p>
                )}
                <p>
                  <strong>Miembro desde:</strong>{' '}
                  {new Date(user?.createdAt || Date.now()).toLocaleDateString(
                    'es-ES'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
