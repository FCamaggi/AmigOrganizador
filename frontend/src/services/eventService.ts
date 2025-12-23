import api from './api';

export interface TimeSlot {
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface Recurrence {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[]; // 0-6, donde 0 = Domingo
  daysOfMonth?: number[]; // 1-31
  endDate?: string;
}

export interface Event {
  _id: string;
  user: string;
  title: string;
  description?: string;
  category: 'work' | 'study' | 'vacation' | 'personal' | 'custom';
  userTemplate?: string; // ID de la plantilla del usuario
  color: string;
  startDate: string;
  endDate: string;
  timeSlots: TimeSlot[];
  allDay: boolean;
  recurrence: Recurrence;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  category?: 'work' | 'study' | 'vacation' | 'personal' | 'custom';
  userTemplateId?: string; // ID de la plantilla del usuario
  color?: string;
  startDate: string;
  endDate: string;
  timeSlots?: TimeSlot[];
  allDay?: boolean;
  recurrence?: Recurrence;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateEventData extends Partial<CreateEventData> {
  // Extensión del tipo CreateEventData para actualizaciones
}

export interface AvailabilityForDate {
  date: string;
  busySlots: (TimeSlot & {
    eventId: string;
    category: string;
    title: string;
    color: string;
  })[];
  availableSlots: TimeSlot[];
}

export const eventService = {
  /**
   * Crear nuevo evento
   */
  async createEvent(data: CreateEventData): Promise<Event> {
    const response = await api.post('/events', data);
    return response.data.data;
  },

  /**
   * Obtener eventos en un rango de fechas
   */
  async getEvents(
    startDate: string,
    endDate: string,
    category?: string
  ): Promise<Event[]> {
    const params: { startDate: string; endDate: string; category?: string } = {
      startDate,
      endDate,
    };
    if (category) params.category = category;

    const response = await api.get('/events', { params });
    return response.data.data;
  },

  /**
   * Obtener evento por ID
   */
  async getEventById(eventId: string): Promise<Event> {
    const response = await api.get(`/events/${eventId}`);
    return response.data.data;
  },

  /**
   * Actualizar evento
   */
  async updateEvent(eventId: string, data: UpdateEventData): Promise<Event> {
    const response = await api.put(`/events/${eventId}`, data);
    return response.data.data;
  },

  /**
   * Eliminar evento
   */
  async deleteEvent(eventId: string): Promise<void> {
    await api.delete(`/events/${eventId}`);
  },

  /**
   * Obtener disponibilidad para una fecha específica
   */
  async getAvailabilityForDate(date: string): Promise<AvailabilityForDate> {
    const response = await api.get(`/events/availability/${date}`);
    return response.data.data;
  },
};
