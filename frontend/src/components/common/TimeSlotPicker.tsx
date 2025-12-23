import { useState, useCallback } from 'react';

export interface TimeSlot {
  start: string;
  end: string;
  title?: string;
  color?: string;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
  label?: string;
  quickPresets?: boolean;
  allowOverlap?: boolean;
  minDuration?: number; // en minutos
}

// Plantillas predefinidas para slots comunes
const QUICK_PRESETS = [
  { label: 'Todo el día', start: '00:00', end: '23:59' },
  { label: 'Turno Día (Enfermería)', start: '08:00', end: '20:00' },
  { label: 'Turno Noche (Enfermería)', start: '20:00', end: '08:00' },
  { label: 'Turno 24h', start: '08:00', end: '08:00' },
  { label: 'Tarde', start: '13:00', end: '22:00' },
  { label: 'Mañana', start: '08:00', end: '13:00' },
  { label: 'Oficina', start: '09:00', end: '17:00' },
];

// Generar opciones de hora cada 15 minutos
const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      options.push(`${hour}:${minute}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const TimeSlotPicker = ({
  slots,
  onChange,
  label = 'Franjas horarias',
  quickPresets = true,
  allowOverlap = true,
  minDuration = 30,
}: TimeSlotPickerProps) => {
  const [error, setError] = useState<string>('');

  // Validar slot
  const validateSlot = useCallback(
    (slot: TimeSlot): string | null => {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        return 'La hora de inicio debe ser anterior a la hora de fin';
      }

      if (endMinutes - startMinutes < minDuration) {
        return `La duración mínima es ${minDuration} minutos`;
      }

      // Verificar solapamiento si no está permitido
      if (!allowOverlap) {
        for (const existingSlot of slots) {
          const [exStartHour, exStartMin] = existingSlot.start
            .split(':')
            .map(Number);
          const [exEndHour, exEndMin] = existingSlot.end.split(':').map(Number);
          const exStartMinutes = exStartHour * 60 + exStartMin;
          const exEndMinutes = exEndHour * 60 + exEndMin;

          // Detectar solapamiento
          if (
            (startMinutes >= exStartMinutes && startMinutes < exEndMinutes) ||
            (endMinutes > exStartMinutes && endMinutes <= exEndMinutes) ||
            (startMinutes <= exStartMinutes && endMinutes >= exEndMinutes)
          ) {
            return 'Este horario se solapa con otro existente';
          }
        }
      }

      return null;
    },
    [slots, allowOverlap, minDuration]
  );

  const handleAddSlot = () => {
    setError('');
    const newSlot: TimeSlot = { start: '09:00', end: '17:00' };
    onChange([...slots, newSlot]);
  };

  const handleRemoveSlot = (index: number) => {
    setError('');
    onChange(slots.filter((_, i) => i !== index));
  };

  const handleSlotChange = (
    index: number,
    field: 'start' | 'end' | 'title' | 'color',
    value: string
  ) => {
    setError('');
    const newSlots = [...slots];

    if (field === 'title' || field === 'color') {
      newSlots[index][field] = value;
    } else {
      newSlots[index][field] = value;

      // Validar el slot modificado solo si cambiaron las horas
      const validationError = validateSlot(newSlots[index]);
      if (validationError) {
        setError(validationError);
      }
    }

    onChange(newSlots);
  };

  const handleApplyPreset = (preset: TimeSlot) => {
    setError('');
    onChange([...slots, preset]);
  };

  const handleClearAll = () => {
    setError('');
    onChange([]);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-neutral-700">
          {label}
        </label>
        <div className="flex gap-2">
          {slots.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-danger-600 hover:text-danger-700 font-medium min-h-[44px] px-2"
            >
              Limpiar todo
            </button>
          )}
          <button
            type="button"
            onClick={handleAddSlot}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 min-h-[44px] px-2"
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Agregar franja
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      {quickPresets && slots.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">Plantillas rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2 sm:px-3 py-2 text-xs font-medium bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors border border-primary-200 min-h-[44px]"
              >
                {preset.label}
                <span className="ml-1 sm:ml-2 text-primary-500 text-xs">
                  {preset.start} - {preset.end}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slots List */}
      {slots.length === 0 ? (
        <div className="text-center py-6 sm:py-8 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
          <svg
            className="mx-auto w-10 h-10 sm:w-12 sm:h-12 text-neutral-300 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs sm:text-sm text-neutral-500">
            No hay franjas horarias. Agrega una o usa una plantilla.
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {slots.map((slot, index) => (
            <div
              key={index}
              className="p-3 sm:p-4 bg-neutral-50 rounded-xl border border-neutral-200 hover:border-primary-300 transition-colors space-y-3"
            >
              {/* Título del evento */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-600 mb-1">
                    Título del evento (opcional)
                  </label>
                  <input
                    type="text"
                    value={slot.title || ''}
                    onChange={(e) =>
                      handleSlotChange(index, 'title', e.target.value)
                    }
                    placeholder="Ej: Trabajo, Clase, Reunión..."
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    maxLength={100}
                  />
                </div>

                {/* Color picker */}
                <div className="w-full sm:w-auto">
                  <label className="block text-xs text-neutral-600 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={slot.color || '#6366f1'}
                    onChange={(e) =>
                      handleSlotChange(index, 'color', e.target.value)
                    }
                    className="w-full sm:w-16 h-10 bg-white border border-neutral-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Horarios */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Start Time */}
                <div className="flex-1">
                  <label className="block text-xs text-neutral-600 mb-1">
                    Inicio
                  </label>
                  <select
                    value={slot.start}
                    onChange={(e) =>
                      handleSlotChange(index, 'start', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Separator */}
                <div className="hidden sm:block pt-6">
                  <svg
                    className="w-4 h-4 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>

                {/* End Time */}
                <div className="flex-1">
                  <label className="block text-xs text-neutral-600 mb-1">
                    Fin
                  </label>
                  <select
                    value={slot.end}
                    onChange={(e) =>
                      handleSlotChange(index, 'end', e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(index)}
                  className="sm:mt-6 p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
                  aria-label="Eliminar franja"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl text-sm">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-neutral-500">
        💡 Tip: Puedes agregar múltiples franjas horarias para el mismo día
      </p>
    </div>
  );
};

export default TimeSlotPicker;
