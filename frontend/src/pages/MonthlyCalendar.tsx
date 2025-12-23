import { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useEventStore } from '../store/eventStore';
import type { Event } from '../services/eventService';
import EventModal from '../components/events/EventModal';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

// Configurar moment en español manualmente
moment.updateLocale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  monthsShort: 'Ene_Feb_Mar_Abr_May_Jun_Jul_Ago_Sep_Oct_Nov_Dic'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miércoles_Jueves_Viernes_Sábado'.split('_'),
  weekdaysShort: 'Dom_Lun_Mar_Mié_Jue_Vie_Sáb'.split('_'),
  weekdaysMin: 'Do_Lu_Ma_Mi_Ju_Vi_Sá'.split('_')
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

const MonthlyCalendar = () => {
  const { events, fetchEvents } = useEventStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadEvents = useCallback(async () => {
    try {
      const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD');
      const endOfMonth = moment(currentDate).endOf('month').format('YYYY-MM-DD');
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

  const handleSelectEvent = (event: CalendarEvent) => {
    // Buscar el evento completo en el store
    const fullEvent = events.find((e) => e._id === event.id);
    setSelectedEvent(fullEvent || null);
    setSelectedDate(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    // Recargar eventos después de cerrar el modal
    loadEvents();
  };

  // Convertir eventos del store a formato de calendario
  const calendarEvents: CalendarEvent[] = events.map((event) => ({
    id: event._id,
    title: event.title,
    start: new Date(event.startDate),
    end: new Date(event.endDate),
    description: event.description,
    category: event.category,
    color: event.color,
  }));

  const eventStyleGetter = (event: CalendarEvent) => {
    const eventDate = moment(event.start);
    const isWeekend = eventDate.day() === 0 || eventDate.day() === 6;

    return {
      style: {
        backgroundColor: event.color || (isWeekend ? '#9333ea' : '#3b82f6'),
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.875rem',
        padding: '4px 8px',
      },
    };
  };

  const DayCell = ({ children, value }: { children: React.ReactNode; value: Date }) => {
    const dayEvents = calendarEvents.filter((event) =>
      moment(event.start).isSame(value, 'day')
    );

    const isWeekend = moment(value).day() === 0 || moment(value).day() === 6;

    return (
      <div className={isWeekend ? 'bg-purple-50' : ''}>
        {children}
        {dayEvents.length > 3 && (
          <div className="px-2 py-1">
            <Badge variant="neutral">
              +{dayEvents.length - 3} más
            </Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card variant="default" padding="lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Calendario de Eventos
            </h1>
            <p className="text-neutral-600 mt-1">
              Vista completa de eventos de tus grupos
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={view === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Mes
            </Button>
            <Button
              variant={view === 'week' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Semana
            </Button>
            <Button
              variant={view === 'day' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
            >
              Día
            </Button>
          </div>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          style={{ height: '600px' }}
        >
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
              day: 'Día',
              agenda: 'Agenda',
              date: 'Fecha',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'No hay eventos en este rango.',
              showMore: (total) => `+${total} más`,
            }}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default" padding="md">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Eventos entre semana
                </p>
                <p className="text-xs text-neutral-600">Lunes a Viernes</p>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-purple-600"></div>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Eventos de fin de semana
                </p>
                <p className="text-xs text-neutral-600">Sábados y Domingos</p>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center gap-3">
              <Badge variant="primary">{events.length}</Badge>
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Total de eventos
                </p>
                <p className="text-xs text-neutral-600">Este mes</p>
              </div>
            </div>
          </Card>
        </div>
      </Card>

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
