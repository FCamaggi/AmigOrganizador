import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useScheduleStore } from '../../store/scheduleStore';
import { useAvailabilityEditor } from '../../hooks/useAvailabilityEditor';
import { scheduleService, type TimeSlot } from '../../services/scheduleService';
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

interface CascadeDeleteCandidate {
  id: string;
  day: number;
  slotIndex: number;
  slot: TimeSlot;
  note?: string;
  isCurrent: boolean;
}

const normalizeSlotValue = (value?: string) => (value || '').trim();

const slotsMatch = (a: TimeSlot, b: TimeSlot) =>
  a.start === b.start &&
  a.end === b.end &&
  normalizeSlotValue(a.title) === normalizeSlotValue(b.title) &&
  normalizeSlotValue(a.color || '#6366f1') ===
    normalizeSlotValue(b.color || '#6366f1');

const DayEditorModal = ({
  isOpen,
  onClose,
  selectedDate,
  existingAvailability,
}: DayEditorModalProps) => {
  const {
    currentSchedule,
    updateDayAvailability,
    removeDayAvailability,
    fetchSchedule,
    loading,
  } =
    useScheduleStore();
  const [cascadeCandidates, setCascadeCandidates] = useState<
    CascadeDeleteCandidate[]
  >([]);
  const [selectedCascadeIds, setSelectedCascadeIds] = useState<Set<string>>(
    new Set()
  );
  const [cascadeLoading, setCascadeLoading] = useState(false);

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
    setCascadeCandidates([]);
    setSelectedCascadeIds(new Set());
  }, [selectedDate, existingAvailability, reset]);

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;
  const selectedDay = selectedDate.getDate();

  const selectedCascadeCandidates = useMemo(
    () =>
      cascadeCandidates.filter((candidate) =>
        selectedCascadeIds.has(candidate.id)
      ),
    [cascadeCandidates, selectedCascadeIds]
  );

  const hasCascadeOutsideCurrentDay = selectedCascadeCandidates.some(
    (candidate) => !candidate.isCurrent
  );

  const closeCascadeDelete = () => {
    if (cascadeLoading) return;
    setCascadeCandidates([]);
    setSelectedCascadeIds(new Set());
  };

  const removeLocalSlotsByIndexes = (indexes: number[]) => {
    const indexesToRemove = new Set(indexes);
    updateSlots(slots.filter((_, index) => !indexesToRemove.has(index)));
  };

  const handleSlotRemoveRequest = (index: number, slot: TimeSlot) => {
    const scheduleMatches =
      currentSchedule?.availability.flatMap((dayAvailability) =>
        dayAvailability.slots
          .map((candidateSlot, slotIndex) => ({
            candidateSlot,
            slotIndex,
          }))
          .filter(({ candidateSlot }) => slotsMatch(candidateSlot, slot))
          .map(({ candidateSlot, slotIndex }) => ({
            id: `${dayAvailability.day}-${slotIndex}`,
            day: dayAvailability.day,
            slotIndex,
            slot: candidateSlot,
            note: dayAvailability.note,
            isCurrent:
              dayAvailability.day === selectedDay && slotIndex === index,
          }))
      ) || [];

    const hasOtherMatches = scheduleMatches.some(
      (candidate) => !candidate.isCurrent
    );

    if (!hasOtherMatches) {
      removeLocalSlotsByIndexes([index]);
      return;
    }

    const currentCandidate =
      scheduleMatches.find((candidate) => candidate.isCurrent) || {
        id: `${selectedDay}-${index}`,
        day: selectedDay,
        slotIndex: index,
        slot,
        note,
        isCurrent: true,
      };

    const candidates = scheduleMatches.some(
      (candidate) => candidate.id === currentCandidate.id
    )
      ? scheduleMatches
      : [currentCandidate, ...scheduleMatches];

    setCascadeCandidates(
      candidates.sort((a, b) => a.day - b.day || a.slotIndex - b.slotIndex)
    );
    setSelectedCascadeIds(new Set([currentCandidate.id]));
  };

  const toggleCascadeCandidate = (candidateId: string) => {
    setSelectedCascadeIds((current) => {
      const next = new Set(current);
      if (next.has(candidateId)) {
        next.delete(candidateId);
      } else {
        next.add(candidateId);
      }
      return next;
    });
  };

  const selectAllCascadeCandidates = () => {
    setSelectedCascadeIds(
      new Set(cascadeCandidates.map((candidate) => candidate.id))
    );
  };

  const selectOnlyCurrentCascadeCandidate = () => {
    setSelectedCascadeIds(
      new Set(
        cascadeCandidates
          .filter((candidate) => candidate.isCurrent)
          .map((candidate) => candidate.id)
      )
    );
  };

  const confirmCascadeDelete = async () => {
    if (selectedCascadeCandidates.length === 0) {
      return;
    }

    const currentDayIndexes = selectedCascadeCandidates
      .filter((candidate) => candidate.isCurrent)
      .map((candidate) => candidate.slotIndex);

    if (!hasCascadeOutsideCurrentDay) {
      removeLocalSlotsByIndexes(currentDayIndexes);
      closeCascadeDelete();
      return;
    }

    setCascadeLoading(true);
    try {
      const candidatesByDay = selectedCascadeCandidates.reduce<
        Record<number, CascadeDeleteCandidate[]>
      >((acc, candidate) => {
        acc[candidate.day] = acc[candidate.day] || [];
        acc[candidate.day].push(candidate);
        return acc;
      }, {});

      for (const [dayKey, dayCandidates] of Object.entries(candidatesByDay)) {
        const day = Number(dayKey);
        const sourceAvailability = currentSchedule?.availability.find(
          (availability) => availability.day === day
        );
        const sourceSlots =
          day === selectedDay ? slots : sourceAvailability?.slots || [];
        const indexesToRemove = new Set(
          dayCandidates.map((candidate) => candidate.slotIndex)
        );
        const nextSlots = sourceSlots.filter(
          (_, slotIndex) => !indexesToRemove.has(slotIndex)
        );

        await scheduleService.updateDayAvailability(
          selectedYear,
          selectedMonth,
          day,
          nextSlots,
          day === selectedDay ? note : sourceAvailability?.note
        );
      }

      await fetchSchedule(selectedYear, selectedMonth);
      setCascadeCandidates([]);
      setSelectedCascadeIds(new Set());
      onClose();
    } catch (error) {
      console.error('Error deleting repeated slots:', error);
    } finally {
      setCascadeLoading(false);
    }
  };

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
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
          {existingAvailability && existingAvailability.slots.length > 0 && (
            <Button
              type="button"
              onClick={handleDelete}
              variant="danger"
              disabled={loading}
              className="w-full sm:w-auto order-first sm:order-none"
            >
              Eliminar Todo
            </Button>
          )}
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            variant="primary"
            loading={loading}
            className="w-full sm:w-auto"
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
          onRemoveSlotRequest={handleSlotRemoveRequest}
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
            <li>• Si una franja termina antes o a la misma hora que inicia, termina al día siguiente</li>
            <li>• Los horarios se mostrarán a tus grupos automáticamente</li>
          </ul>
        </div>
      </form>

      {cascadeCandidates.length > 0 && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-neutral-950/60 px-3 py-4">
          <div className="w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-neutral-200">
            <div className="px-4 sm:px-6 py-4 border-b border-neutral-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Limpiar horarios repetidos
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    Encontramos coincidencias exactas de esta franja. Por
                    defecto solo se elimina la que elegiste.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCascadeDelete}
                  className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label="Cerrar limpieza en cascada"
                  disabled={cascadeLoading}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="max-h-[48vh] overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={selectAllCascadeCandidates}
                  disabled={cascadeLoading}
                  className="text-xs"
                >
                  Marcar todos
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={selectOnlyCurrentCascadeCandidate}
                  disabled={cascadeLoading}
                  className="text-xs"
                >
                  Solo este horario
                </Button>
              </div>

              {cascadeCandidates.map((candidate) => {
                const isSelected = selectedCascadeIds.has(candidate.id);
                const slotTitle = candidate.slot.title || 'Sin titulo';

                return (
                  <label
                    key={candidate.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-neutral-200 bg-white hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCascadeCandidate(candidate.id)}
                      disabled={cascadeLoading}
                      className="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: candidate.slot.color || '#6366f1' }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-neutral-900">
                          Dia {candidate.day}
                        </span>
                        {candidate.isCurrent && (
                          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                            Este horario
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-neutral-600">
                        {slotTitle} - {candidate.slot.start} -{' '}
                        {candidate.slot.end}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="border-t border-neutral-200 px-4 sm:px-6 py-4">
              {hasCascadeOutsideCurrentDay && (
                <p className="mb-3 text-xs text-warning-700 bg-warning-50 border border-warning-200 rounded-lg px-3 py-2">
                  Al borrar en cascada se guardaran esos cambios de inmediato y
                  se cerrara el editor del dia.
                </p>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeCascadeDelete}
                  disabled={cascadeLoading}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={confirmCascadeDelete}
                  loading={cascadeLoading}
                  disabled={selectedCascadeCandidates.length === 0}
                  className="w-full sm:w-auto"
                >
                  Eliminar seleccionados
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DayEditorModal;
