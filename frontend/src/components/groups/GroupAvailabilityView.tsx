import { useEffect, useMemo, useState } from 'react';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { availabilityService } from '../../services/availabilityService';
import { getApiErrorMessage } from '../../services/api';
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
  SuggestedEventDay,
} from '../../services/eventSuggestionService';
import Button from '../common/Button';
import Card from '../common/Card';

interface GroupAvailabilityViewProps {
  groupId: string;
  groupName: string;
}

type ViewMode = 'ranking' | 'calendar' | 'events' | 'analysis';

interface EventFilters {
  search: string;
  city: string;
  category: string;
  source: string;
  includeAlternatives: boolean;
  includeUnknownTime: boolean;
  minimumWindowMinutes: number;
}

const DEFAULT_SETTINGS: AvailabilitySettings = {
  usefulStart: '08:00',
  usefulEnd: '22:00',
  minimumBlockMinutes: 120,
  alternativeThreshold: 80,
};

const DEFAULT_EVENT_FILTERS: EventFilters = {
  search: '',
  city: '',
  category: '',
  source: '',
  includeAlternatives: true,
  includeUnknownTime: false,
  minimumWindowMinutes: 0,
};

const EVENT_CATEGORIES = [
  'Concierto',
  'Teatro',
  'Deporte',
  'Festival',
  'Evento',
];

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

const getQualityLabel = (quality?: AvailabilityWindow['timeQuality']) =>
  ({
    morning: 'Manana',
    afternoon: 'Tarde',
    evening: 'Tarde/noche',
    late: 'Tarde',
  }[quality || 'afternoon']);

const normalize = (value?: string | null) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const windowKey = (window: AvailabilityWindow) =>
  `${window.date}-${window.start}-${window.end}-${window.availabilityPercentage}`;

const GroupAvailabilityView = ({
  groupId,
  groupName,
}: GroupAvailabilityViewProps) => {
  const [activeView, setActiveView] = useState<ViewMode>('ranking');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<GroupAvailability | null>(
    null
  );
  const [selectedDay, setSelectedDay] = useState<DayAvailability | null>(null);
  const [settingsForm, setSettingsForm] =
    useState<AvailabilitySettings>(DEFAULT_SETTINGS);
  const [eventSuggestions, setEventSuggestions] =
    useState<GroupEventSuggestions | null>(null);
  const [eventFilters, setEventFilters] =
    useState<EventFilters>(DEFAULT_EVENT_FILTERS);
  const [showEventsOnCalendar, setShowEventsOnCalendar] = useState(false);
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
        year,
        {
          categories: eventFilters.category ? [eventFilters.category] : undefined,
          city: eventFilters.city || undefined,
          source: eventFilters.source || undefined,
          includeAlternatives: eventFilters.includeAlternatives,
          includeUnknownTime: eventFilters.includeUnknownTime,
          limit: 100,
        }
      );
      setEventSuggestions(data);
      if (!data.available && data.message) {
        setEventsError(data.message);
      }
    } catch (err) {
      console.error(err);
      setEventSuggestions(null);
      setEventsError(
        getApiErrorMessage(err, 'No pudimos cargar eventos sugeridos por ahora')
      );
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
  }, [
    groupId,
    month,
    year,
    eventFilters.city,
    eventFilters.category,
    eventFilters.source,
    eventFilters.includeAlternatives,
    eventFilters.includeUnknownTime,
  ]);

  const eventDays = useMemo<SuggestedEventDay[]>(() => {
    if (!eventSuggestions) return [];
    const query = normalize(eventFilters.search);

    return eventSuggestions.days
      .map((day) => ({
        ...day,
        events: day.events.filter((event) => {
          const windows = event.matchingWindows || [];
          const hasEnoughDuration =
            eventFilters.minimumWindowMinutes === 0 ||
            windows.some(
              (window) =>
                window.durationMinutes >= eventFilters.minimumWindowMinutes
            );

          if (!hasEnoughDuration) return false;
          if (!query) return true;

          const haystack = normalize(
            [
              event.name,
              event.venue?.name,
              event.venue?.city,
              event.category,
              event.genre,
            ]
              .filter(Boolean)
              .join(' ')
          );
          return haystack.includes(query);
        }),
      }))
      .filter((day) => day.events.length > 0);
  }, [eventSuggestions, eventFilters.search, eventFilters.minimumWindowMinutes]);

  const eventCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    eventDays.forEach((day) => counts.set(day.date, day.events.length));
    return counts;
  }, [eventDays]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return eventDays.find((day) => day.date === selectedDay.date)?.events || [];
  }, [eventDays, selectedDay]);

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

  const analysisRows = useMemo(() => {
    if (!availability) return [];
    const members = new Map<
      string,
      {
        name: string;
        busyBlocks: number;
        freeBlocks: number;
        availableDays: number;
      }
    >();

    availability.days.forEach((day) => {
      day.memberSummaries.forEach((member) => {
        const current = members.get(member.userId) || {
          name: member.fullName || member.username,
          busyBlocks: 0,
          freeBlocks: 0,
          availableDays: 0,
        };
        current.busyBlocks += member.busyBlocks.length;
        current.freeBlocks += member.freeBlocks.length;
        if (member.freeBlocks.length > 0) current.availableDays += 1;
        members.set(member.userId, current);
      });
    });

    return Array.from(members.values()).sort(
      (a, b) => b.availableDays - a.availableDays
    );
  }, [availability]);

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
      await fetchEventSuggestions();
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

  const updateEventFilter = <Key extends keyof EventFilters>(
    key: Key,
    value: EventFilters[Key]
  ) => {
    setEventFilters((current) => ({ ...current, [key]: value }));
  };

  const renderWindow = (window: AvailabilityWindow) => (
    <div
      key={windowKey(window)}
      className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur sm:p-5"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="amig-time-code text-xl font-bold text-neutral-950">
              {window.start} - {window.end}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                window.availabilityPercentage === 100
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {getWindowLabel(window)}
            </span>
            <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-800">
              {window.qualityScore || 0}/100
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            {format(new Date(`${window.date}T12:00:00`), "EEEE d 'de' MMMM", {
              locale: es,
            })}{' '}
            - {formatDuration(window.durationMinutes)} -{' '}
            {getQualityLabel(window.timeQuality)}
          </p>
          {window.scoreReasons?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {window.scoreReasons.slice(0, 4).map((reason) => (
                <span
                  key={reason}
                  className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-primary-50 px-4 py-3 text-center">
          <div className="text-2xl font-extrabold text-primary-700">
            {window.availabilityPercentage}%
          </div>
          <div className="text-xs font-bold uppercase text-neutral-600">
            alineacion
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-green-50 p-3">
          <p className="mb-2 text-xs font-semibold text-green-800">
            Disponibles
          </p>
          <p className="text-sm text-neutral-700">
            {window.availableMembers
              .map((member) => member.fullName || member.username)
              .join(', ')}
          </p>
        </div>
        <div className="rounded-xl bg-red-50 p-3">
          <p className="mb-2 text-xs font-semibold text-red-800">No pueden</p>
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

  const renderSuggestedEvent = (event: SuggestedEvent) => {
    const matchingWindow = event.matchingWindows?.[0];

    return (
      <a
        key={`${event.source}-${event.externalId}`}
        href={event.ticketUrl || '#'}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-[96px] gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-colors hover:border-primary-300 hover:bg-primary-50/40"
      >
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="h-20 w-20 flex-shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md bg-neutral-100 text-xs font-semibold text-neutral-500">
            Evento
          </div>
        )}
        <span className="min-w-0">
          <span className="line-clamp-2 block font-semibold text-neutral-900">
            {event.name}
          </span>
          <span className="mt-1 block text-xs text-neutral-600">
            {[event.timeLocal, event.venue?.name, event.venue?.city, event.category]
              .filter(Boolean)
              .join(' - ')}
          </span>
          {matchingWindow && (
            <span
              className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                event.timeMatchStatus === 'outside-window'
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-green-50 text-green-800'
              }`}
            >
              {event.timeMatchStatus === 'unknown-time'
                ? `Hora por confirmar - ventana ${matchingWindow.start}-${matchingWindow.end}`
                : event.timeMatchStatus === 'outside-window'
                  ? `Fuera de ventana - mejor bloque ${matchingWindow.start}-${matchingWindow.end}`
                  : `Calza ${matchingWindow.start}-${matchingWindow.end}`}
            </span>
          )}
        </span>
      </a>
    );
  };

  const renderStats = () => {
    if (!availability) return null;

    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-white/85 p-4 shadow-soft backdrop-blur">
          <div className="text-2xl font-bold text-green-700">
            {availability.stats.daysWithPerfectOption}
          </div>
          <div className="text-xs text-neutral-600">Dias perfectos</div>
        </div>
        <div className="rounded-2xl bg-white/85 p-4 shadow-soft backdrop-blur">
          <div className="text-2xl font-bold text-amber-700">
            {availability.stats.daysWithStrongAlternative}
          </div>
          <div className="text-xs text-neutral-600">Dias con alternativa</div>
        </div>
        <div className="rounded-2xl bg-white/85 p-4 shadow-soft backdrop-blur">
          <div className="text-2xl font-bold text-primary-700">
            {availability.stats.totalRecommendations}
          </div>
          <div className="text-xs text-neutral-600">Opciones utiles</div>
        </div>
        <div className="rounded-2xl bg-white/85 p-4 shadow-soft backdrop-blur">
          <div className="text-2xl font-bold text-neutral-800">
            {availability.stats.schedulesSubmitted}/
            {availability.stats.memberCount}
          </div>
          <div className="text-xs text-neutral-600">Miembros con horarios</div>
        </div>
      </div>
    );
  };

  const renderSettingsPanel = () => (
    <Card variant="glass" padding="md">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <h3 className="text-base font-semibold text-neutral-900">
            Criterios utiles
          </h3>
          <p className="mt-1 text-sm text-neutral-600">
            Ajustan ranking, calendario y eventos compatibles.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
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
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
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
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
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
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value={60}>1 hora</option>
            <option value={90}>1.5 horas</option>
            <option value={120}>2 horas</option>
            <option value={180}>3 horas</option>
            <option value={240}>4 horas</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
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
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value={60}>60% o mas</option>
            <option value={70}>70% o mas</option>
            <option value={80}>80% o mas</option>
            <option value={90}>90% o mas</option>
          </select>
        </div>

        <div className="lg:col-start-6">
          <Button
            onClick={handleSaveSettings}
            loading={isSavingSettings}
            fullWidth
          >
            Guardar
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderEventFilters = () => (
    <Card variant="glass" padding="md">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
            Buscar evento
          </label>
          <input
            value={eventFilters.search}
            onChange={(event) => updateEventFilter('search', event.target.value)}
            placeholder="Nombre, lugar o comuna"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
            Ciudad/comuna
          </label>
          <input
            value={eventFilters.city}
            onChange={(event) => updateEventFilter('city', event.target.value)}
            placeholder="Todas"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
            Categoria
          </label>
          <select
            value={eventFilters.category}
            onChange={(event) => updateEventFilter('category', event.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value="">Todas</option>
            {EVENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
            Fuente
          </label>
          <select
            value={eventFilters.source}
            onChange={(event) => updateEventFilter('source', event.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value="">Todas</option>
            <option value="puntoticket">PuntoTicket</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">
            Ventana minima
          </label>
          <select
            value={eventFilters.minimumWindowMinutes}
            onChange={(event) =>
              updateEventFilter('minimumWindowMinutes', Number(event.target.value))
            }
            className="w-full rounded-lg border border-neutral-300 px-3 py-2"
          >
            <option value={0}>Cualquiera</option>
            <option value={120}>2 horas</option>
            <option value={180}>3 horas</option>
            <option value={240}>4 horas</option>
          </select>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={eventFilters.includeAlternatives}
            onChange={(event) =>
              updateEventFilter('includeAlternatives', event.target.checked)
            }
          />
          Incluir alternativas
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={eventFilters.includeUnknownTime}
            onChange={(event) =>
              updateEventFilter('includeUnknownTime', event.target.checked)
            }
          />
          Incluir eventos sin hora
        </label>
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchEventSuggestions}
          loading={isLoadingEvents}
        >
          Actualizar eventos
        </Button>
      </div>
    </Card>
  );

  const renderTabs = () => {
    const tabs: Array<{ id: ViewMode; label: string }> = [
      { id: 'ranking', label: 'Ranking' },
      { id: 'calendar', label: 'Calendario' },
      { id: 'events', label: 'Eventos' },
      { id: 'analysis', label: 'Analisis' },
    ];

    return (
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/55 p-1 backdrop-blur md:grid-cols-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
              activeView === tab.id
                ? 'bg-white text-primary-700 shadow-soft'
                : 'text-neutral-600 hover:bg-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  const renderRankingView = () => {
    if (!availability) return null;
    return (
      <Card variant="glass" padding="lg">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-primary-700">
              Algorithm Results
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-neutral-950">
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
          <div className="rounded-2xl bg-white/70 p-6 text-center text-neutral-600">
            No hay bloques utiles con los criterios actuales.
          </div>
        ) : (
          <div className="space-y-3">
            {availability.recommendations.slice(0, 12).map(renderWindow)}
          </div>
        )}
      </Card>
    );
  };

  const renderCalendarView = () => (
    <div className="space-y-4">
      <Card variant="glass" padding="lg">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">
              Calendario mensual
            </h3>
            <p className="text-sm text-neutral-600">
              Color por mejor bloque util del dia.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <input
              type="checkbox"
              checked={showEventsOnCalendar}
              onChange={(event) => setShowEventsOnCalendar(event.target.checked)}
            />
            Mostrar eventos
          </label>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
          {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => (
            <div
              key={day}
              className="py-1 text-center text-xs font-semibold text-neutral-600 sm:py-2 sm:text-sm"
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
            const eventsCount = dayInfo.data
              ? eventCountByDate.get(dayInfo.data.date) || 0
              : 0;
            const isSelected = selectedDay?.day === dayInfo.day;

            return (
              <button
                key={dayInfo.day}
                onClick={() => setSelectedDay(dayInfo.data || null)}
                disabled={!dayInfo.data || score === 0}
                className={`aspect-square min-h-[54px] rounded-lg text-xs font-semibold transition-all sm:rounded-xl sm:text-sm ${getColorClass(
                  score
                )} ${
                  isSelected ? 'ring-2 ring-primary-500 ring-offset-1' : ''
                }`}
              >
                <span className="flex h-full flex-col items-center justify-center gap-1">
                  <span className="text-base sm:text-lg">{dayInfo.day}</span>
                  <span className="text-xs font-bold">{score}%</span>
                  {showEventsOnCalendar && eventsCount > 0 && (
                    <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] text-primary-800">
                      {eventsCount} ev
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDay && (
        <Card variant="glass" padding="lg">
          <h3 className="mb-4 text-lg font-bold text-neutral-900">
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

          {showEventsOnCalendar && (
            <div className="mt-5">
              <h4 className="mb-3 text-sm font-bold text-neutral-900">
                Eventos que calzan
              </h4>
              {selectedDayEvents.length === 0 ? (
                <p className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">
                  No hay eventos compatibles para este dia.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {selectedDayEvents.map(renderSuggestedEvent)}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );

  const renderEventsView = () => (
    <div className="space-y-4">
      {renderEventFilters()}

      {eventsError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {eventsError}
        </div>
      )}

      {!eventsError && eventSuggestions?.message && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {eventSuggestions.message}
        </div>
      )}

      {eventsError && eventDays.length === 0 ? null : isLoadingEvents && !eventSuggestions ? (
        <div className="flex items-center gap-3 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-300 border-t-primary-700" />
          Buscando eventos compatibles...
        </div>
      ) : eventDays.length === 0 ? (
        <div className="rounded-lg bg-neutral-50 p-6 text-center text-neutral-600">
          No encontramos eventos que calcen con las ventanas disponibles.
        </div>
      ) : (
        <div className="space-y-4">
          {eventDays.map((day) => (
            <Card key={day.date} padding="md">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="font-semibold text-neutral-900">
                    {format(
                      new Date(`${day.date}T12:00:00`),
                      "EEEE d 'de' MMMM",
                      { locale: es }
                    )}
                  </h4>
                  <p className="text-xs text-neutral-600">
                    {day.events.length} evento
                    {day.events.length === 1 ? '' : 's'} compatible
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary-700">
                  {day.availabilityWindow.start} - {day.availabilityWindow.end}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {day.events.map(renderSuggestedEvent)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalysisView = () => {
    if (!availability) return null;

    const bestDays = availability.days
      .filter((day) => day.bestWindow)
      .sort(
        (a, b) =>
          (b.bestWindow?.qualityScore || 0) - (a.bestWindow?.qualityScore || 0)
      )
      .slice(0, 5);

    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card variant="glass" padding="lg">
          <h3 className="mb-4 text-lg font-bold text-neutral-900">
            Lectura rapida
          </h3>
          <div className="space-y-3">
            {bestDays.map((day) => (
              <div
                key={day.date}
                className="rounded-lg border border-neutral-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {format(
                        new Date(`${day.date}T12:00:00`),
                        "EEEE d 'de' MMMM",
                        { locale: es }
                      )}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {day.bestWindow?.start} - {day.bestWindow?.end}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-50 px-2 py-1 text-xs font-bold text-primary-800">
                    {day.bestWindow?.qualityScore || 0}/100
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {day.bestWindow?.scoreReasons?.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-700"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="mb-4 text-lg font-bold text-neutral-900">
            Cobertura por miembro
          </h3>
          <div className="space-y-2">
            {analysisRows.map((member) => (
              <div
                key={member.name}
                className="rounded-lg border border-neutral-200 bg-white p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-neutral-900">{member.name}</p>
                  <span className="text-sm font-semibold text-neutral-700">
                    {member.availableDays} dias
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-600">
                  {member.freeBlocks} bloques libres - {member.busyBlocks}{' '}
                  bloqueos
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderActiveView = () => {
    if (!availability) return null;
    if (activeView === 'ranking') return renderRankingView();
    if (activeView === 'calendar') return renderCalendarView();
    if (activeView === 'events') return renderEventsView();
    return renderAnalysisView();
  };

  if (isLoading && !availability) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 rounded-pebble bg-white/70 p-5 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase text-primary-700">
            Calculo de grupo
          </p>
          <h2 className="mt-1 text-2xl font-extrabold text-neutral-950 sm:text-3xl">
            Disponibilidad de {groupName}
          </h2>
          <p className="text-sm text-neutral-600">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </p>
        </div>
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:p-4 sm:text-base">
          {error}
        </div>
      )}

      {renderSettingsPanel()}
      {availability && renderStats()}
      {renderTabs()}
      {renderActiveView()}
    </div>
  );
};

export default GroupAvailabilityView;
