import api from './api';
import type { AvailabilityWindow } from './availabilityService';

export interface SuggestedEvent {
  _id: string;
  source: string;
  externalId: string;
  name: string;
  date?: string | null;
  dateLocal?: string | null;
  timeLocal?: string | null;
  venue?: {
    name?: string | null;
    city?: string | null;
    address?: string | null;
  };
  category?: string | null;
  genre?: string | null;
  imageUrl?: string | null;
  ticketUrl?: string | null;
  priceFrom?: number | null;
  description?: string | null;
  matchingWindows?: AvailabilityWindow[];
  matchType?: 'perfect' | 'alternative';
  availabilityPercentage?: number;
  timeMatchStatus?: 'matched' | 'unknown-time' | 'outside-window';
}

export interface SuggestedEventDay {
  date: string;
  availabilityWindow: AvailabilityWindow;
  windows?: AvailabilityWindow[];
  events: SuggestedEvent[];
  rawEventsCount?: number;
  timedEventsCount?: number;
  unknownTimeEventsCount?: number;
}

export interface GroupEventSuggestions {
  groupId: string;
  month: number;
  year: number;
  available: boolean;
  message?: string;
  totalEvents: number;
  rawEventsCount?: number;
  unknownTimeEventsCount?: number;
  days: SuggestedEventDay[];
}

export const eventSuggestionService = {
  async getGroupEventSuggestions(
    groupId: string,
    month: number,
    year: number,
    filters?: {
      categories?: string[];
      city?: string;
      source?: string;
      includeAlternatives?: boolean;
      includeUnknownTime?: boolean;
      limit?: number;
    }
  ): Promise<GroupEventSuggestions> {
    const response = await api.get(`/groups/${groupId}/event-suggestions`, {
      params: {
        month: `${year}-${month.toString().padStart(2, '0')}`,
        ...(filters?.categories?.length
          ? { categories: filters.categories.join(',') }
          : {}),
        ...(filters?.city ? { city: filters.city } : {}),
        ...(filters?.source ? { source: filters.source } : {}),
        ...(filters?.includeAlternatives !== undefined
          ? { includeAlternatives: filters.includeAlternatives }
          : {}),
        ...(filters?.includeUnknownTime !== undefined
          ? { includeUnknownTime: filters.includeUnknownTime }
          : {}),
        ...(filters?.limit ? { limit: filters.limit } : {}),
      },
    });
    return response.data.data;
  },
};
