import { useState, useEffect, useCallback } from 'react';
import { useEventStore } from '../store/eventStore';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import EventModal from '../components/events/EventModal';
import type { Event } from '../services/eventService';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const NewSchedule = () => {
  const { events, fetchEvents, deleteEvent, loading } = useEventStore();
  const [currentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [viewMode] = useState<'month' | 'list'>('list');

  const loadEvents = useCallback(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(addMonths(currentDate, 2)); // Cargar 3 meses

    fetchEvents(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  }, [currentDate, fetchEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreateEvent = () => {
    setEventToEdit(null);
    setSelectedDate(undefined);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      await deleteEvent(eventId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEventToEdit(null);
    setSelectedDate(undefined);
    loadEvents();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work':
        return '💼';
      case 'study':
        return '📚';
      case 'vacation':
        return '🏖️';
      case 'personal':
        return '👤';
      default:
        return '📅';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'work':
        return 'Trabajo';
      case 'study':
        return 'Estudios';
      case 'vacation':
        return 'Vacaciones';
      case 'personal':
        return 'Personal';
      default:
        return 'Otro';
    }
  };

  const groupEventsByDate = () => {
    const grouped: { [key: string]: Event[] } = {};

    events.forEach((event) => {
      const startDate = new Date(event.startDate);

      // Para eventos de múltiples días, agrupar por fecha de inicio
      const key = format(startDate, 'yyyy-MM-dd');
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    });

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const formatTimeSlots = (event: Event) => {
    if (event.allDay) return 'Todo el día';
    if (event.timeSlots.length === 0) return 'Sin horario definido';

    return event.timeSlots
      .map((slot) => `${slot.start} - ${slot.end}`)
      .join(', ');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent mb-2">
                  Mi Calendario
                </h1>
                <p className="text-sm sm:text-base text-neutral-600">
                  Gestiona tus eventos y disponibilidad
                </p>
              </div>
              <Button onClick={handleCreateEvent} className="w-full md:w-auto min-h-[44px]">
                <span className="mr-2">➕</span>
                Crear Evento
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && events.length === 0 && (
            <div className="text-center py-8 sm:py-12 bg-white rounded-xl sm:rounded-2xl shadow-soft px-4">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">📅</div>
              <h3 className="text-lg sm:text-xl font-bold text-neutral-700 mb-2">
                No tienes eventos todavía
              </h3>
              <p className="text-sm sm:text-base text-neutral-500 mb-4 sm:mb-6">
                Crea tu primer evento para gestionar tu disponibilidad
              </p>
              <Button onClick={handleCreateEvent} className="w-full sm:w-auto min-h-[44px]">
                Crear mi primer evento
              </Button>
            </div>
          )}

          {/* Events List */}
          {!loading && events.length > 0 && viewMode === 'list' && (
            <div className="space-y-4 sm:space-y-6">
              {groupEventsByDate().map(([date, dayEvents]) => (
                <div
                  key={date}
                  className="bg-white rounded-xl sm:rounded-2xl shadow-soft overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-primary-600 to-accent-500 p-3 sm:p-4">
                    <h3 className="text-white font-bold text-base sm:text-lg">
                      {format(new Date(date), "EEEE, d 'de' MMMM", {
                        locale: es,
                      })}
                    </h3>
                  </div>
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {dayEvents.map((event) => (
                      <div
                        key={event._id}
                        className="flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 hover:border-primary-300 transition-colors"
                        style={{
                          borderColor: event.color + '30',
                          backgroundColor: event.color + '08',
                        }}
                      >
                        <div
                          className="w-1 h-full rounded-full flex-shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                                <span className="text-base sm:text-lg">
                                  {getCategoryIcon(event.category)}
                                </span>
                                <h4 className="font-bold text-sm sm:text-base text-neutral-900 truncate">
                                  {event.title}
                                </h4>
                                {event.recurrence?.enabled && (
                                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    🔁 Recurrente
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-neutral-600">
                                {getCategoryLabel(event.category)} •{' '}
                                {formatTimeSlots(event)}
                              </p>
                            </div>
                            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleEditEvent(event)}
                                className="text-neutral-600 hover:text-primary-600 p-1.5 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(event._id)}
                                className="text-neutral-600 hover:text-red-600 p-1.5 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-xs sm:text-sm text-neutral-600 mb-1 sm:mb-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          {event.recurrence?.enabled && (
                            <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-2">
                              <span>
                                Frecuencia:{' '}
                                {event.recurrence.frequency === 'weekly'
                                  ? 'Semanal'
                                  : event.recurrence.frequency === 'monthly'
                                  ? 'Mensual'
                                  : 'Diaria'}
                              </span>
                              {event.recurrence.endDate && (
                                <span>
                                  • Hasta:{' '}
                                  {format(
                                    new Date(event.recurrence.endDate),
                                    'd MMM yyyy',
                                    { locale: es }
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialDate={selectedDate}
          eventToEdit={eventToEdit}
        />
      </div>
    </>
  );
};

export default NewSchedule;
