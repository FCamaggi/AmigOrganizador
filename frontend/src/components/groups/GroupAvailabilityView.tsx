import { useEffect, useMemo, useState } from 'react';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { availabilityService } from '../../services/availabilityService';
import { eventSuggestionService } from '../../services/eventSuggestionService';
import { groupService } from '../../services/groupService';
import type {
  AvailabilitySettings,
  AvailabilityWindow,
  DayAvailability,
  GroupAvailability,
} from '../../services/availabilityService';
import type {
  GroupEventSuggestions,
  SuggestedEvent,
} from '../../services/eventSuggestionService';
import Button from '../common/Button';
import Card from '../common/Card';

interface GroupAvailabilityViewProps {
  groupId: string;
  groupName: string;
}

const DEFAULT_SETTINGS: AvailabilitySettings = {
  usefulStart: '08:00',
  usefulEnd: '22:00',
  minimumBlockMinutes: 120,
  alternativeThreshold: 80,
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const getWindowLabel = (window: AvailabilityWindow) =>
  window.availabilityPercentage === 100
    ? 'Todos disponibles'
    : `Alternativa ${window.availabilityPercentage}%`;

const GroupAvailabilityView = ({
  groupId,
  groupName,
}: GroupAvailabilityViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<GroupAvailability | null>(
    null
  );
  const [selectedDay, setSelectedDay] = useState<DayAvailability | null>(null);
  const [settingsForm, setSettingsForm] =
    useState<AvailabilitySettings>(DEFAULT_SETTINGS);
  const [eventSuggestions, setEventSuggestions] =
    useState<GroupEventSuggestions | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const fetchAvailability = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await availabilityService.getGroupAvailability(
        groupId,
        month,
        year
      );
      setAvailability(data);
      setSettingsForm(data.settings);
      setSelectedDay((current) =>
        current ? data.days.find((day) => day.day === current.day) || null : null
      );
    } catch (err) {
      setError('Error al cargar la disponibilidad del grupo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventSuggestions = async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const data = await eventSuggestionService.getGroupEventSuggestions(
        groupId,
        month,
        year
      );
      setEventSuggestions(data);
      if (!data.available && data.message) {
        setEventsError(data.message);
      }
    } catch (err) {
      console.error(err);
      setEventSuggestions(null);
      setEventsError('No pudimos cargar eventos sugeridos por ahora');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, month, year]);

  useEffect(() => {
    fetchEventSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, month, year]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = startOfMonth(currentDate);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = getDaysInMonth(currentDate);
    const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
    const days: Array<{ day: number; data?: DayAvailability } | null> = [];

    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        data: availability?.days.find((item) => item.day === day),
      });
    }

    return days;
  }, [currentDate, availability]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
    setSelectedDay(null);
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setError(null);
    try {
      await groupService.updateAvailabilitySettings(groupId, settingsForm);
      await fetchAvailability();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al guardar criterios de disponibilidad';
      setError(message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getColorClass = (score: number) => {
    if (score === 0) return 'bg-neutral-100 text-neutral-400';
    if (score < settingsForm.alternativeThreshold)
      return 'bg-neutral-100 text-neutral-500';
    if (score < 100) return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
    return 'bg-green-200 text-green-900 hover:bg-green-300';
  };

  const renderWindow = (window: AvailabilityWindow) => (
    <div
      key={`${window.date}-${window.start}-${window.end}-${window.availabilityPercentage}`}
      className="p-3 sm:p-4 rounded-xl border border-neutral-200 bg-white"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-neutral-900">
              {window.start} - {window.end}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                window.availabilityPercentage === 100
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {getWindowLabel(window)}
            </span>
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            {format(new Date(`${window.date}T12:00:00`), "EEEE d 'de' MMMM", {
              locale: es,
            })}{' '}
            · {formatDuration(window.durationMinutes)}
          </p>
        </div>
        <div className="text-sm font-semibold text-neutral-700">
          {window.availableMembers.length}/
          {window.availableMembers.length + window.unavailableMembers.length}{' '}
          miembros
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-green-800 mb-2">
            Disponibles
          </p>
          <p className="text-sm text-neutral-700">
            {window.availableMembers
              .map((member) => member.fullName || member.username)
              .join(', ')}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-red-800 mb-2">No pueden</p>
          <p className="text-sm text-neutral-700">
            {window.unavailableMembers.length > 0
              ? window.unavailableMembers
                  .map((member) => member.fullName || member.username)
                  .join(', ')
              : 'Nadie'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderSuggestedEvent = (event: SuggestedEvent) => (
    <a
      key={`${event.source}-${event.externalId}`}
      href={event.ticketUrl || '#'}
      target="_blank"
      rel="noreferrer"
      className="flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 hover:border-primary-300 hover:bg-primary-50/40 transition-colors"
    >
      {event.imageUrl ? (
        <img
          src={event.imageUrl}
          alt={event.name}
          className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="h-16 w-16 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-500 flex-shrink-0">
          Evento
        </div>
      )}
      <span className="min-w-0">
        <span className="block font-semibold text-neutral-900 line-clamp-2">
          {event.name}
        </span>
        <span className="mt-1 block text-xs text-neutral-600">
          {[event.venue?.name, event.venue?.city, event.category]
            .filter(Boolean)
            .join(' - ')}
        </span>
      </span>
    </a>
  );

  if (isLoading && !availability) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-800">
          Disponibilidad de {groupName}
        </h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePreviousMonth}>
            Anterior
          </Button>
          <Button variant="secondary" onClick={handleCurrentMonth}>
            Hoy
          </Button>
          <Button variant="secondary" onClick={handleNextMonth}>
            Siguiente
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-sm sm:text-base text-red-700">
          {error}
        </div>
      )}

      <Card padding="md">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <h3 className="text-base font-semibold text-neutral-900">
              Criterios utiles
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Estos filtros evitan sugerir horarios poco practicos, como
              madrugada.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Desde
            </label>
            <input
              type="time"
              value={settingsForm.usefulStart}
              onChange={(event) =>
                setSettingsForm({
                  ...settingsForm,
                  usefulStart: event.target.value,
                })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Hasta
            </label>
            <input
              type="time"
              value={settingsForm.usefulEnd}
              onChange={(event) =>
                setSettingsForm({
                  ...settingsForm,
                  usefulEnd: event.target.value,
                })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleSaveSettings}
              loading={isSavingSettings}
              fullWidth
            >
              Guardar
            </Button>
          </div>

          <div className="lg:col-start-3">
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Duracion minima
            </label>
            <select
              value={settingsForm.minimumBlockMinutes}
              onChange={(event) =>
                setSettingsForm({
                  ...settingsForm,
                  minimumBlockMinutes: Number(event.target.value),
                })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            >
              <option value={60}>1 hora</option>
              <option value={90}>1.5 horas</option>
              <option value={120}>2 horas</option>
              <option value={180}>3 horas</option>
              <option value={240}>4 horas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Alternativa fuerte
            </label>
            <select
              value={settingsForm.alternativeThreshold}
              onChange={(event) =>
                setSettingsForm({
                  ...settingsForm,
                  alternativeThreshold: Number(event.target.value),
                })
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
            >
              <option value={60}>60% o mas</option>
              <option value={70}>70% o mas</option>
              <option value={80}>80% o mas</option>
              <option value={90}>90% o mas</option>
            </select>
          </div>
        </div>
      </Card>

      {availability && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl shadow-soft">
              <div className="text-2xl font-bold text-green-700">
                {availability.stats.daysWithPerfectOption}
              </div>
              <div className="text-xs text-neutral-600">Dias perfectos</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-soft">
              <div className="text-2xl font-bold text-amber-700">
                {availability.stats.daysWithStrongAlternative}
              </div>
              <div className="text-xs text-neutral-600">
                Dias con alternativa
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-soft">
              <div className="text-2xl font-bold text-primary-700">
                {availability.stats.totalRecommendations}
              </div>
              <div className="text-xs text-neutral-600">Opciones utiles</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-soft">
              <div className="text-2xl font-bold text-neutral-800">
                {availability.stats.schedulesSubmitted}/
                {availability.stats.memberCount}
              </div>
              <div className="text-xs text-neutral-600">Horarios enviados</div>
            </div>
          </div>

          <Card padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Mejores horarios
                </h3>
                <p className="text-sm text-neutral-600">
                  {format(currentDate, 'MMMM yyyy', { locale: es })}
                </p>
              </div>
              {isLoading && (
                <span className="text-sm text-neutral-500">Actualizando...</span>
              )}
            </div>

            {availability.recommendations.length === 0 ? (
              <div className="p-6 text-center bg-neutral-50 rounded-xl text-neutral-600">
                No hay bloques utiles con los criterios actuales.
              </div>
            ) : (
              <div className="space-y-3">
                {availability.recommendations.slice(0, 10).map(renderWindow)}
              </div>
            )}
          </Card>

          <Card padding="lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  Eventos sugeridos
                </h3>
                <p className="text-sm text-neutral-600">
                  Eventos encontrados para los dias con mejores bloques utiles.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={fetchEventSuggestions}
                loading={isLoadingEvents}
              >
                Actualizar eventos
              </Button>
            </div>

            {eventsError && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {eventsError}
              </div>
            )}

            {isLoadingEvents && !eventSuggestions ? (
              <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
                <span className="h-4 w-4 rounded-full border-2 border-primary-300 border-t-primary-700 animate-spin" />
                Buscando eventos para estos dias...
              </div>
            ) : !eventSuggestions || eventSuggestions.totalEvents === 0 ? (
              <div className="p-6 text-center bg-neutral-50 rounded-xl text-neutral-600">
                No encontramos eventos para estos dias todavia.
              </div>
            ) : (
              <div className="space-y-4">
                {eventSuggestions.days
                  .filter((day) => day.events.length > 0)
                  .slice(0, 8)
                  .map((day) => (
                    <div
                      key={day.date}
                      className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"
                    >
                      <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div>
                          <h4 className="font-semibold text-neutral-900">
                            {format(
                              new Date(`${day.date}T12:00:00`),
                              "EEEE d 'de' MMMM",
                              { locale: es }
                            )}
                          </h4>
                          <p className="text-xs text-neutral-600">
                            Mejor bloque: {day.availabilityWindow.start} -{' '}
                            {day.availabilityWindow.end}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-primary-700">
                          {day.events.length} evento
                          {day.events.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {day.events.slice(0, 4).map(renderSuggestedEvent)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          <Card padding="lg">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">
              Resumen mensual
            </h3>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs sm:text-sm font-semibold text-neutral-600 py-1 sm:py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((dayInfo, index) => {
                if (!dayInfo) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const score = dayInfo.data?.availabilityScore || 0;
                const isSelected = selectedDay?.day === dayInfo.day;

                return (
                  <button
                    key={dayInfo.day}
                    onClick={() => setSelectedDay(dayInfo.data || null)}
                    disabled={!dayInfo.data || score === 0}
                    className={`aspect-square rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${getColorClass(
                      score
                    )} ${
                      isSelected
                        ? 'ring-2 ring-primary-500 ring-offset-1 sm:ring-offset-2'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-sm sm:text-base lg:text-lg">
                        {dayInfo.day}
                      </div>
                      <div className="text-xs font-bold">{score}%</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {selectedDay && (
            <Card padding="lg">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">
                {format(
                  new Date(`${selectedDay.date}T12:00:00`),
                  "EEEE d 'de' MMMM",
                  { locale: es }
                )}
              </h3>

              <div className="space-y-3">
                {[
                  ...selectedDay.perfectWindows,
                  ...selectedDay.alternativeWindows,
                ].length === 0 ? (
                  <p className="text-sm text-neutral-600">
                    No hay bloques utiles este dia.
                  </p>
                ) : (
                  [
                    ...selectedDay.perfectWindows,
                    ...selectedDay.alternativeWindows,
                  ].map(renderWindow)
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default GroupAvailabilityView;
