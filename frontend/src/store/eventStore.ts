import { create } from 'zustand';
import { eventService } from '../services/eventService';
import { userTemplateService } from '../services/userTemplateService';
import type {
  Event,
  CreateEventData,
  UpdateEventData,
  AvailabilityForDate,
} from '../services/eventService';
import type {
  UserTemplate,
  CreateUserTemplateData,
  UpdateUserTemplateData,
} from '../services/userTemplateService';

interface EventState {
  events: Event[];
  userTemplates: UserTemplate[];
  currentEvent: Event | null;
  availabilityCache: Map<string, AvailabilityForDate>;
  loading: boolean;
  error: string | null;

  // UserTemplate actions
  fetchUserTemplates: () => Promise<void>;
  createUserTemplate: (data: CreateUserTemplateData) => Promise<UserTemplate>;
  updateUserTemplate: (
    templateId: string,
    data: UpdateUserTemplateData
  ) => Promise<void>;
  deleteUserTemplate: (templateId: string) => Promise<void>;
  reorderUserTemplates: (templateIds: string[]) => Promise<void>;

  // Event actions
  fetchEvents: (
    startDate: string,
    endDate: string,
    category?: string
  ) => Promise<void>;
  fetchEventById: (eventId: string) => Promise<void>;
  createEvent: (data: CreateEventData) => Promise<Event>;
  updateEvent: (eventId: string, data: UpdateEventData) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;

  // Availability actions
  getAvailabilityForDate: (date: string) => Promise<AvailabilityForDate>;

  // Utility
  clearError: () => void;
  clearCurrentEvent: () => void;
  clearEvents: () => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  userTemplates: [],
  currentEvent: null,
  availabilityCache: new Map(),
  loading: false,
  error: null,

  fetchUserTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const templates = await userTemplateService.getUserTemplates();
      set({ userTemplates: templates, loading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cargar plantillas';
      set({ error: message, loading: false });
      throw error;
    }
  },

  createUserTemplate: async (data) => {
    set({ loading: true, error: null });
    try {
      const newTemplate = await userTemplateService.createUserTemplate(data);
      set((state) => ({
        userTemplates: [...state.userTemplates, newTemplate],
        loading: false,
      }));
      return newTemplate;
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al crear plantilla';
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateUserTemplate: async (templateId, data) => {
    set({ loading: true, error: null });
    try {
      const updatedTemplate = await userTemplateService.updateUserTemplate(
        templateId,
        data
      );
      set((state) => ({
        userTemplates: state.userTemplates.map((t) =>
          t._id === templateId ? updatedTemplate : t
        ),
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al actualizar plantilla';
      set({ error: message, loading: false });
      throw error;
    }
  },

  deleteUserTemplate: async (templateId) => {
    set({ loading: true, error: null });
    try {
      await userTemplateService.deleteUserTemplate(templateId);
      set((state) => ({
        userTemplates: state.userTemplates.filter((t) => t._id !== templateId),
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al eliminar plantilla';
      set({ error: message, loading: false });
      throw error;
    }
  },

  reorderUserTemplates: async (templateIds) => {
    set({ loading: true, error: null });
    try {
      const reorderedTemplates = await userTemplateService.reorderUserTemplates(
        templateIds
      );
      set({ userTemplates: reorderedTemplates, loading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al reordenar plantillas';
      set({ error: message, loading: false });
      throw error;
    }
  },

  fetchEvents: async (
    startDate: string,
    endDate: string,
    category?: string
  ) => {
    set({ loading: true, error: null });
    try {
      const events = await eventService.getEvents(startDate, endDate, category);
      set({ events, loading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cargar eventos';
      set({ error: message, loading: false });
      throw error;
    }
  },

  fetchEventById: async (eventId: string) => {
    set({ loading: true, error: null });
    try {
      const event = await eventService.getEventById(eventId);
      set({ currentEvent: event, loading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cargar evento';
      set({ error: message, loading: false });
      throw error;
    }
  },

  createEvent: async (data: CreateEventData) => {
    set({ loading: true, error: null });
    try {
      const event = await eventService.createEvent(data);
      set((state) => ({
        events: [...state.events, event],
        loading: false,
      }));
      return event;
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al crear evento';
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateEvent: async (eventId: string, data: UpdateEventData) => {
    set({ loading: true, error: null });
    try {
      const updatedEvent = await eventService.updateEvent(eventId, data);
      set((state) => ({
        events: state.events.map((e) => (e._id === eventId ? updatedEvent : e)),
        currentEvent:
          state.currentEvent?._id === eventId
            ? updatedEvent
            : state.currentEvent,
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al actualizar evento';
      set({ error: message, loading: false });
      throw error;
    }
  },

  deleteEvent: async (eventId: string) => {
    set({ loading: true, error: null });
    try {
      await eventService.deleteEvent(eventId);
      set((state) => ({
        events: state.events.filter((e) => e._id !== eventId),
        currentEvent:
          state.currentEvent?._id === eventId ? null : state.currentEvent,
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al eliminar evento';
      set({ error: message, loading: false });
      throw error;
    }
  },

  getAvailabilityForDate: async (date: string) => {
    const cached = get().availabilityCache.get(date);
    if (cached) return cached;

    set({ loading: true, error: null });
    try {
      const availability = await eventService.getAvailabilityForDate(date);
      set((state) => {
        const newCache = new Map(state.availabilityCache);
        newCache.set(date, availability);
        return { availabilityCache: newCache, loading: false };
      });
      return availability;
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cargar disponibilidad';
      set({ error: message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentEvent: () => set({ currentEvent: null }),
  clearEvents: () => set({ events: [], availabilityCache: new Map() }),
}));
