import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CalendarProvider, CalendarStatus } from '../services/calendarSyncService';
import { calendarSyncService } from '../services/calendarSyncService';
import type { ChangePasswordData, UpdateProfileData } from '../services/userService';
import { userService } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Navbar from '../components/layout/Navbar';

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState<CalendarProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>({
    google: { connected: false },
    microsoft: { connected: false },
  });
  const [profileForm, setProfileForm] = useState<UpdateProfileData>({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
  });
  const [passwordForm, setPasswordForm] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedProvider = params.get('calendarConnected') as CalendarProvider | null;
    const errorProvider = params.get('calendarError') as CalendarProvider | null;

    if (!connectedProvider && !errorProvider) return;

    if (connectedProvider) {
      setSuccess('Calendario conectado correctamente');
    }
    if (errorProvider) {
      setError(params.get('message') || 'No se pudo conectar el calendario');
    }

    navigate('/profile', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const loadCalendars = async () => {
      setError(null);
      try {
        const status = await calendarSyncService.getConnectedCalendars();
        setCalendarStatus(status);
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message || 'Error al cargar calendarios';
        setError(message);
      }
    };

    loadCalendars();
  }, []);

  const handleProfileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProfileForm({
      ...profileForm,
      [event.target.name]: event.target.value,
    });
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [event.target.name]: event.target.value,
    });
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordForm.newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await userService.changePassword(passwordForm);
      setSuccess('Contrasena cambiada correctamente');
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cambiar contrasena';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Debes ingresar tu contrasena');
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

  const handleConnectCalendar = async (provider: CalendarProvider) => {
    setCalendarLoading(provider);
    setError(null);
    setSuccess(null);

    try {
      await calendarSyncService.connect(provider);
      const status = await calendarSyncService.getConnectedCalendars();
      setCalendarStatus(status);
      setSuccess('Calendario conectado correctamente');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ||
        (err as Error).message ||
        'Error al conectar calendario';
      setError(message);
    } finally {
      setCalendarLoading(null);
    }
  };

  const handleDisconnectCalendar = async (provider: CalendarProvider) => {
    setCalendarLoading(provider);
    setError(null);
    setSuccess(null);

    try {
      await calendarSyncService.disconnect(provider);
      const status = await calendarSyncService.getConnectedCalendars();
      setCalendarStatus(status);
      setSuccess('Calendario desconectado');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al desconectar calendario';
      setError(message);
    } finally {
      setCalendarLoading(null);
    }
  };

  const googleStatus = calendarStatus.google;

  return (
    <>
      <Navbar />
      <main className="amig-cosmic-canvas min-h-screen pb-28 pt-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
          <header className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase text-primary-700">
                Cuenta y seguridad
              </p>
              <h1 className="mt-2 text-4xl font-extrabold text-neutral-950 sm:text-5xl">
                User Profile
              </h1>
              <p className="mt-3 max-w-xl text-base text-neutral-700">
                Manage your identity, security, and connected apps.
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-pebble bg-white/75 p-4 shadow-soft backdrop-blur">
              <Avatar
                name={user?.fullName || user?.username || user?.email}
                size="xl"
                status="online"
              />
              <div>
                <p className="text-xl font-bold text-neutral-950">
                  {user?.fullName || user?.username || 'Usuario'}
                </p>
                <p className="text-sm text-neutral-600">{user?.email}</p>
              </div>
            </div>
          </header>

          {error && (
            <div className="rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-success-200 bg-success-50 p-4 text-sm font-medium text-success-700">
              {success}
            </div>
          )}

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <Card variant="glass" padding="xl">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase text-accent-700">
                      Personal Information
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold text-neutral-950">
                      Identidad publica
                    </h2>
                  </div>
                  <Badge variant="glass">Perfil</Badge>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <Input
                    label="Username"
                    type="text"
                    name="username"
                    value={profileForm.username}
                    onChange={handleProfileChange}
                    variant="glass"
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    variant="glass"
                    required
                  />
                  <Input
                    label="Nombre completo"
                    type="text"
                    name="fullName"
                    value={profileForm.fullName || ''}
                    onChange={handleProfileChange}
                    variant="glass"
                    placeholder="Tu nombre visible"
                  />
                  <div className="flex justify-end pt-2">
                    <Button type="submit" loading={isLoading}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>

              <Card variant="glass" padding="xl">
                <div className="mb-6">
                  <p className="text-sm font-bold uppercase text-warning-700">
                    Security
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-neutral-950">
                    Cambiar contrasena
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Usa al menos 6 caracteres.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    variant="glass"
                    required
                  />
                  <Input
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    variant="glass"
                    required
                  />
                  <Input
                    label="Confirmar nueva contrasena"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    variant="glass"
                    required
                  />
                  <Button type="submit" variant="secondary" loading={isLoading}>
                    Update Password
                  </Button>
                </form>
              </Card>
            </div>

            <aside className="space-y-6">
              <Card variant="glass" padding="lg">
                <div className="mb-5">
                  <p className="text-sm font-bold uppercase text-success-700">
                    Connected Calendars
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-neutral-950">
                    Calendarios
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 p-3 shadow-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 font-bold text-primary-700">
                        G
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-950">
                          Google Calendar
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {googleStatus.connected
                            ? googleStatus.email || 'Cuenta conectada'
                            : 'Desconectado'}
                        </p>
                      </div>
                    </div>
                    {googleStatus.connected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnectCalendar('google')}
                        loading={calendarLoading === 'google'}
                        className="text-danger-600 hover:bg-danger-50"
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConnectCalendar('google')}
                        loading={calendarLoading === 'google'}
                        className="text-primary-700"
                      >
                        Connect
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 p-3 shadow-sm opacity-75">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 font-bold text-accent-700">
                        O
                      </span>
                      <div>
                        <p className="font-bold text-neutral-950">Outlook</p>
                        <p className="text-xs text-neutral-500">Pausado</p>
                      </div>
                    </div>
                    <Badge variant="neutral">No disponible</Badge>
                  </div>
                </div>

                <p className="mt-4 text-sm text-neutral-600">
                  Syncing allows AmigOrganizador to automatically build your
                  availability from connected calendars.
                </p>
              </Card>

              <Card
                variant="glass"
                padding="lg"
                className="border border-danger-200 bg-danger-50/80"
              >
                <div className="mb-4">
                  <p className="text-sm font-bold uppercase text-danger-700">
                    Danger Zone
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-danger-700">
                    Delete Account
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">
                    Permanently delete your account and remove all associated
                    data, including linked calendars and group memberships.
                  </p>
                </div>

                {!showDeleteConfirm ? (
                  <Button
                    variant="danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Input
                      label="Confirma con tu contrasena"
                      type="password"
                      name="deletePassword"
                      value={deletePassword}
                      onChange={(event) => setDeletePassword(event.target.value)}
                      variant="glass"
                      required
                    />
                    <div className="grid gap-2">
                      <Button
                        variant="danger"
                        onClick={handleDeleteAccount}
                        disabled={isLoading || !deletePassword}
                        loading={isLoading}
                        fullWidth
                      >
                        Si, eliminar mi cuenta
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeletePassword('');
                          setError(null);
                        }}
                        disabled={isLoading}
                        fullWidth
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              <Card variant="glass" padding="lg">
                <p className="text-xs font-bold uppercase text-neutral-500">
                  Informacion de la cuenta
                </p>
                <div className="mt-3 space-y-2 text-sm text-neutral-600">
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
              </Card>
            </aside>
          </section>
        </div>
      </main>
    </>
  );
};

export default Profile;
