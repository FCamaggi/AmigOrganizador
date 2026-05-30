import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar, { AvatarGroup } from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Skeleton, { SkeletonText } from '../components/common/Skeleton';
import Navbar from '../components/layout/Navbar';
import { eventService, type Event } from '../services/eventService';
import { groupService, type Group } from '../services/groupService';
import { invitationService, type Invitation } from '../services/invitationService';
import { useAuthStore } from '../store/authStore';

const iconClassName = 'h-5 w-5';

const icons = {
  calendar: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h14v15H5z" />
    </svg>
  ),
  groups: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  ),
  plus: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  ),
  alert: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
};

const toDateInput = (date: Date) => date.toISOString().split('T')[0];

const formatDayBlock = (dateValue: string) => {
  const date = new Date(dateValue);
  return {
    month: date.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '').toUpperCase(),
    day: date.toLocaleDateString('es-CL', { day: '2-digit' }),
  };
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      const today = new Date();
      const future = new Date();
      future.setDate(today.getDate() + 45);

      const [groupsResult, invitationsResult, eventsResult] = await Promise.allSettled([
        groupService.getMyGroups(),
        invitationService.getMyInvitations(),
        eventService.getEvents(toDateInput(today), toDateInput(future)),
      ]);

      if (groupsResult.status === 'fulfilled') {
        setGroups(groupsResult.value);
      }
      if (invitationsResult.status === 'fulfilled') {
        setInvitations(invitationsResult.value.filter(invitation => invitation.status === 'pending' && !invitation.isExpired));
      }
      if (eventsResult.status === 'fulfilled') {
        setEvents(eventsResult.value);
      }

      const failed = [groupsResult, invitationsResult, eventsResult].some(result => result.status === 'rejected');
      if (failed) {
        setError('Algunos datos del dashboard no se pudieron cargar.');
      }

      setLoading(false);
    };

    loadDashboardData();
  }, []);

  const userName = user?.fullName || user?.username || 'Amig';
  const upcomingEvents = useMemo(
    () =>
      events
        .slice()
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3),
    [events]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-surface to-accent-50 pb-28 md:pb-8">
      <Navbar />

      <main className="mx-auto grid max-w-content grid-cols-1 gap-6 px-4 py-6 md:grid-cols-12 md:px-8">
        <section className="md:col-span-8">
          <Card variant="glass" padding="xl" className="relative overflow-hidden bg-white/80">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-primary-200/40 blur-2xl" />
            <div className="relative">
              <h1 className="text-4xl font-extrabold text-neutral-950 sm:text-5xl">
                Hola, {userName}!
              </h1>
              <p className="mt-4 text-lg text-neutral-700">
                Tienes {invitations.length} invitacion{invitations.length === 1 ? '' : 'es'} pendiente{invitations.length === 1 ? '' : 's'} para revisar.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/groups">
                  <Button variant="primary">Revisar invitaciones</Button>
                </Link>
                <Link to="/schedule">
                  <Button variant="secondary" icon={icons.calendar}>
                    Actualizar disponibilidad
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>

        <aside className="md:col-span-4">
          <Card variant="elevated" padding="lg">
            <div className="flex items-center gap-3">
              <Avatar name={userName} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-neutral-900">{userName}</p>
                <p className="truncate text-sm text-neutral-600">{user?.email}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-primary-50 p-3">
                <p className="text-xl font-extrabold text-primary-700">{groups.length}</p>
                <p className="text-xs font-semibold text-neutral-600">Grupos</p>
              </div>
              <div className="rounded-xl bg-warning-50 p-3">
                <p className="text-xl font-extrabold text-warning-700">{invitations.length}</p>
                <p className="text-xs font-semibold text-neutral-600">Invites</p>
              </div>
              <div className="rounded-xl bg-success-50 p-3">
                <p className="text-xl font-extrabold text-success-700">{upcomingEvents.length}</p>
                <p className="text-xs font-semibold text-neutral-600">Planes</p>
              </div>
            </div>
          </Card>
        </aside>

        <section className="space-y-6 md:col-span-8">
          <Card variant="glass" padding="lg" className="bg-white/75">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-extrabold text-neutral-950">Proximos planes</h2>
              <Link to="/calendar" className="text-sm font-bold text-primary-700 hover:text-accent-700">
                Ver todo
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" rounded="lg" />
                <Skeleton className="h-24 w-full" rounded="lg" />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(event => {
                  const dateBlock = formatDayBlock(event.startDate);
                  return (
                    <Link
                      key={event._id}
                      to="/calendar"
                      className="flex items-center gap-4 rounded-xl border border-surface-highest bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-luxury"
                    >
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-cosmic-action text-white shadow-soft">
                        <span className="text-xs font-bold">{dateBlock.month}</span>
                        <span className="amig-time-code text-lg font-bold leading-none">{dateBlock.day}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-extrabold text-neutral-950">{event.title}</h3>
                        <p className="truncate text-sm text-neutral-600">{event.category}</p>
                      </div>
                      <Badge variant="glass">{event.allDay ? 'Todo el dia' : `${event.timeSlots?.length || 0} bloques`}</Badge>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-primary-200 bg-white/70 p-6 text-center">
                <h3 className="text-lg font-bold text-neutral-900">Sin planes proximos</h3>
                <p className="mt-2 text-sm text-neutral-600">Agrega eventos al calendario para verlos aca.</p>
                <Link to="/calendar" className="mt-5 inline-flex">
                  <Button>Crear evento</Button>
                </Link>
              </div>
            )}
          </Card>

          {error && (
            <Card variant="soft" padding="md" className="border-warning-200 bg-warning-50 text-warning-900">
              <div className="flex items-center gap-3 text-sm font-semibold">
                {icons.alert}
                <span>{error}</span>
              </div>
            </Card>
          )}
        </section>

        <aside className="space-y-6 md:col-span-4">
          <Card variant="elevated" padding="lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-neutral-950">Grupos activos</h2>
              <Link to="/groups" className="text-sm font-bold text-primary-700 hover:text-accent-700">
                Ver
              </Link>
            </div>
            {loading ? (
              <SkeletonText lines={4} />
            ) : groups.length > 0 ? (
              <div className="space-y-2">
                {groups.slice(0, 4).map(group => (
                  <Link
                    key={group._id}
                    to={`/groups/${group._id}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-low"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-800">
                      {icons.groups}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-neutral-900">{group.name}</p>
                      <p className="text-xs text-neutral-600">{group.memberCount} miembros</p>
                    </div>
                    <AvatarGroup users={group.members.map(member => ({ name: member.user.fullName || member.user.username }))} max={2} size="xs" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-primary-200 bg-surface-low p-5 text-center">
                <h3 className="text-base font-bold text-neutral-900">Sin grupos aun</h3>
                <p className="mt-2 text-sm text-neutral-600">Crea o unite a un grupo para coordinar disponibilidad.</p>
                <Link to="/groups" className="mt-4 inline-flex">
                  <Button size="sm">Ir a grupos</Button>
                </Link>
              </div>
            )}
          </Card>

          <Card variant="glass" padding="lg" className="bg-white/80 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-700">
              {icons.calendar}
            </div>
            <h2 className="text-xl font-extrabold text-neutral-950">Actualiza disponibilidad</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Deja claro cuando puedes juntarte esta semana.
            </p>
            <Link to="/schedule" className="mt-5 block">
              <Button variant="outline" fullWidth>
                Actualizar ahora
              </Button>
            </Link>
          </Card>

          <Link
            to="/groups"
            className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cosmic-amber text-neutral-950 shadow-luxury transition-transform hover:scale-105 md:bottom-8 md:right-8"
            aria-label="Crear o unirse a un grupo"
          >
            {icons.plus}
          </Link>
        </aside>
      </main>
    </div>
  );
};

export default Dashboard;
