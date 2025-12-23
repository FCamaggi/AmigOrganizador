import { useState } from 'react';
import { useScheduleStore } from '../../store/scheduleStore';
import { cn } from '../../styles/design-system';
import Button from '../common/Button';
import Card from '../common/Card';
import type { TimeSlot } from '../../services/scheduleService';

interface WeekTemplate {
  [day: string]: TimeSlot[];
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes', short: 'Lun' },
  { key: 'tuesday', label: 'Martes', short: 'Mar' },
  { key: 'wednesday', label: 'Miércoles', short: 'Mié' },
  { key: 'thursday', label: 'Jueves', short: 'Jue' },
  { key: 'friday', label: 'Viernes', short: 'Vie' },
  { key: 'saturday', label: 'Sábado', short: 'Sáb' },
  { key: 'sunday', label: 'Domingo', short: 'Dom' },
];

const QUICK_TEMPLATES: { [key: string]: WeekTemplate } = {
  workWeek: {
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '17:00' }],
  },
  partTime: {
    monday: [{ start: '14:00', end: '18:00' }],
    tuesday: [{ start: '14:00', end: '18:00' }],
    wednesday: [{ start: '14:00', end: '18:00' }],
    thursday: [{ start: '14:00', end: '18:00' }],
    friday: [{ start: '14:00', end: '18:00' }],
  },
  evenings: {
    monday: [{ start: '18:00', end: '22:00' }],
    tuesday: [{ start: '18:00', end: '22:00' }],
    wednesday: [{ start: '18:00', end: '22:00' }],
    thursday: [{ start: '18:00', end: '22:00' }],
    friday: [{ start: '18:00', end: '22:00' }],
  },
  weekends: {
    saturday: [{ start: '10:00', end: '20:00' }],
    sunday: [{ start: '10:00', end: '20:00' }],
  },
};

interface QuickScheduleViewProps {
  onApply?: () => void;
}

const QuickScheduleView = ({ onApply }: QuickScheduleViewProps) => {
  const { updateDayAvailability, loading } = useScheduleStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customTemplate, setCustomTemplate] = useState<WeekTemplate>({});
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    setCustomTemplate(QUICK_TEMPLATES[templateKey]);
    setSelectedDays(new Set(Object.keys(QUICK_TEMPLATES[templateKey])));
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
      setCustomTemplate({
        ...customTemplate,
        [dayKey]: [{ start: '09:00', end: '17:00' }],
      });
    }
    setSelectedDays(newSelectedDays);
  };

  const handleApplyTemplate = async () => {
    if (selectedDays.size === 0) {
      alert('Selecciona al menos un día');
      return;
    }

    try {
      // Aplicar el template a todos los días seleccionados del mes actual
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const daysInMonth = new Date(year, month, 0).getDate();

      const updates: Promise<void>[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        const dayKey = DAYS_OF_WEEK[dayOfWeek === 0 ? 6 : dayOfWeek - 1].key;

        if (selectedDays.has(dayKey) && customTemplate[dayKey]) {
          updates.push(
            updateDayAvailability(day, customTemplate[dayKey], undefined)
          );
        }
      }

      await Promise.all(updates);
      alert('✅ Plantilla aplicada con éxito');
      if (onApply) onApply();
    } catch (error) {
      console.error('Error applying template:', error);
      alert('❌ Error al aplicar la plantilla');
    }
  };

  return (
    <div className="space-y-6">
      {/* Templates predefinidas */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-3">
          Plantillas Rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card
            variant={
              selectedTemplate === 'workWeek' ? 'interactive' : 'elevated'
            }
            className={cn(
              'cursor-pointer transition-all',
              selectedTemplate === 'workWeek' && 'ring-2 ring-primary-500'
            )}
            onClick={() => handleTemplateSelect('workWeek')}
          >
            <div className="text-3xl mb-2">💼</div>
            <h4 className="font-semibold text-neutral-800">Jornada Completa</h4>
            <p className="text-sm text-neutral-600 mt-1">Lun-Vie, 9:00-17:00</p>
          </Card>

          <Card
            variant={
              selectedTemplate === 'partTime' ? 'interactive' : 'elevated'
            }
            className={cn(
              'cursor-pointer transition-all',
              selectedTemplate === 'partTime' && 'ring-2 ring-primary-500'
            )}
            onClick={() => handleTemplateSelect('partTime')}
          >
            <div className="text-3xl mb-2">⏰</div>
            <h4 className="font-semibold text-neutral-800">Media Jornada</h4>
            <p className="text-sm text-neutral-600 mt-1">
              Lun-Vie, 14:00-18:00
            </p>
          </Card>

          <Card
            variant={
              selectedTemplate === 'evenings' ? 'interactive' : 'elevated'
            }
            className={cn(
              'cursor-pointer transition-all',
              selectedTemplate === 'evenings' && 'ring-2 ring-primary-500'
            )}
            onClick={() => handleTemplateSelect('evenings')}
          >
            <div className="text-3xl mb-2">🌙</div>
            <h4 className="font-semibold text-neutral-800">Noches</h4>
            <p className="text-sm text-neutral-600 mt-1">
              Lun-Vie, 18:00-22:00
            </p>
          </Card>

          <Card
            variant={
              selectedTemplate === 'weekends' ? 'interactive' : 'elevated'
            }
            className={cn(
              'cursor-pointer transition-all',
              selectedTemplate === 'weekends' && 'ring-2 ring-primary-500'
            )}
            onClick={() => handleTemplateSelect('weekends')}
          >
            <div className="text-3xl mb-2">🎉</div>
            <h4 className="font-semibold text-neutral-800">Fin de Semana</h4>
            <p className="text-sm text-neutral-600 mt-1">
              Sáb-Dom, 10:00-20:00
            </p>
          </Card>
        </div>
      </div>

      {/* Selector de días */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-3">
          Días de la Semana
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.key}
              onClick={() => handleDayToggle(day.key)}
              className={cn(
                'p-4 rounded-xl border-2 transition-all font-semibold text-center',
                selectedDays.has(day.key)
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
              )}
            >
              <div className="text-sm">{day.short}</div>
              <div className="text-xs mt-1 opacity-70">{day.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {selectedDays.size > 0 && (
        <Card
          variant="elevated"
          className="bg-primary-50 border border-primary-200"
        >
          <h4 className="font-semibold text-primary-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Vista Previa
          </h4>
          <div className="space-y-2 text-sm text-primary-800">
            {Array.from(selectedDays).map((dayKey) => {
              const day = DAYS_OF_WEEK.find((d) => d.key === dayKey);
              const slots = customTemplate[dayKey] || [];
              return (
                <div key={dayKey} className="flex items-center gap-2">
                  <span className="font-semibold w-24">{day?.label}:</span>
                  <span className="text-primary-600">
                    {slots.map((s) => `${s.start}-${s.end}`).join(', ')}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          onClick={handleApplyTemplate}
          variant="primary"
          loading={loading}
          disabled={selectedDays.size === 0}
          icon={
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          }
        >
          Aplicar al Mes Actual
        </Button>
      </div>

      {/* Help */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-600">
        <p className="font-semibold mb-2">💡 Cómo funciona:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Selecciona una plantilla predefinida o personaliza tus días</li>
          <li>Elige los días de la semana que quieres configurar</li>
          <li>Al aplicar, se configurarán todos esos días en el mes actual</li>
          <li>Podrás ajustar días específicos manualmente después</li>
        </ul>
      </div>
    </div>
  );
};

export default QuickScheduleView;
