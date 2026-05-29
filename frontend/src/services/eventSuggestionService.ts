import api from './api';
import type { AvailabilityWindow } from './availabilityService';

export interface SuggestedEvent {
  _id: string;
  source: string;
  externalId: string;
  name: string;
  date?: string | null;
  dateLocal?: string | null;
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
}

export interface SuggestedEventDay {
  date: string;
  availabilityWindow: AvailabilityWindow;
  events: SuggestedEvent[];
}

export interface GroupEventSuggestions {
  groupId: string;
  month: number;
  year: number;
  available: boolean;
  message?: string;
  totalEvents: number;
  days: SuggestedEventDay[];
}

export const eventSuggestionService = {
  async getGroupEventSuggestions(
    groupId: string,
    month: number,
    year: number
  ): Promise<GroupEventSuggestions> {
    const response = await api.get(`/groups/${groupId}/event-suggestions`, {
      params: {
        month: `${year}-${month.toString().padStart(2, '0')}`,
      },
    });
    return response.data.data;
  },
};
