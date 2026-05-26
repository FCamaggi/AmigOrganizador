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
  nursingDay: {
    monday: [{ start: '08:00', end: '20:00' }],
    tuesday: [{ start: '08:00', end: '20:00' }],
    wednesday: [{ start: '08:00', end: '20:00' }],
    thursday: [{ start: '08:00', end: '20:00' }],
    friday: [{ start: '08:00', end: '20:00' }],
    saturday: [{ start: '08:00', end: '20:00' }],
    sunday: [{ start: '08:00', end: '20:00' }],
  },
  nursingNight: {
    monday: [{ start: '20:00', end: '08:00' }],
    tuesday: [{ start: '20:00', end: '08:00' }],
    wednesday: [{ start: '20:00', end: '08:00' }],
    thursday: [{ start: '20:00', end: '08:00' }],
    friday: [{ start: '20:00', end: '08:00' }],
    saturday: [{ start: '20:00', end: '08:00' }],
    sunday: [{ start: '20:00', end: '08:00' }],
  },
  nursing24h: {
    monday: [{ start: '08:00', end: '08:00' }],
    tuesday: [{ start: '08:00', end: '08:00' }],
    wednesday: [{ start: '08:00', end: '08:00' }],
    thursday: [{ start: '08:00', end: '08:00' }],
    friday: [{ start: '08:00', end: '08:00' }],
    saturday: [{ start: '08:00', end: '08:00' }],
    sunday: [{ start: '08:00', end: '08:00' }],
  },
  afternoon: {
    monday: [{ start: '13:00', end: '22:00' }],
    tuesday: [{ start: '13:00', end: '22:00' }],
    wednesday: [{ start: '13:00', end: '22:00' }],
    thursday: [{ start: '13:00', end: '22:00' }],
    friday: [{ start: '13:00', end: '22:00' }],
  },
  workWeek: {
    monday: [{ start: '09:00', end: '17:00' }],
    tuesday: [{ start: '09:00', end: '17:00' }],
    wednesday: [{ start: '09:00', end: '17:00' }],
    thursday: [{ start: '09:00', end: '17:00' }],
    friday: [{ start: '09:00', end: '17:00' }],
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
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('09:00');
  const [customEndTime, setCustomEndTime] = useState('17:00');
  const [customTitle, setCustomTitle] = useState('');
  const [customColor, setCustomColor] = useState('#6366f1');

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
        [dayKey]: [{
          start: customStartTime,
          end: customEndTime,
          title: customTitle || undefined,
          color: customColor,
        }],
      });
    }
    setSelectedDays(newSelectedDays);
  };

  const handleCreateCustomTemplate = () => {
    setShowCustomModal(true);
  };

  const handleApplyCustomTime = () => {
    // Actualizar todos los días seleccionados con el horario personalizado
    const newTemplate = { ...customTemplate };
    selectedDays.forEach((dayKey) => {
      newTemplate[dayKey] = [{
        start: customStartTime,
        end: customEndTime,
        title: customTitle || undefined,
        color: customColor,
      }];
    });
    setCustomTemplate(newTemplate);
    setSelectedTemplate('custom');
    setShowCustomModal(false);
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

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        const dayKey = DAYS_OF_WEEK[dayOfWeek === 0 ? 6 : dayOfWeek - 1].key;

        if (selectedDays.has(dayKey) && customTemplate[dayKey]) {
          await updateDayAvailability(day, customTemplate[dayKey], undefined);
        }
      }
      alert('✅ Plantilla aplicada con éxito');
      if (onApply) onApply();
    } catch (error) {
      console.error('Error applying template:', error);
      alert('❌ Error al aplicar la plantilla');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Templates predefinidas */}
      <div>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-800">
            Plantillas Rápidas
          </h3>
          <button
            onClick={handleCreateCustomTemplate}
            className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Personalizada
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {/* Plantillas de Enfermería */}
          <Card
            variant={
              selectedTemplate === 'nursingDay' ? 'interactive' : 'elevated'
            }
            className={cn(
              'cursor-pointer transition-all',
              selectedTemplate === 'nursingDay' && 'ring-2 ring-primary-500'
            )}
            onClick={() => handleTemplateSelect('nursingDay')}
          >
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🏥</div>
            <h4 className="text-sm sm:text-base font-semibold text-neutral-800">Turno Día</h4>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">Todos los días, 8:00-20:00</p>
          </Card>

          <Card
            variant={
              selectedTemplate === 'nursingNight' ? 'interactive' : 'elevated'
            }
            className={cn(
              'cursor-pointer transition-all',
              selectedTemplate === 'nursingNight' && 'ring-2 ring-primary-500'
            )}
            onClick={() => handleTemplateSelect('nursingNight')}
          >
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🌙</div>
            <h4 className="text-sm sm:text-base font-semibold text-neutral-800">Turno Noche</h4>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Todos los días, 20:00-8:00
            </p>
          </Card>

          <Card
            variant={
              selectedTemplate === 'nursing24h' ? 'interactive' : 'elevated'
            }
            className={cn(
              'cursor-pointer transition-all',
              selectedTemplate === 'nursing24h' && 'ring-2 ring-primary-500'
            )}
            onClick={() => handleTemplateSelect('nursing24h')}
          >
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">⏰</div>
            <h4 className="text-sm sm:text-base font-semibold text-neutral-800">Turno 24h</h4>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Todos los días, 8:00-8:00
            </p>
          </Card>

          {/* Otras plantillas */}
          <Card
            variant={
              selectedTemplate === 'afternoon' ? 'interactive' : 'elevated'
            }
            className={cn(
              'cursor-pointer transition-all',
              selectedTemplate === 'afternoon' && 'ring-2 ring-primary-500'
            )}
            onClick={() => handleTemplateSelect('afternoon')}
          >
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🌆</div>
            <h4 className="text-sm sm:text-base font-semibold text-neutral-800">Tarde</h4>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Lun-Vie, 13:00-22:00
            </p>
          </Card>

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
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💼</div>
            <h4 className="text-sm sm:text-base font-semibold text-neutral-800">Oficina</h4>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">Lun-Vie, 9:00-17:00</p>
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
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🎉</div>
            <h4 className="text-sm sm:text-base font-semibold text-neutral-800">Fin de Semana</h4>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Sáb-Dom, 10:00-20:00
            </p>
          </Card>
        </div>
      </div>

      {/* Selector de días */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-neutral-800 mb-2 sm:mb-3">
          Días de la Semana
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

      {/* Preview */}
      {selectedDays.size > 0 && (
        <Card
          variant="elevated"
          className="bg-primary-50 border border-primary-200"
        >
          <h4 className="text-sm sm:text-base font-semibold text-primary-900 mb-2 sm:mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Vista Previa
          </h4>
          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-primary-800">
            {Array.from(selectedDays).map((dayKey) => {
              const day = DAYS_OF_WEEK.find((d) => d.key === dayKey);
              const slots = customTemplate[dayKey] || [];
              return (
                <div key={dayKey} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="font-semibold sm:w-24">{day?.label}:</span>
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
      <div className="flex gap-2 sm:gap-3 justify-stretch sm:justify-end">
        <Button
          onClick={handleApplyTemplate}
          variant="primary"
          loading={loading}
          disabled={selectedDays.size === 0}
          className="flex-1 sm:flex-none justify-center"
          icon={
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
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
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-neutral-600">
        <p className="font-semibold mb-2">💡 Cómo funciona:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Selecciona una plantilla predefinida o crea una personalizada</li>
          <li>Elige los días de la semana que quieres configurar</li>
          <li>Al aplicar, se configurarán todos esos días en el mes actual</li>
          <li>Podrás ajustar días específicos manualmente después</li>
        </ul>
      </div>

      {/* Modal Plantilla Personalizada */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 mb-4">
              Crear Plantilla Personalizada
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ej: Trabajo, Clase, Reunión..."
                  maxLength={100}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-16 h-10 border border-neutral-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-neutral-500">{customColor}</span>
                </div>
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <p className="text-sm text-primary-800">
                  <strong>Vista previa:</strong>{customTitle ? ` ${customTitle} —` : ''} {customStartTime} - {customEndTime}
                </p>
                <p className="text-xs text-primary-600 mt-1">
                  Esta plantilla se aplicará a los días que selecciones
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowCustomModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApplyCustomTime}
                variant="primary"
                className="flex-1"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickScheduleView;
