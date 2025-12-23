import { useState, useCallback } from 'react';
import type { TimeSlot } from '../services/scheduleService';

interface DayAvailability {
  day: number;
  slots: TimeSlot[];
  note?: string;
}

/**
 * Hook personalizado para gestionar la disponibilidad de horarios
 * Simplifica la lógica de edición y validación
 */
export const useAvailabilityEditor = (
  initialAvailability?: DayAvailability
) => {
  // Asegurar que todos los slots tengan color por defecto
  const normalizeSlots = (slots: TimeSlot[]): TimeSlot[] => {
    return slots.map(slot => ({
      ...slot,
      color: slot.color || '#6366f1' // Color por defecto si no existe
    }));
  };

  const [slots, setSlots] = useState<TimeSlot[]>(
    normalizeSlots(initialAvailability?.slots || [])
  );
  const [note, setNote] = useState<string>(initialAvailability?.note || '');
  const [isDirty, setIsDirty] = useState(false);

  // Actualizar slots
  const updateSlots = useCallback((newSlots: TimeSlot[]) => {
    setSlots(newSlots);
    setIsDirty(true);
  }, []);

  // Actualizar nota
  const updateNote = useCallback((newNote: string) => {
    setNote(newNote);
    setIsDirty(true);
  }, []);

  // Agregar slot
  const addSlot = useCallback((slot?: TimeSlot) => {
    const newSlot = slot || { start: '09:00', end: '17:00' };
    setSlots((prev) => [...prev, newSlot]);
    setIsDirty(true);
  }, []);

  // Eliminar slot por índice
  const removeSlot = useCallback((index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  // Actualizar slot específico
  const updateSlot = useCallback(
    (index: number, field: 'start' | 'end', value: string) => {
      setSlots((prev) => {
        const newSlots = [...prev];
        newSlots[index][field] = value;
        return newSlots;
      });
      setIsDirty(true);
    },
    []
  );

  // Limpiar todos los slots
  const clearSlots = useCallback(() => {
    setSlots([]);
    setIsDirty(true);
  }, []);

  // Aplicar plantilla predefinida
  const applyPreset = useCallback((presetSlots: TimeSlot[]) => {
    setSlots(presetSlots);
    setIsDirty(true);
  }, []);

  // Restablecer a valores iniciales
  const reset = useCallback(() => {
    setSlots(normalizeSlots(initialAvailability?.slots || []));
    setNote(initialAvailability?.note || '');
    setIsDirty(false);
  }, [initialAvailability]);

  // Validar slots
  const validate = useCallback((): { valid: boolean; error?: string } => {
    if (slots.length === 0) {
      return { valid: true }; // Permitir días sin disponibilidad
    }

    for (const slot of slots) {
      // Validar formato
      if (
        !slot.start.match(/^\d{2}:\d{2}$/) ||
        !slot.end.match(/^\d{2}:\d{2}$/)
      ) {
        return {
          valid: false,
          error: 'Formato de hora inválido. Use HH:MM',
        };
      }

      // Validar que start < end
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        return {
          valid: false,
          error: 'La hora de inicio debe ser anterior a la hora de fin',
        };
      }

      // Validar duración mínima (30 minutos)
      if (endMinutes - startMinutes < 30) {
        return {
          valid: false,
          error: 'La duración mínima de una franja es 30 minutos',
        };
      }
    }

    return { valid: true };
  }, [slots]);

  // Obtener datos del día
  const getDayData = useCallback(
    (): DayAvailability => ({
      day: initialAvailability?.day || 1,
      slots,
      note: note.trim() || undefined,
    }),
    [initialAvailability, slots, note]
  );

  return {
    // Estado
    slots,
    note,
    isDirty,

    // Acciones
    updateSlots,
    updateNote,
    addSlot,
    removeSlot,
    updateSlot,
    clearSlots,
    applyPreset,
    reset,
    validate,
    getDayData,
  };
};
