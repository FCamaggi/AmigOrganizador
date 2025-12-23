import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { SlotInfo, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useScheduleStore } from '../../store/scheduleStore';
import type { DayAvailability } from '../../services/scheduleService';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Card from '../common/Card';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  resource: {
    day: number;
    slots: Array<{ start: string; end: string }>;
    note?: string;
  };
}

interface ScheduleCalendarProps {
  onSelectDay: (date: Date, availability?: DayAvailability) => void;
}

const ScheduleCalendar = ({ onSelectDay }: ScheduleCalendarProps) => {
  const { currentSchedule, loading, error, fetchSchedule, clearError, selectedDate } =
    useScheduleStore();
  const [currentDate, setCurrentDate] = useState(selectedDate);

  // Sincronizar con selectedDate del store (por ejemplo, cuando se importa un horario)
  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  const loadSchedule = useCallback(async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    try {
      await fetchSchedule(year, month);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  }, [currentDate, fetchSchedule]);

  const events = useMemo(() => {
    if (!currentSchedule) {
      return [];
    }

    return currentSchedule.availability.map((dayAvail) => {
      const date = new Date(
        currentSchedule.year,
        currentSchedule.month - 1,
        dayAvail.day
      );

      // Mostrar título del evento o las horas si no hay título
      const slotsText =
        dayAvail.slots.length > 0
          ? dayAvail.slots.map((s) => s.title || `${s.start}-${s.end}`).join(', ')
          : 'Libre';

      return {
        title: slotsText,
        start: date,
        end: date,
        resource: {
          day: dayAvail.day,
          slots: dayAvail.slots,
          note: dayAvail.note,
        },
      };
    });
  }, [currentSchedule]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const selectedDate = slotInfo.start;
    const day = selectedDate.getDate();

    const dayAvailability = currentSchedule?.availability.find(
      (a) => a.day === day
    );

    onSelectDay(selectedDate, dayAvailability);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const date = event.start;
    const dayAvailability = event.resource;
    onSelectDay(date, dayAvailability);
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const hasSlots = event.resource.slots.length > 0;
    const slotsCount = event.resource.slots.length;

    // Colores según cantidad de slots
    let backgroundColor = '#e5e7eb'; // gris (sin slots)
    let borderColor = '#d1d5db';
    let color = '#6b7280';

    if (hasSlots) {
      if (slotsCount === 1) {
        backgroundColor = '#93c5fd'; // azul claro
        borderColor = '#60a5fa';
        color = '#1e40af';
      } else if (slotsCount === 2) {
        backgroundColor = '#6366f1'; // índigo
        borderColor = '#4f46e5';
        color = 'white';
      } else {
        backgroundColor = '#8b5cf6'; // púrpura
        borderColor = '#7c3aed';
        color = 'white';
      }
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color,
        borderRadius: '8px',
        border: `2px solid ${borderColor}`,
        fontSize: '0.75rem',
        fontWeight: '600',
        padding: '4px 6px',
        textAlign: 'center' as const,
      },
    };
  };

  const CustomToolbar = (toolbar: ToolbarProps<CalendarEvent, object>) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = format(toolbar.date, 'MMMM yyyy', { locale: es });

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <Button onClick={goToToday} variant="outline" size="sm">
          📅 Hoy
        </Button>

        <h2 className="text-2xl font-bold text-neutral-800 capitalize flex items-center gap-2">
          {label}
        </h2>

        <div className="flex gap-2">
          <Button onClick={goToBack} variant="secondary" size="sm">
            ← Anterior
          </Button>
          <Button onClick={goToNext} variant="secondary" size="sm">
            Siguiente →
          </Button>
        </div>
      </div>
    );
  };

  // Componente personalizado para cada día
  const CustomDateCell = ({ value, children }: { value: Date; children: React.ReactNode }) => {
    const day = value.getDate();
    const dayAvail = currentSchedule?.availability.find((a) => a.day === day);
    const hasSchedule = dayAvail && dayAvail.slots.length > 0;

    return (
      <div className={`relative h-full ${hasSchedule ? 'bg-primary-50/30' : ''}`}>
        {children}
        {hasSchedule && (
          <div className="absolute top-1 right-1">
            <Badge variant="primary">
              {dayAvail.slots.length}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex flex-col justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
          <p className="text-neutral-600 font-medium">Cargando horario...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      {error && (
        <div className="mb-6 p-4 bg-danger-50 border-2 border-danger-200 text-danger-800 rounded-xl flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-danger-700 hover:text-danger-900 font-bold text-xl ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Leyenda */}
      <div className="mb-6 flex flex-wrap gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-neutral-200 border-2 border-neutral-300"></div>
          <span className="text-sm font-medium text-neutral-700">Sin horarios</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-300 border-2 border-blue-400"></div>
          <span className="text-sm font-medium text-neutral-700">1 horario</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-500 border-2 border-indigo-600"></div>
          <span className="text-sm font-medium text-neutral-700">2 horarios</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-purple-500 border-2 border-purple-600"></div>
          <span className="text-sm font-medium text-neutral-700">3+ horarios</span>
        </div>
      </div>

      <div className="calendar-container bg-white rounded-xl">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar,
            dateCellWrapper: CustomDateCell,
          }}
          views={['month']}
          defaultView="month"
          style={{ height: 650 }}
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
            noEventsInRange: '🗓️ Sin disponibilidad en este mes',
            showMore: (total: number) => `+ Ver ${total} más`,
          }}
        />
      </div>

      {/* Tip */}
      <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-primary-900 mb-1">💡 Consejo</p>
            <p className="text-sm text-primary-800">
              Haz clic en cualquier día para editar su horario. Los colores indican la cantidad de franjas horarias configuradas.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ScheduleCalendar;
