import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';
import EventModal from '../components/events/EventModal';
import Navbar from '../components/layout/Navbar';
import type { Event } from '../services/eventService';
import { useEventStore } from '../store/eventStore';

moment.updateLocale('es', {
  months:
    'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split(
      '_'
    ),
  monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miercoles_Jueves_Viernes_Sabado'.split('_'),
  weekdaysShort: 'Dom_Lun_Mar_Mie_Jue_Vie_Sab'.split('_'),
  weekdaysMin: 'Do_Lu_Ma_Mi_Ju_Vi_Sa'.split('_'),
});

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  category?: string;
  color?: string;
}

const iconClassName = 'h-5 w-5';

const icons = {
  plus: (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  ),
  prev: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
    </svg>
  ),
  next: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
    </svg>
  ),
  calendar: (
    <svg className={iconClassName} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4M16 2v4M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h14v15H5z" />
    </svg>
  ),
};

const getEventTimeLabel = (event: Event) => {
  if (event.allDay) return 'Todo el dia';
  const firstSlot = event.timeSlots?.[0];
  if (!firstSlot) {
    return `${moment(event.startDate).format('D MMM')} - ${moment(event.endDate).format('D MMM')}`;
  }
  return `${moment(event.startDate).format('D MMM')} · ${firstSlot.start} - ${firstSlot.end}`;
};

const MonthlyCalendar = () => {
  const { events, fetchEvents, loading, error, clearError } = useEventStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadEvents = useCallback(async () => {
    try {
      const startOfMonth = moment(currentDate)
        .startOf('month')
        .format('YYYY-MM-DD');
      const endOfMonth = moment(currentDate)
        .endOf('month')
        .format('YYYY-MM-DD');
      await fetchEvents(startOfMonth, endOfMonth);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }, [currentDate, fetchEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSelectSlot = ({ start }: { start: Date; end: Date }) => {
    setSelectedDate(start);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleCreateEvent = () => {
    setSelectedDate(currentDate);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const fullEvent = events.find((storedEvent) => storedEvent._id === event.id);
    setSelectedEvent(fullEvent || null);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    loadEvents();
  };

  const calendarEvents: CalendarEvent[] = useMemo(
    () =>
      events.map((event) => ({
        id: event._id,
        title: event.title,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        description: event.description,
        category: event.category,
        color: event.color,
      })),
    [events]
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .slice()
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 5),
    [events]
  );

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.color || '#4648d4',
      borderRadius: '999px',
      opacity: 0.92,
      color: 'white',
      border: '0px',
      display: 'block',
      fontSize: '0.75rem',
      fontWeight: 700,
      padding: '4px 8px',
      boxShadow: '0 6px 16px -10px rgba(70,72,212,0.8)',
    },
  });

  const DayCell = ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: Date;
  }) => {
    const dayEvents = calendarEvents.filter((event) =>
      moment(event.start).isSame(value, 'day')
    );
    const isWeekend = moment(value).day() === 0 || moment(value).day() === 6;

    return (
      <div className={isWeekend ? 'bg-primary-50/40' : ''}>
        {children}
        {dayEvents.length > 3 && (
          <div className="px-2 py-1">
            <Badge variant="glass">+{dayEvents.length - 3} mas</Badge>
          </div>
        )}
      </div>
    );
  };

  const monthTitle = moment(currentDate).format('MMMM YYYY');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-surface to-accent-50 pb-28 md:pb-8">
      <Navbar />

      <main className="mx-auto max-w-editor space-y-8 px-4 py-6 md:px-8">
        <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-neutral-950 md:text-5xl">
              Calendario de eventos
            </h1>
            <p className="mt-3 text-xl capitalize text-neutral-700">{monthTitle}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() => setCurrentDate(moment(currentDate).subtract(1, 'month').toDate())}
              icon={icons.prev}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCurrentDate(moment(currentDate).add(1, 'month').toDate())}
              icon={icons.next}
              iconPosition="right"
            >
              Siguiente
            </Button>
            <Button variant="primary" onClick={handleCreateEvent} icon={icons.plus}>
              Nuevo evento
            </Button>
          </div>
        </section>

        <Card variant="glass" padding="lg" className="bg-white/80">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(['month', 'week', 'day'] as const).map((viewOption) => (
                <Button
                  key={viewOption}
                  variant={view === viewOption ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setView(viewOption)}
                >
                  {viewOption === 'month' ? 'Mes' : viewOption === 'week' ? 'Semana' : 'Dia'}
                </Button>
              ))}
            </div>
            <Badge variant="glass">{events.length} eventos este mes</Badge>
          </div>

          {error && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-medium text-danger-700">
              <span>{error}</span>
              <button onClick={clearError} className="font-bold text-danger-800">
                Cerrar
              </button>
            </div>
          )}

          <div
            className="calendar-container rounded-pebble bg-white/95 shadow-luxury"
            style={{ height: view === 'month' ? '560px' : view === 'week' ? '500px' : '460px' }}
          >
            {loading ? (
              <div className="p-4">
                <Skeleton className="h-[500px] w-full" rounded="lg" />
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                selectable
                view={view}
                onView={(newView) => setView(newView as 'month' | 'week' | 'day')}
                date={currentDate}
                onNavigate={setCurrentDate}
                eventPropGetter={eventStyleGetter}
                components={{
                  dateCellWrapper: DayCell,
                }}
                messages={{
                  next: 'Siguiente',
                  previous: 'Anterior',
                  today: 'Hoy',
                  month: 'Mes',
                  week: 'Semana',
                  day: 'Dia',
                  agenda: 'Agenda',
                  date: 'Fecha',
                  time: 'Hora',
                  event: 'Evento',
                  noEventsInRange: 'No hay eventos en este rango.',
                  showMore: (total) => `+${total} mas`,
                }}
              />
            )}
          </div>
        </Card>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl font-extrabold text-neutral-950">
              Proximos eventos personales
            </h2>
            <Badge variant="primary">{upcomingEvents.length}</Badge>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-32 w-full" rounded="lg" />
              <Skeleton className="h-32 w-full" rounded="lg" />
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingEvents.map((event) => (
                <button
                  key={event._id}
                  onClick={() => {
                    setSelectedEvent(event);
                    setSelectedDate(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-start gap-4 rounded-pebble border border-white/70 bg-white p-5 text-left shadow-luxury transition-all hover:-translate-y-1 hover:shadow-cosmic"
                >
                  <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-soft"
                    style={{ backgroundColor: event.color || '#4648d4' }}
                  >
                    {icons.calendar}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-extrabold text-neutral-950">
                      {event.title}
                    </span>
                    <span className="amig-time-code mt-1 block text-sm text-neutral-600">
                      {getEventTimeLabel(event)}
                    </span>
                    <span className="mt-3 inline-flex">
                      <Badge variant="neutral">{event.category}</Badge>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin eventos este mes"
              description="Crea un evento personal o de grupo para verlo en tu calendario."
              actionLabel="Crear evento"
              onAction={handleCreateEvent}
            />
          )}
        </section>
      </main>

      <button
        onClick={handleCreateEvent}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cosmic-amber to-orange-600 text-white shadow-luxury transition-transform hover:scale-105 md:bottom-8 md:right-8"
        aria-label="Crear nuevo evento"
      >
        {icons.plus}
      </button>

      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialDate={selectedDate || undefined}
          eventToEdit={selectedEvent}
        />
      )}
    </div>
  );
};

export default MonthlyCalendar;
