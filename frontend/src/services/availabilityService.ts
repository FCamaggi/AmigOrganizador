import api from './api';
import type { TimeSlot } from './scheduleService';

export type AnalysisMode = 'daily' | 'hourly' | 'custom';

export interface EnhancedTimeSlot extends TimeSlot {
  hours?: number;
  availableCount?: number;
  memberCount?: number;
}

export interface MemberAvailability {
  userId: string;
  username: string;
  fullName?: string;
  slots: TimeSlot[];
  note?: string;
}

export interface DayAvailability {
  day: number;
  availableMembers: MemberAvailability[];
  unavailableMembers: MemberAvailability[];
  availabilityPercentage: number;
  timeSlots: EnhancedTimeSlot[];
  minHoursRequired?: number;
  hourlyData?: any;
}

export interface GroupAvailabilityStats {
  totalDays: number;
  daysWithFullAvailability: number;
  daysWithPartialAvailability: number;
  daysWithNoAvailability: number;
  averageAvailability: number;
  memberCount: number;
  schedulesSubmitted: number;
}

export interface GroupAvailability {
  groupId: string;
  groupName: string;
  month: number;
  year: number;
  availability: DayAvailability[];
  stats: GroupAvailabilityStats;
}

export const availabilityService = {
  /**
   * Obtener disponibilidad grupal para un mes específico
   */
  async getGroupAvailability(
    groupId: string,
    month: number,
    year: number,
    mode: AnalysisMode = 'daily',
    minHours?: number
  ): Promise<GroupAvailability> {
    const response = await api.get(`/availability/group/${groupId}`, {
      params: { month, year, mode, minHours },
    });
    return response.data.data;
  },
};
