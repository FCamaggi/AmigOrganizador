import { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useScheduleStore } from '../../store/scheduleStore';
import {
  calendarSyncService,
  type CalendarProvider,
  type CalendarStatus,
  type ExternalCalendarEvent,
} from '../../services/calendarSyncService';
import {
  scheduleService,
  type Schedule,
  type TimeSlot,
} from '../../services/scheduleService';

interface CalendarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS: Array<{ key: CalendarProvider; label: string }> = [
  { key: 'google', label: 'Google Calendar' },
  { key: 'microsoft', label: 'Outlook' },
];

const eventKey = (event: ExternalCalendarEvent) =>
  `${event.date}-${event.title}-${event.start}-${event.end}`;

const slotExists = (slots: TimeSlot[], event: ExternalCalendarEvent) =>
  slots.some((slot) => slot.title === event.title && slot.start === event.start);

const CalendarImportModal = ({ isOpen, onClose }: CalendarImportModalProps) => {
  const { selectedDate, fetchSchedule, setSelectedDate } = useScheduleStore();

  const [provider, setProvider] = useState<CalendarProvider>('google');
  const [monthValue, setMonthValue] = useState(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [events, setEvents] = useState<ExternalCalendarEvent[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleSnapshot, setScheduleSnapshot] = useState<Schedule | null>(null);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>({
    google: { connected: false },
    microsoft: { connected: false },
  });

  useEffect(() => {
    if (!isOpen) return;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    setMonthValue(`${year}-${month}`);
    setEvents([]);
    setSelected(new Set());
    setError(null);
    calendarSyncService
      .getConnectedCalendars()
      .then(setCalendarStatus)
      .catch(() => {
        setError('No se pudo revisar el estado de tus calendarios conectados.');
      });
  }, [isOpen, selectedDate]);

  const groupedEvents = useMemo(() => {
    const grouped = events.reduce<Record<number, ExternalCalendarEvent[]>>(
      (acc, event) => {
        if (!acc[event.day]) acc[event.day] = [];
        acc[event.day].push(event);
        return acc;
      },
      {}
    );

    return Object.entries(grouped).map(([day, dayEvents]) => ({
      day: Number(day),
      events: dayEvents,
    }));
  }, [events]);

  const selectedEvents = events.filter((event) => selected.has(eventKey(event)));
  const selectedProviderStatus = calendarStatus[provider];

  const handleConnectProvider = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await calendarSyncService.connect(provider);
      const status = await calendarSyncService.getConnectedCalendars();
      setCalendarStatus(status);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || (err as Error).message || 'Error al conectar calendario';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFetchEvents = async () => {
    if (!selectedProviderStatus.connected) {
      setError(`Conecta ${provider === 'google' ? 'Google Calendar' : 'Outlook'} antes de ver eventos.`);
      return;
    }

    setIsFetching(true);
    setError(null);
    try {
      const [year, month] = monthValue.split('-').map(Number);
      const schedule = await scheduleService.getSchedule(year, month);
      setScheduleSnapshot(schedule);
      const response = await calendarSyncService.importEvents(provider, year, month);
      setEvents(response.events);
      setSelected(new Set(response.events.map(eventKey)));
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || (err as Error).message || 'Error al cargar eventos';
      setError(message);
    } finally {
      setIsFetching(false);
    }
  };

  const handleToggleEvent = (event: ExternalCalendarEvent) => {
    const key = eventKey(event);
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const handleImport = async () => {
    if (selectedEvents.length === 0) return;

    setError(null);
    setIsImporting(true);
    try {
      const [year, month] = monthValue.split('-').map(Number);
      const byDay = selectedEvents.reduce<Record<number, ExternalCalendarEvent[]>>(
        (acc, event) => {
          if (!acc[event.day]) acc[event.day] = [];
          acc[event.day].push(event);
          return acc;
        },
        {}
      );

      for (const [dayText, dayEvents] of Object.entries(byDay)) {
        const day = Number(dayText);
        const existing = scheduleSnapshot?.availability.find(
          (availability) => availability.day === day
        );
        const existingSlots = existing?.slots || [];
        const newSlots = dayEvents
          .filter((event) => !slotExists(existingSlots, event))
          .map((event) => ({
            title: event.title,
            start: event.start,
            end: event.end,
            color: event.color,
          }));

        if (newSlots.length > 0) {
          await scheduleService.updateDayAvailability(
            year,
            month,
            day,
            [...existingSlots, ...newSlots],
            existing?.note
          );
        }
      }

      setSelectedDate(new Date(year, month - 1, 1));
      await fetchSchedule(year, month);
      onClose();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || (err as Error).message || 'Error al importar eventos';
      setError(message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar Calendario"
      description="Selecciona eventos externos para agregarlos a tu horario"
      size="lg"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Proveedor
            </label>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as CalendarProvider)}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PROVIDERS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Mes
            </label>
            <input
              type="month"
              value={monthValue}
              onChange={(event) => setMonthValue(event.target.value)}
              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="sm:col-span-1 flex items-end">
            <Button
              onClick={handleFetchEvents}
              loading={isFetching}
              disabled={!monthValue || !selectedProviderStatus.connected}
              fullWidth
            >
              Ver eventos
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-neutral-800">
              {provider === 'google' ? 'Google Calendar' : 'Outlook'}
            </p>
            <p className="text-sm text-neutral-600">
              {selectedProviderStatus.connected
                ? `Conectado como ${selectedProviderStatus.email || 'cuenta externa'}`
                : 'Debes conectar este calendario antes de importar eventos.'}
            </p>
          </div>
          {!selectedProviderStatus.connected && (
            <Button
              onClick={handleConnectProvider}
              loading={isConnecting}
              className="w-full sm:w-auto"
            >
              Conectar
            </Button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {events.length > 0 && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-neutral-600">
              {selectedEvents.length} de {events.length} eventos seleccionados
            </p>
            <button
              type="button"
              onClick={() =>
                setSelected(
                  selected.size === events.length
                    ? new Set()
                    : new Set(events.map(eventKey))
                )
              }
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              {selected.size === events.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </button>
          </div>
        )}

        <div className="max-h-[46vh] overflow-y-auto space-y-3">
          {events.length === 0 && !isFetching ? (
            <div className="p-6 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl text-center text-sm text-neutral-500">
              Carga un mes para ver eventos disponibles.
            </div>
          ) : (
            groupedEvents.map((group) => (
              <div key={group.day} className="border border-neutral-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-neutral-50 font-semibold text-neutral-800">
                  Dia {group.day}
                </div>
                <div className="divide-y divide-neutral-100">
                  {group.events.map((event) => (
                    <label
                      key={eventKey(event)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-neutral-50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(eventKey(event))}
                        onChange={() => handleToggleEvent(event)}
                        className="w-4 h-4 accent-primary-600"
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-neutral-900 truncate">
                          {event.title}
                        </span>
                        <span className="block text-xs text-neutral-500">
                          {event.start} - {event.end}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedEvents.length === 0 || isImporting}
            loading={isImporting}
          >
            Importar {selectedEvents.length} eventos
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CalendarImportModal;
