import { useState } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { cn } from '../../styles/design-system';
import Button from '../common/Button';
import Card from '../common/Card';
import type { TimeSlot } from '../../services/scheduleService';

interface WeekTemplate {
  [day: string]: TimeSlot[];
}

type ApplyMode = 'append' | 'replace';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes', short: 'Lun' },
  { key: 'tuesday', label: 'Martes', short: 'Mar' },
  { key: 'wednesday', label: 'Miercoles', short: 'Mie' },
  { key: 'thursday', label: 'Jueves', short: 'Jue' },
  { key: 'friday', label: 'Viernes', short: 'Vie' },
  { key: 'saturday', label: 'Sabado', short: 'Sab' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' },
];

const QUICK_TEMPLATES: { [key: string]: WeekTemplate } = {
  nursingDay: {
    monday: [{ start: '08:00', end: '20:00', title: 'Turno Dia', color: '#3b82f6' }],
    tuesday: [{ start: '08:00', end: '20:00', title: 'Turno Dia', color: '#3b82f6' }],
    wednesday: [{ start: '08:00', end: '20:00', title: 'Turno Dia', color: '#3b82f6' }],
    thursday: [{ start: '08:00', end: '20:00', title: 'Turno Dia', color: '#3b82f6' }],
    friday: [{ start: '08:00', end: '20:00', title: 'Turno Dia', color: '#3b82f6' }],
    saturday: [{ start: '08:00', end: '20:00', title: 'Turno Dia', color: '#3b82f6' }],
    sunday: [{ start: '08:00', end: '20:00', title: 'Turno Dia', color: '#3b82f6' }],
  },
  nursingNight: {
    monday: [{ start: '20:00', end: '08:00', title: 'Turno Noche', color: '#1e40af' }],
    tuesday: [{ start: '20:00', end: '08:00', title: 'Turno Noche', color: '#1e40af' }],
    wednesday: [{ start: '20:00', end: '08:00', title: 'Turno Noche', color: '#1e40af' }],
    thursday: [{ start: '20:00', end: '08:00', title: 'Turno Noche', color: '#1e40af' }],
    friday: [{ start: '20:00', end: '08:00', title: 'Turno Noche', color: '#1e40af' }],
    saturday: [{ start: '20:00', end: '08:00', title: 'Turno Noche', color: '#1e40af' }],
    sunday: [{ start: '20:00', end: '08:00', title: 'Turno Noche', color: '#1e40af' }],
  },
  nursing24h: {
    monday: [{ start: '08:00', end: '08:00', title: 'Turno 24h', color: '#0f172a' }],
    tuesday: [{ start: '08:00', end: '08:00', title: 'Turno 24h', color: '#0f172a' }],
    wednesday: [{ start: '08:00', end: '08:00', title: 'Turno 24h', color: '#0f172a' }],
    thursday: [{ start: '08:00', end: '08:00', title: 'Turno 24h', color: '#0f172a' }],
    friday: [{ start: '08:00', end: '08:00', title: 'Turno 24h', color: '#0f172a' }],
    saturday: [{ start: '08:00', end: '08:00', title: 'Turno 24h', color: '#0f172a' }],
    sunday: [{ start: '08:00', end: '08:00', title: 'Turno 24h', color: '#0f172a' }],
  },
  afternoon: {
    monday: [{ start: '13:00', end: '22:00', title: 'Tarde', color: '#f59e0b' }],
    tuesday: [{ start: '13:00', end: '22:00', title: 'Tarde', color: '#f59e0b' }],
    wednesday: [{ start: '13:00', end: '22:00', title: 'Tarde', color: '#f59e0b' }],
    thursday: [{ start: '13:00', end: '22:00', title: 'Tarde', color: '#f59e0b' }],
    friday: [{ start: '13:00', end: '22:00', title: 'Tarde', color: '#f59e0b' }],
  },
  workWeek: {
    monday: [{ start: '09:00', end: '17:00', title: 'Oficina', color: '#6366f1' }],
    tuesday: [{ start: '09:00', end: '17:00', title: 'Oficina', color: '#6366f1' }],
    wednesday: [{ start: '09:00', end: '17:00', title: 'Oficina', color: '#6366f1' }],
    thursday: [{ start: '09:00', end: '17:00', title: 'Oficina', color: '#6366f1' }],
    friday: [{ start: '09:00', end: '17:00', title: 'Oficina', color: '#6366f1' }],
  },
  weekends: {
    saturday: [{ start: '10:00', end: '20:00', title: 'Fin de Semana', color: '#10b981' }],
    sunday: [{ start: '10:00', end: '20:00', title: 'Fin de Semana', color: '#10b981' }],
  },
};

const TEMPLATE_CARDS = [
  { key: 'nursingDay', title: 'Turno Dia', subtitle: 'Todos los dias, 8:00-20:00' },
  { key: 'nursingNight', title: 'Turno Noche', subtitle: 'Todos los dias, 20:00-8:00' },
  { key: 'nursing24h', title: 'Turno 24h', subtitle: 'Todos los dias, 8:00-8:00' },
  { key: 'afternoon', title: 'Tarde', subtitle: 'Lun-Vie, 13:00-22:00' },
  { key: 'workWeek', title: 'Oficina', subtitle: 'Lun-Vie, 9:00-17:00' },
  { key: 'weekends', title: 'Fin de Semana', subtitle: 'Sab-Dom, 10:00-20:00' },
];

interface QuickScheduleViewProps {
  onApply?: () => void;
}

const cloneSlots = (slots: TimeSlot[]) => slots.map((slot) => ({ ...slot }));

const normalizeSlots = (slots: TimeSlot[]) =>
  slots.map((slot) => ({
    ...slot,
    title: slot.title?.trim() || undefined,
    color: slot.color || '#6366f1',
  }));

const mergeSlots = (existingSlots: TimeSlot[], incomingSlots: TimeSlot[]) => {
  const merged = [...existingSlots];

  normalizeSlots(incomingSlots).forEach((incoming) => {
    const alreadyExists = merged.some(
      (slot) =>
        slot.start === incoming.start &&
        slot.end === incoming.end &&
        (slot.title || '') === (incoming.title || '')
    );

    if (!alreadyExists) {
      merged.push(incoming);
    }
  });

  return merged;
};

const QuickScheduleView = ({ onApply }: QuickScheduleViewProps) => {
  const { currentSchedule, selectedDate, updateDayAvailability, loading } =
    useScheduleStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customTemplate, setCustomTemplate] = useState<WeekTemplate>({});
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [applyMode, setApplyMode] = useState<ApplyMode>('append');
  const [customSlots, setCustomSlots] = useState<TimeSlot[]>([
    { start: '09:00', end: '17:00', title: '', color: '#6366f1' },
  ]);

  const handleTemplateSelect = (templateKey: string) => {
    const template = QUICK_TEMPLATES[templateKey];
    setSelectedTemplate(templateKey);
    setCustomTemplate(
      Object.fromEntries(
        Object.entries(template).map(([dayKey, slots]) => [
          dayKey,
          cloneSlots(slots),
        ])
      )
    );
    setSelectedDays(new Set(Object.keys(template)));
  };

  const handleDayToggle = (dayKey: string) => {
    const newSelectedDays = new Set(selectedDays);

    if (newSelectedDays.has(dayKey)) {
      newSelectedDays.delete(dayKey);
      const newTemplate = { ...customTemplate };
      delete newTemplate[dayKey];
      setCustomTemplate(newTemplate);
    } else {
      newSelectedDays.add(dayKey);
      const templateSlots =
        selectedTemplate && QUICK_TEMPLATES[selectedTemplate]?.[dayKey]
          ? QUICK_TEMPLATES[selectedTemplate][dayKey]
          : customSlots;
      setCustomTemplate({
        ...customTemplate,
        [dayKey]: normalizeSlots(templateSlots),
      });
    }

    setSelectedDays(newSelectedDays);
  };

  const handleCustomSlotChange = (
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    setCustomSlots((slots) =>
      slots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, [field]: value } : slot
      )
    );
  };

  const handleAddCustomSlot = () => {
    setCustomSlots((slots) => [
      ...slots,
      { start: '09:00', end: '17:00', title: '', color: '#6366f1' },
    ]);
  };

  const handleRemoveCustomSlot = (index: number) => {
    setCustomSlots((slots) => slots.filter((_, slotIndex) => slotIndex !== index));
  };

  const handleApplyCustomTime = () => {
    if (customSlots.length === 0) {
      alert('Agrega al menos una franja horaria');
      return;
    }

    const newTemplate = { ...customTemplate };
    selectedDays.forEach((dayKey) => {
      newTemplate[dayKey] = normalizeSlots(customSlots);
    });
    setCustomTemplate(newTemplate);
    setSelectedTemplate('custom');
    setShowCustomModal(false);
  };

  const handleApplyTemplate = async () => {
    if (selectedDays.size === 0) {
      alert('Selecciona al menos un dia');
      return;
    }

    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      const daysInMonth = new Date(year, month, 0).getDate();
      const scheduleForMonth =
        currentSchedule?.year === year && currentSchedule.month === month
          ? currentSchedule
          : null;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        const dayKey = DAYS_OF_WEEK[dayOfWeek === 0 ? 6 : dayOfWeek - 1].key;

        if (selectedDays.has(dayKey) && customTemplate[dayKey]) {
          const existingAvailability = scheduleForMonth?.availability.find(
            (availability) => availability.day === day
          );
          const incomingSlots = customTemplate[dayKey];
          const nextSlots =
            applyMode === 'append'
              ? mergeSlots(existingAvailability?.slots || [], incomingSlots)
              : normalizeSlots(incomingSlots);

          await updateDayAvailability(day, nextSlots, existingAvailability?.note);
        }
      }

      alert('Plantilla aplicada con exito');
      if (onApply) onApply();
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Error al aplicar la plantilla');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-800">
            Plantillas Rapidas
          </h3>
          <button
            onClick={() => setShowCustomModal(true)}
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Personalizada
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {TEMPLATE_CARDS.map((template) => (
            <Card
              key={template.key}
              variant={selectedTemplate === template.key ? 'interactive' : 'elevated'}
              className={cn(
                'cursor-pointer transition-all',
                selectedTemplate === template.key && 'ring-2 ring-primary-500'
              )}
              onClick={() => handleTemplateSelect(template.key)}
            >
              <h4 className="text-sm sm:text-base font-semibold text-neutral-800">
                {template.title}
              </h4>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                {template.subtitle}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base sm:text-lg font-semibold text-neutral-800 mb-2 sm:mb-3">
          Dias de la Semana
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.key}
              onClick={() => handleDayToggle(day.key)}
              className={cn(
                'p-3 sm:p-4 rounded-xl border-2 transition-all font-semibold text-center min-h-[72px] sm:min-h-[80px]',
                selectedDays.has(day.key)
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
              )}
            >
              <div className="text-xs sm:text-sm">{day.short}</div>
              <div className="text-xs mt-1 opacity-70">{day.label}</div>
            </button>
          ))}
        </div>
      </div>

      <Card variant="elevated" className="bg-neutral-50 border border-neutral-200">
        <h3 className="text-base font-semibold text-neutral-800 mb-3">
          Como aplicar
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={cn(
              'p-3 rounded-xl border cursor-pointer transition-colors',
              applyMode === 'append'
                ? 'bg-primary-50 border-primary-400 text-primary-800'
                : 'bg-white border-neutral-200 text-neutral-700'
            )}
          >
            <input
              type="radio"
              name="quick-apply-mode"
              value="append"
              checked={applyMode === 'append'}
              onChange={() => setApplyMode('append')}
              className="mr-2 accent-primary-600"
            />
            Agregar sin borrar
            <p className="mt-1 text-xs text-neutral-600">
              Conserva las franjas existentes y evita duplicados iguales.
            </p>
          </label>

          <label
            className={cn(
              'p-3 rounded-xl border cursor-pointer transition-colors',
              applyMode === 'replace'
                ? 'bg-primary-50 border-primary-400 text-primary-800'
                : 'bg-white border-neutral-200 text-neutral-700'
            )}
          >
            <input
              type="radio"
              name="quick-apply-mode"
              value="replace"
              checked={applyMode === 'replace'}
              onChange={() => setApplyMode('replace')}
              className="mr-2 accent-primary-600"
            />
            Reemplazar dias
            <p className="mt-1 text-xs text-neutral-600">
              Borra las franjas de los dias que calzan y deja solo la plantilla.
            </p>
          </label>
        </div>
      </Card>

      {selectedDays.size > 0 && (
        <Card variant="elevated" className="bg-primary-50 border border-primary-200">
          <h4 className="text-sm sm:text-base font-semibold text-primary-900 mb-2 sm:mb-3">
            Vista Previa
          </h4>
          <div className="space-y-2 text-xs sm:text-sm text-primary-800">
            {Array.from(selectedDays).map((dayKey) => {
              const day = DAYS_OF_WEEK.find((d) => d.key === dayKey);
              const slots = customTemplate[dayKey] || [];
              return (
                <div key={dayKey} className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <span className="font-semibold sm:w-24">{day?.label}:</span>
                  <span className="text-primary-700">
                    {slots
                      .map((slot) =>
                        `${slot.title ? `${slot.title}: ` : ''}${slot.start}-${slot.end}`
                      )
                      .join(', ')}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex gap-2 sm:gap-3 justify-stretch sm:justify-end">
        <Button
          onClick={handleApplyTemplate}
          variant="primary"
          loading={loading}
          disabled={selectedDays.size === 0}
          className="flex-1 sm:flex-none justify-center"
        >
          Aplicar al Mes Visible
        </Button>
      </div>

      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">
                  Crear Plantilla Personalizada
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Puedes agregar varias franjas y aplicarlas juntas a los dias seleccionados.
                </p>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {customSlots.map((slot, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-neutral-800">
                      Franja {index + 1}
                    </p>
                    {customSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSlot(index)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Titulo
                      </label>
                      <input
                        type="text"
                        value={slot.title || ''}
                        onChange={(event) =>
                          handleCustomSlotChange(index, 'title', event.target.value)
                        }
                        placeholder="Trabajo, clase, reunion..."
                        maxLength={100}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Inicio
                      </label>
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(event) =>
                          handleCustomSlotChange(index, 'start', event.target.value)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Fin
                      </label>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(event) =>
                          handleCustomSlotChange(index, 'end', event.target.value)
                        }
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={slot.color || '#6366f1'}
                          onChange={(event) =>
                            handleCustomSlotChange(index, 'color', event.target.value)
                          }
                          className="w-14 h-10 border border-neutral-300 rounded-lg cursor-pointer"
                        />
                        <span className="text-xs text-neutral-500">
                          {slot.color || '#6366f1'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-5">
              <Button variant="secondary" onClick={handleAddCustomSlot}>
                Agregar otra franja
              </Button>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setShowCustomModal(false)}
                  variant="secondary"
                >
                  Cancelar
                </Button>
                <Button onClick={handleApplyCustomTime} variant="primary">
                  Usar esta plantilla
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickScheduleView;
