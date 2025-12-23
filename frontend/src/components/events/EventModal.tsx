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
import Modal from '../common/Modal';

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

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title={eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}
      size="lg"
      headerGradient={true}
      footer={
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              onClose();
              resetForm();
            }}
            disabled={loading}
            className="w-full sm:flex-1 justify-center"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:flex-1 justify-center"
            onClick={handleSubmit}
          >
            {loading
              ? 'Guardando...'
              : eventToEdit
              ? 'Actualizar'
              : 'Crear Evento'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                  className={`p-2 sm:p-3 rounded-xl border-2 transition-all text-left ${
                    selectedTemplateId === template._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <div
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mb-1"
                    style={{ backgroundColor: template.color }}
                  />
                  <div className="text-xs sm:text-sm font-medium truncate">{template.name}</div>
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
            className="w-full px-3 sm:px-4 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            rows={3}
            placeholder="Agrega detalles sobre este evento..."
          />
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                    className="flex-1 px-2 sm:px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                  <span className="text-neutral-500 text-sm">a</span>
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(e) =>
                      handleTimeSlotChange(index, 'end', e.target.value)
                    }
                    className="flex-1 px-2 sm:px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                  {timeSlotInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTimeSlot(index)}
                      className="text-red-600 hover:text-red-700 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
            <div className="space-y-3 pl-4 sm:pl-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Frecuencia
                </label>
                <select
                  value={formData.recurrence?.frequency}
                  onChange={(e) =>
                    handleRecurrenceChange('frequency', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
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
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDayOfWeekToggle(index)}
                        className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
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
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default EventModal;
