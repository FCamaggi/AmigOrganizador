import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useEventStore } from '../../store/eventStore';
import type {
  CreateEventData,
  TimeSlot,
  Recurrence,
  Event,
} from '../../services/eventService';
import Button from '../common/Button';
import Input from '../common/Input';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
  eventToEdit?: Event | null;
}

const EventModal = ({
  isOpen,
  onClose,
  initialDate,
  eventToEdit,
}: EventModalProps) => {
  const {
    userTemplates,
    createEvent,
    updateEvent,
    fetchUserTemplates,
    loading,
  } = useEventStore();

  const getInitialFormData = (): CreateEventData => {
    if (eventToEdit) {
      return {
        title: eventToEdit.title,
        description: eventToEdit.description || '',
        category: eventToEdit.category,
        userTemplateId: eventToEdit.userTemplate,
        color: eventToEdit.color,
        startDate: eventToEdit.startDate.split('T')[0],
        endDate: eventToEdit.endDate.split('T')[0],
        timeSlots: eventToEdit.timeSlots,
        allDay: eventToEdit.allDay,
        recurrence: eventToEdit.recurrence,
      };
    }
    return {
      title: '',
      description: '',
      category: 'custom',
      userTemplateId: undefined,
      color: '#6b7280',
      startDate: initialDate
        ? initialDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      endDate: initialDate
        ? initialDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      timeSlots: [],
      allDay: false,
      recurrence: {
        enabled: false,
        frequency: 'weekly',
        daysOfWeek: [],
        daysOfMonth: [],
      },
    };
  };

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    eventToEdit?.userTemplate || ''
  );
  const [formData, setFormData] = useState<CreateEventData>(getInitialFormData);
  const [timeSlotInputs, setTimeSlotInputs] = useState<TimeSlot[]>(
    eventToEdit && eventToEdit.timeSlots && eventToEdit.timeSlots.length > 0
      ? eventToEdit.timeSlots
      : [{ start: '08:00', end: '17:00' }]
  );
  const [showRecurrence, setShowRecurrence] = useState(
    eventToEdit?.recurrence?.enabled || false
  );

  useEffect(() => {
    if (isOpen) {
      fetchUserTemplates();
    }
  }, [isOpen, fetchUserTemplates]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = userTemplates.find((t) => t._id === templateId);

    if (template) {
      setFormData((prev) => ({
        ...prev,
        category: template.category,
        userTemplateId: templateId,
        color: template.color,
        allDay: template.defaultSlots.some(
          (s) => s.start === '00:00' && s.end === '23:59'
        ),
      }));

      if (template.defaultSlots.length > 0) {
        setTimeSlotInputs(template.defaultSlots);
      }
    }
  };

  const handleAddTimeSlot = () => {
    setTimeSlotInputs([...timeSlotInputs, { start: '08:00', end: '17:00' }]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlotInputs(timeSlotInputs.filter((_, i) => i !== index));
  };

  const handleTimeSlotChange = (
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const updated = [...timeSlotInputs];
    updated[index][field] = value;
    setTimeSlotInputs(updated);
  };

  const handleRecurrenceToggle = (enabled: boolean) => {
    setShowRecurrence(enabled);
    setFormData((prev) => ({
      ...prev,
      recurrence: {
        ...prev.recurrence!,
        enabled,
      },
    }));
  };

  const handleRecurrenceChange = (
    field: keyof Recurrence,
    value: string | number[] | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      recurrence: {
        ...prev.recurrence!,
        [field]: value,
      },
    }));
  };

  const handleDayOfWeekToggle = (day: number) => {
    const current = formData.recurrence?.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];

    handleRecurrenceChange('daysOfWeek', updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    const eventData: CreateEventData = {
      ...formData,
      timeSlots: formData.allDay ? [] : timeSlotInputs,
    };

    try {
      if (eventToEdit) {
        await updateEvent(eventToEdit._id, eventData);
      } else {
        await createEvent(eventData);
      }
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error al guardar evento:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'custom',
      userTemplateId: undefined,
      color: '#6b7280',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      timeSlots: [],
      allDay: false,
      recurrence: {
        enabled: false,
        frequency: 'weekly',
        daysOfWeek: [],
        daysOfMonth: [],
      },
    });
    setSelectedTemplateId('');
    setTimeSlotInputs([{ start: '08:00', end: '17:00' }]);
    setShowRecurrence(false);
  };

  if (!isOpen) return null;

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-accent-500 p-6 text-white">
          <h2 className="text-2xl font-bold">
            {eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Plantillas */}
          {!eventToEdit && (
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                Plantilla
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {userTemplates.map((template) => (
                  <button
                    key={template._id}
                    type="button"
                    onClick={() => handleTemplateSelect(template._id)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedTemplateId === template._id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full mb-1"
                      style={{ backgroundColor: template.color }}
                    />
                    <div className="text-sm font-medium">{template.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Título */}
          <Input
            name="title"
            label="Título"
            type="text"
            value={formData.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Ej: Reunión de trabajo"
            required
          />

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Agrega detalles sobre este evento..."
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="startDate"
              label="Fecha inicio"
              type="date"
              value={formData.startDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
            <Input
              name="endDate"
              label="Fecha fin"
              type="date"
              value={formData.endDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              required
            />
          </div>

          {/* Todo el día */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) =>
                setFormData({ ...formData, allDay: e.target.checked })
              }
              className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
            />
            <label
              htmlFor="allDay"
              className="text-sm font-medium text-neutral-700"
            >
              Todo el día
            </label>
          </div>

          {/* Horarios */}
          {!formData.allDay && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-neutral-700">
                  Horarios
                </label>
                <button
                  type="button"
                  onClick={handleAddTimeSlot}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Agregar horario
                </button>
              </div>
              <div className="space-y-2">
                {timeSlotInputs.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) =>
                        handleTimeSlotChange(index, 'start', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-neutral-500">a</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) =>
                        handleTimeSlotChange(index, 'end', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {timeSlotInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(index)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurrencia */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="recurrence"
                checked={showRecurrence}
                onChange={(e) => handleRecurrenceToggle(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
              />
              <label
                htmlFor="recurrence"
                className="text-sm font-semibold text-neutral-700"
              >
                Evento recurrente
              </label>
            </div>

            {showRecurrence && (
              <div className="space-y-3 pl-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Frecuencia
                  </label>
                  <select
                    value={formData.recurrence?.frequency}
                    onChange={(e) =>
                      handleRecurrenceChange('frequency', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>

                {formData.recurrence?.frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Días de la semana
                    </label>
                    <div className="flex gap-2">
                      {dayNames.map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleDayOfWeekToggle(index)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            formData.recurrence?.daysOfWeek?.includes(index)
                              ? 'bg-primary-600 text-white'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Fecha de fin (opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.recurrence?.endDate || ''}
                    onChange={(e) =>
                      handleRecurrenceChange('endDate', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onClose();
                resetForm();
              }}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading
                ? 'Guardando...'
                : eventToEdit
                ? 'Actualizar'
                : 'Crear Evento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
