import { create } from 'zustand';
import { scheduleService } from '../services/scheduleService';
import type { Schedule, TimeSlot } from '../services/scheduleService';

interface ScheduleState {
  currentSchedule: Schedule | null;
  loading: boolean;
  error: string | null;
  selectedDate: Date;

  // Actions
  setSelectedDate: (date: Date) => void;
  fetchSchedule: (year: number, month: number) => Promise<void>;
  updateDayAvailability: (
    day: number,
    slots: TimeSlot[],
    note?: string
  ) => Promise<void>;
  removeDayAvailability: (day: number) => Promise<void>;
  exportSchedule: () => Promise<void>;
  importSchedule: (file: File) => Promise<void>;
  clearError: () => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  currentSchedule: null,
  loading: false,
  error: null,
  selectedDate: new Date(),

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    get().fetchSchedule(year, month);
  },

  fetchSchedule: async (year: number, month: number) => {
    set({ loading: true, error: null });
    try {
      const schedule = await scheduleService.getSchedule(year, month);
      set({ currentSchedule: schedule, loading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cargar horario';
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateDayAvailability: async (
    day: number,
    slots: TimeSlot[],
    note?: string
  ) => {
    const { selectedDate } = get();
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    set({ loading: true, error: null });
    try {
      const schedule = await scheduleService.updateDayAvailability(
        year,
        month,
        day,
        slots,
        note
      );
      set({ currentSchedule: schedule, loading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al actualizar disponibilidad';
      set({ error: message, loading: false });
      throw error;
    }
  },

  removeDayAvailability: async (day: number) => {
    const { selectedDate } = get();
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    set({ loading: true, error: null });
    try {
      const schedule = await scheduleService.removeDayAvailability(
        year,
        month,
        day
      );
      set({ currentSchedule: schedule, loading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al eliminar disponibilidad';
      set({ error: message, loading: false });
      throw error;
    }
  },

  exportSchedule: async () => {
    const { selectedDate } = get();
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

    try {
      const data = await scheduleService.exportSchedule(year, month);

      // Crear archivo y descargarlo
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `horario_${year}_${month}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al exportar horario';
      set({ error: message });
      throw error;
    }
  },

  importSchedule: async (file: File) => {
    set({ loading: true, error: null });
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validar estructura básica
      if (!data.year || !data.month || !Array.isArray(data.availability)) {
        throw new Error('Formato de archivo inválido');
      }

      const schedule = await scheduleService.importSchedule({
        year: data.year,
        month: data.month,
        availability: data.availability,
      });

      // Actualizar selectedDate y currentSchedule juntos
      const importedDate = new Date(data.year, data.month - 1, 1);
      set({ 
        currentSchedule: schedule, 
        selectedDate: importedDate,
        loading: false 
      });
    } catch (error) {
      const message = (error as Error).message || 'Error al importar horario';
      set({ error: message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
