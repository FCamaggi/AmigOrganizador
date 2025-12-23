import { useState, useEffect, useMemo } from 'react';
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
    slots: Array<{
      start: string;
      end: string;
      title?: string;
      color?: string;
    }>;
    note?: string;
    color?: string;
    isMoreIndicator?: boolean;
  };
}

interface ScheduleCalendarProps {
  onSelectDay: (date: Date, availability?: DayAvailability) => void;
}

const ScheduleCalendar = ({ onSelectDay }: ScheduleCalendarProps) => {
  const {
    currentSchedule,
    loading,
    error,
    clearError,
    selectedDate,
    setSelectedDate,
  } = useScheduleStore();
  const [currentDate, setCurrentDate] = useState(selectedDate);

  // Sincronizar con selectedDate del store (por ejemplo, cuando se importa un horario)
  useEffect(() => {
    setCurrentDate(selectedDate);
  }, [selectedDate]);

  // Cargar horario inicial
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    // Solo cargar si el store no tiene el mes correcto cargado
    if (
      !currentSchedule ||
      currentSchedule.year !== year ||
      currentSchedule.month !== month
    ) {
      setSelectedDate(currentDate);
    }
  }, []);

  const events = useMemo(() => {
    if (!currentSchedule) {
      return [];
    }

    // Crear un evento separado por cada slot
    const allEvents: CalendarEvent[] = [];

    currentSchedule.availability.forEach((dayAvail) => {
      const date = new Date(
        currentSchedule.year,
        currentSchedule.month - 1,
        dayAvail.day
      );

      if (dayAvail.slots.length > 0) {
        // Mostrar solo los primeros 3 eventos
        const visibleSlots = dayAvail.slots.slice(0, 3);
        const remainingCount = dayAvail.slots.length - 3;

        visibleSlots.forEach((slot) => {
          allEvents.push({
            title: slot.title || `${slot.start}-${slot.end}`,
            start: date,
            end: date,
            resource: {
              day: dayAvail.day,
              slots: dayAvail.slots,
              note: dayAvail.note,
              color: slot.color,
            },
          });
        });

        // Agregar evento "+X más" si hay más de 3 slots
        if (remainingCount > 0) {
          allEvents.push({
            title: `+${remainingCount} más`,
            start: date,
            end: date,
            resource: {
              day: dayAvail.day,
              slots: dayAvail.slots,
              note: dayAvail.note,
              isMoreIndicator: true,
            },
          });
        }
      }
    });

    return allEvents;
  }, [currentSchedule]);

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
    // Actualizar selectedDate en el store para que las ediciones se guarden en el mes correcto
    setSelectedDate(newDate);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    // Si es el indicador "+X más", usar estilo especial
    if (event.resource.isMoreIndicator) {
      return {
        style: {
          backgroundColor: '#f3f4f6',
          borderColor: '#9ca3af',
          color: '#6b7280',
          borderRadius: '6px',
          border: '1px dashed #9ca3af',
          fontSize: '0.70rem',
          fontWeight: '500',
          padding: '2px 4px',
          textAlign: 'center' as const,
          fontStyle: 'italic',
          cursor: 'default',
          pointerEvents: 'none' as const,
        },
      };
    }

    // Usar el color personalizado del evento
    const eventColor = event.resource.color || '#6366f1';

    return {
      style: {
        backgroundColor: eventColor,
        borderColor: eventColor,
        color: 'white',
        borderRadius: '6px',
        border: `2px solid ${eventColor}`,
        fontSize: '0.70rem',
        fontWeight: '600',
        padding: '2px 6px',
        textAlign: 'left' as const,
        marginBottom: '2px',
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 sm:mb-6">
        <Button
          onClick={goToToday}
          variant="outline"
          size="sm"
          className="hidden sm:block"
        >
          📅 Hoy
        </Button>

        <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 capitalize flex items-center gap-2">
          {label}
        </h2>

        <div className="flex gap-2">
          <Button onClick={goToBack} variant="secondary" size="sm">
            <span className="hidden sm:inline">← Anterior</span>
            <span className="sm:hidden">←</span>
          </Button>
          <Button
            onClick={goToToday}
            variant="outline"
            size="sm"
            className="sm:hidden"
          >
            📅
          </Button>
          <Button onClick={goToNext} variant="secondary" size="sm">
            <span className="hidden sm:inline">Siguiente →</span>
            <span className="sm:hidden">→</span>
          </Button>
        </div>
      </div>
    );
  };

  // Componente personalizado para cada día
  const CustomDateCell = ({
    value,
    children,
  }: {
    value: Date;
    children: React.ReactNode;
  }) => {
    const day = value.getDate();
    const dayAvail = currentSchedule?.availability.find((a) => a.day === day);
    const hasSchedule = dayAvail && dayAvail.slots.length > 0;

    return (
      <div
        className={`relative h-full ${hasSchedule ? 'bg-primary-50/30' : ''}`}
        style={{ pointerEvents: 'none' }}
      >
        {children}
        {hasSchedule && (
          <div className="absolute top-1 right-1 pointer-events-none">
            <Badge variant="primary">{dayAvail.slots.length}</Badge>
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
            <svg
              className="w-6 h-6 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
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

      {/* Leyenda - Más compacta en móvil */}
      <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 bg-neutral-50 rounded-xl border border-neutral-200">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-neutral-200 border-2 border-neutral-300"></div>
          <span className="text-xs sm:text-sm font-medium text-neutral-700">
            Sin horarios
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-indigo-500 border-2 border-indigo-600"></div>
          <span className="text-xs sm:text-sm font-medium text-neutral-700">
            Con horarios
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded border border-dashed border-neutral-400 bg-neutral-100 flex items-center justify-center text-xs text-neutral-600">
            +X
          </div>
          <span className="text-xs sm:text-sm font-medium text-neutral-700">
            Más eventos
          </span>
        </div>
      </div>

      <div className="calendar-container bg-white rounded-xl overflow-x-auto">
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
          style={{ height: 850, minHeight: '70vh' }}
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

      {/* Tip - Más corto en móvil */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-xl">
        <div className="flex items-start gap-2 sm:gap-3">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-primary-900 mb-1">
              💡 Consejo
            </p>
            <p className="text-xs sm:text-sm text-primary-800">
              <span className="hidden sm:inline">
                Haz clic en cualquier día para editar su horario. Cada evento
                puede tener su propio color. Si hay más de 3 eventos, verás un
                indicador "+X más".
              </span>
              <span className="sm:hidden">
                Toca cualquier día para editar horarios y agregar eventos con
                colores personalizados.
              </span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ScheduleCalendar;
