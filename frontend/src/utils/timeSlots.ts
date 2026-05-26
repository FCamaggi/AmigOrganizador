import type { TimeSlot } from '../services/scheduleService';

export const MINUTES_IN_DAY = 24 * 60;

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const normalized = Math.max(0, Math.min(minutes, MINUTES_IN_DAY));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const isOvernightSlot = (slot: TimeSlot): boolean =>
  timeToMinutes(slot.end) < timeToMinutes(slot.start);

export const isFullDaySlot = (slot: TimeSlot): boolean =>
  timeToMinutes(slot.end) === timeToMinutes(slot.start);

export const slotDurationMinutes = (slot: TimeSlot): number => {
  const start = timeToMinutes(slot.start);
  const end = timeToMinutes(slot.end);

  if (start === end) return MINUTES_IN_DAY;
  if (end < start) return MINUTES_IN_DAY - start + end;
  return end - start;
};

export const getContinuationSlot = (slot: TimeSlot): TimeSlot | null => {
  if (isFullDaySlot(slot)) {
    return { ...slot, start: '00:00', end: slot.end };
  }

  if (isOvernightSlot(slot)) {
    return { ...slot, start: '00:00', end: slot.end };
  }

  return null;
};
