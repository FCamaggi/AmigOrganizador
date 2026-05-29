import api from './api';

export interface AvailabilitySettings {
  usefulStart: string;
  usefulEnd: string;
  minimumBlockMinutes: number;
  alternativeThreshold: number;
}

export interface AvailabilityMember {
  userId: string;
  username: string;
  fullName?: string;
}

export interface AvailabilityWindow {
  day: number;
  date: string;
  start: string;
  end: string;
  durationMinutes: number;
  availabilityPercentage: number;
  qualityScore: number;
  scoreReasons: string[];
  timeQuality: 'morning' | 'afternoon' | 'evening' | 'late';
  availableMembers: AvailabilityMember[];
  unavailableMembers: AvailabilityMember[];
  type?: 'perfect' | 'alternative';
}

export interface MemberDaySummary extends AvailabilityMember {
  busyBlocks: Array<{ start: string; end: string }>;
  freeBlocks: Array<{ start: string; end: string; durationMinutes: number }>;
}

export interface DayAvailability {
  day: number;
  date: string;
  bestWindow: AvailabilityWindow | null;
  perfectWindows: AvailabilityWindow[];
  alternativeWindows: AvailabilityWindow[];
  availabilityScore: number;
  memberSummaries: MemberDaySummary[];
}

export interface GroupAvailabilityStats {
  totalDays: number;
  daysWithPerfectOption: number;
  daysWithStrongAlternative: number;
  totalRecommendations: number;
  memberCount: number;
  schedulesSubmitted: number;
}

export interface GroupAvailability {
  groupId: string;
  groupName: string;
  month: number;
  year: number;
  settings: AvailabilitySettings;
  recommendations: AvailabilityWindow[];
  days: DayAvailability[];
  availability: DayAvailability[];
  stats: GroupAvailabilityStats;
}

export const availabilityService = {
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
