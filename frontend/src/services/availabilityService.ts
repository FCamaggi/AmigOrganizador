import api from './api';
import type { TimeSlot } from './scheduleService';

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
  unavailableMembers: {
    userId: string;
    username: string;
    fullName?: string;
  }[];
  availabilityPercentage: number;
  timeSlots: TimeSlot[];
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
    year: number
  ): Promise<GroupAvailability> {
    const response = await api.get(`/availability/group/${groupId}`, {
      params: { month, year },
    });
    return response.data.data;
  },
};
