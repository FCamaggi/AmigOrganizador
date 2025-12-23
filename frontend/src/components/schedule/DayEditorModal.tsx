import { useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useScheduleStore } from '../../store/scheduleStore';
import { useAvailabilityEditor } from '../../hooks/useAvailabilityEditor';
import type { TimeSlot } from '../../services/scheduleService';
import Modal from '../common/Modal';
import Button from '../common/Button';
import TimeSlotPicker from '../common/TimeSlotPicker';
import Input from '../common/Input';

interface DayEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  existingAvailability?: {
    day: number;
    slots: TimeSlot[];
    note?: string;
  };
}

const DayEditorModal = ({
  isOpen,
  onClose,
  selectedDate,
  existingAvailability,
}: DayEditorModalProps) => {
  const { updateDayAvailability, removeDayAvailability, loading } =
    useScheduleStore();

  const {
    slots,
    note,
    isDirty,
    updateSlots,
    updateNote,
    reset,
    validate,
    getDayData,
  } = useAvailabilityEditor(existingAvailability);

  // Resetear cuando cambia la fecha o disponibilidad
  useEffect(() => {
    reset();
  }, [selectedDate, existingAvailability, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar
    const validation = validate();
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      const day = selectedDate.getDate();
      const dayData = getDayData();
      await updateDayAvailability(day, dayData.slots, dayData.note);
      onClose();
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        '¿Estás seguro de eliminar toda la disponibilidad de este día?'
      )
    ) {
      return;
    }

    try {
      const day = selectedDate.getDate();
      await removeDayAvailability(day);
      onClose();
    } catch (error) {
      console.error('Error removing availability:', error);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (
        window.confirm(
          'Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?'
        )
      ) {
        reset();
        onClose();
      }
    } else {
      onClose();
    }
  };

  const formattedDate = format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={formattedDate}
      description="Define tu disponibilidad para este día"
      size="lg"
      headerGradient
      closeOnOverlayClick={false}
      footer={
        <div className="flex gap-3 justify-end">
          {existingAvailability && existingAvailability.slots.length > 0 && (
            <Button
              type="button"
              onClick={handleDelete}
              variant="danger"
              disabled={loading}
            >
              Eliminar Todo
            </Button>
          )}
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            variant="primary"
            loading={loading}
          >
            Guardar Cambios
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Time Slot Picker */}
        <TimeSlotPicker
          slots={slots}
          onChange={updateSlots}
          label="Eventos / Ocupaciones"
          quickPresets
          allowOverlap
        />

        {/* Note Input */}
        <Input
          label="Nota adicional (opcional)"
          name="note"
          type="text"
          value={note}
          onChange={(e) => {
            if (e.target.value.length <= 200) {
              updateNote(e.target.value);
            }
          }}
          placeholder="Ej: Disponible para reuniones de equipo"
          hint={`${note.length}/200 caracteres`}
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
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          }
        />

        {/* Helper Info */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <h4 className="font-semibold text-primary-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Consejos
          </h4>
          <ul className="text-sm text-primary-800 space-y-1">
            <li>
              • Usa las plantillas rápidas para configurar horarios comunes
            </li>
            <li>• Puedes agregar múltiples franjas horarias en el mismo día</li>
            <li>• Los horarios se mostrarán a tus grupos automáticamente</li>
          </ul>
        </div>
      </form>
    </Modal>
  );
};

export default DayEditorModal;
