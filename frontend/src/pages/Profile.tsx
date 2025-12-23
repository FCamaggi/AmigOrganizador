import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/userService';
import type {
  UpdateProfileData,
  ChangePasswordData,
} from '../services/userService';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Navbar from '../components/layout/Navbar';

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'danger'>(
    'profile'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState<UpdateProfileData>({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete account
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username,
        email: user.email,
        fullName: user.fullName || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const updatedUser = await userService.updateProfile(profileForm);
      setUser(updatedUser);
      setSuccess('Perfil actualizado correctamente');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al actualizar perfil';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordForm.newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await userService.changePassword(passwordForm);
      setSuccess('Contraseña cambiada correctamente');
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cambiar contraseña';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Debes ingresar tu contraseña');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await userService.deleteAccount(deletePassword);
      logout();
      navigate('/login');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al eliminar cuenta';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent mb-2">
              Mi Perfil
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              Gestiona tu información personal y configuración de cuenta
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-4 sm:mb-6 border-b border-neutral-200 overflow-x-auto">
            <div className="flex gap-4 sm:gap-6 lg:gap-8 min-w-max">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setError(null);
                  setSuccess(null);
                }}
                className={`pb-2 sm:pb-3 px-1 sm:px-2 text-sm sm:text-base font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'text-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Información Personal
                {activeTab === 'profile' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-500" />
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('password');
                  setError(null);
                  setSuccess(null);
                }}
                className={`pb-2 sm:pb-3 px-1 sm:px-2 text-sm sm:text-base font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'password'
                    ? 'text-primary-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Seguridad
                {activeTab === 'password' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent-500" />
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('danger');
                  setError(null);
                  setSuccess(null);
                }}
                className={`pb-2 sm:pb-3 px-1 sm:px-2 text-sm sm:text-base font-semibold transition-colors relative whitespace-nowrap ${
                  activeTab === 'danger'
                    ? 'text-red-600'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Zona Peligrosa
                {activeTab === 'danger' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
                )}
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-sm sm:text-base text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl text-sm sm:text-base text-green-700">
              {success}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-800 mb-4 sm:mb-6">
                Actualizar Información Personal
              </h2>
              <form onSubmit={handleProfileSubmit} className="space-y-3 sm:space-y-4">
                <Input
                  label="Nombre de usuario"
                  type="text"
                  name="username"
                  value={profileForm.username}
                  onChange={handleProfileChange}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  required
                />
                <Input
                  label="Nombre completo (opcional)"
                  type="text"
                  name="fullName"
                  value={profileForm.fullName || ''}
                  onChange={handleProfileChange}
                />
                <div className="pt-2 sm:pt-4">
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-800 mb-2">
                Cambiar Contraseña
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mb-4 sm:mb-6">
                La contraseña debe tener al menos 6 caracteres
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-3 sm:space-y-4">
                <Input
                  label="Contraseña actual"
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <Input
                  label="Nueva contraseña"
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <Input
                  label="Confirmar nueva contraseña"
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <div className="pt-2 sm:pt-4">
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft p-4 sm:p-6 lg:p-8 border-2 border-red-200">
              <h2 className="text-lg sm:text-xl font-bold text-red-700 mb-2">
                Eliminar Cuenta
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mb-4 sm:mb-6">
                Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor,
                ten cuidado.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100 w-full sm:w-auto"
                >
                  Eliminar mi cuenta
                </Button>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-red-50 rounded-xl">
                    <h3 className="text-sm sm:text-base font-semibold text-red-900 mb-2">
                      ⚠️ ¿Estás absolutamente seguro?
                    </h3>
                    <p className="text-xs sm:text-sm text-red-700">
                      Esta acción no se puede deshacer. Esto eliminará
                      permanentemente tu cuenta y todos tus datos asociados.
                    </p>
                  </div>
                  <Input
                    label="Ingresa tu contraseña para confirmar"
                    type="password"
                    name="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Tu contraseña"
                    required
                  />
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={isLoading || !deletePassword}
                      className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                    >
                      {isLoading ? 'Eliminando...' : 'Sí, eliminar mi cuenta'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword('');
                        setError(null);
                      }}
                      disabled={isLoading}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Info */}
          <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-soft">
            <h3 className="text-sm sm:text-base font-semibold text-neutral-700 mb-2 sm:mb-3">
              Información de la cuenta:
            </h3>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-neutral-600">
              <p className="break-all">
                <strong>ID:</strong> {user?._id}
              </p>
              <p>
                <strong>Miembro desde:</strong>{' '}
                {new Date(user?.createdAt || '').toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
