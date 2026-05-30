import { useEffect, useMemo, useState } from 'react';
import { addDays, format, isAfter, isBefore } from 'date-fns';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Navbar from '../components/layout/Navbar';
import { eventService, type Event } from '../services/eventService';
import { useGroupStore } from '../store/groupStore';

const Notifications = () => {
  const {
    invitations,
    fetchMyInvitations,
    acceptInvitation,
    rejectInvitation,
  } = useGroupStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        await fetchMyInvitations();
        const today = new Date();
        const upcomingEvents = await eventService.getEvents(
          format(today, 'yyyy-MM-dd'),
          format(addDays(today, 14), 'yyyy-MM-dd')
        );
        setEvents(upcomingEvents);
      } catch (err) {
        console.error(err);
        setError('No pudimos cargar todas las notificaciones.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [fetchMyInvitations]);

  const notifications = useMemo(() => {
    const invitationItems = invitations
      .filter((invitation) => invitation.status === 'pending')
      .map((invitation) => ({
        id: `invitation-${invitation._id}`,
        type: 'invitation' as const,
        title: `${invitation.invitedBy.fullName || invitation.invitedBy.username} te invito`,
        description: `Te invitaron a "${invitation.group.name}".`,
        time: 'Pendiente',
        accent: 'primary',
        invitation,
      }));

    const eventItems = events
      .filter((event) => {
        const start = new Date(`${event.startDate}T${event.timeSlots[0]?.start || '12:00'}:00`);
        return isAfter(start, new Date()) && isBefore(start, addDays(new Date(), 14));
      })
      .slice(0, 5)
      .map((event) => ({
        id: `event-${event._id}`,
        type: 'event' as const,
        title: `${event.title} empieza pronto`,
        description:
          event.description || `Agendado para ${format(new Date(`${event.startDate}T12:00:00`), 'dd/MM')}.`,
        time: event.timeSlots[0]?.start || 'Todo el dia',
        accent: 'danger',
        event,
      }));

    return [...invitationItems, ...eventItems].filter(
      (notification) => !hiddenIds.has(notification.id)
    );
  }, [events, hiddenIds, invitations]);

  const todayNotifications = notifications.slice(0, Math.ceil(notifications.length / 2));
  const olderNotifications = notifications.slice(todayNotifications.length);

  const hide = (id: string) =>
    setHiddenIds((current) => new Set([...Array.from(current), id]));

  const clearAll = () => setHiddenIds(new Set(notifications.map((item) => item.id)));

  const renderNotification = (notification: (typeof notifications)[number]) => (
    <Card
      key={notification.id}
      variant="glass"
      padding="lg"
      className={`border-l-4 ${
        notification.accent === 'danger' ? 'border-l-danger-500' : 'border-l-primary-600'
      }`}
    >
      <div className="grid gap-4 sm:grid-cols-[64px_1fr_auto] sm:items-start">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            notification.accent === 'danger'
              ? 'bg-danger-100 text-danger-600'
              : 'bg-primary-100 text-primary-700'
          }`}
          aria-hidden="true"
        >
          {notification.type === 'invitation' ? (
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
            </svg>
          ) : (
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h14v15H5z" />
            </svg>
          )}
        </div>

        <div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-xl font-extrabold text-neutral-950">
              {notification.title}
            </h2>
            <span className="amig-time-code text-sm font-bold text-primary-700">
              {notification.time}
            </span>
          </div>
          <p className="mt-2 text-base leading-7 text-neutral-700">
            {notification.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {notification.type === 'invitation' ? (
              <>
                <Button
                  size="sm"
                  onClick={async () => {
                    await acceptInvitation(notification.invitation._id);
                    hide(notification.id);
                  }}
                >
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await rejectInvitation(notification.invitation._id);
                    hide(notification.id);
                  }}
                >
                  Declinar
                </Button>
              </>
            ) : (
              <Link to="/calendar">
                <Button size="sm" variant="secondary">
                  Details
                </Button>
              </Link>
            )}
            <Button size="sm" variant="ghost" onClick={() => hide(notification.id)}>
              Ocultar
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <Navbar />
      <main className="amig-cosmic-canvas min-h-screen pb-28 pt-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-7 px-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase text-primary-700">
                Centro
              </p>
              <h1 className="mt-1 text-4xl font-extrabold text-transparent bg-clip-text bg-cosmic-action sm:text-5xl">
                Notifications
              </h1>
            </div>
            <Button variant="ghost" onClick={clearAll} disabled={notifications.length === 0}>
              Clear All
            </Button>
          </header>

          {error && (
            <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4 text-sm font-medium text-warning-800">
              {error}
            </div>
          )}

          {isLoading ? (
            <Card variant="glass" padding="xl">
              <p className="text-neutral-600">Cargando notificaciones...</p>
            </Card>
          ) : notifications.length === 0 ? (
            <EmptyState
              title="No hay notificaciones"
              description="Invitaciones, nudges y eventos proximos apareceran aqui."
            />
          ) : (
            <>
              <section aria-labelledby="today-notifications" className="space-y-4">
                <h2 id="today-notifications" className="text-3xl font-extrabold text-neutral-800">
                  Today
                </h2>
                {todayNotifications.map(renderNotification)}
              </section>

              {olderNotifications.length > 0 && (
                <section aria-labelledby="older-notifications" className="space-y-4">
                  <h2 id="older-notifications" className="text-3xl font-extrabold text-neutral-800">
                    Yesterday
                  </h2>
                  {olderNotifications.map(renderNotification)}
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default Notifications;
