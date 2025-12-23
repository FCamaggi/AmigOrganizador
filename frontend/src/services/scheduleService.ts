import api from './api';

export interface TimeSlot {
  start: string; // Formato HH:MM
  end: string; // Formato HH:MM
  title?: string; // Título del evento
  color?: string; // Color del evento (hex)
}

export interface DayAvailability {
  day: number;
  slots: TimeSlot[];
  note?: string;
}

export interface Schedule {
  _id: string;
  user: string;
  month: number;
  year: number;
  availability: DayAvailability[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleExport {
  year: number;
  month: number;
  availability: DayAvailability[];
  exportedAt: string;
}

export const scheduleService = {
  /**
   * Obtener horario de un mes específico
   */
  async getSchedule(year: number, month: number): Promise<Schedule> {
    const response = await api.get(`/schedules/${year}/${month}`);
    return response.data.data;
  },

  /**
   * Actualizar disponibilidad de un día
   */
  async updateDayAvailability(
    year: number,
    month: number,
    day: number,
    slots: TimeSlot[],
    note?: string
  ): Promise<Schedule> {
    const response = await api.put(`/schedules/${year}/${month}/${day}`, {
      slots,
      note,
    });
    return response.data.data;
  },

  /**
   * Eliminar disponibilidad de un día
   */
  async removeDayAvailability(
    year: number,
    month: number,
    day: number
  ): Promise<Schedule> {
    const response = await api.delete(`/schedules/${year}/${month}/${day}`);
    return response.data.data;
  },

  /**
   * Obtener múltiples meses de horarios
   */
  async getScheduleRange(
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
  ): Promise<Schedule[]> {
    const response = await api.get(
      `/schedules/range/${startYear}/${startMonth}/${endYear}/${endMonth}`
    );
    return response.data.data;
  },

  /**
   * Exportar horario a JSON
   */
  async exportSchedule(year: number, month: number): Promise<ScheduleExport> {
    const response = await api.get(`/schedules/${year}/${month}/export`);
    return response.data.data;
  },

  /**
   * Importar horario desde JSON
   */
  async importSchedule(scheduleData: {
    year: number;
    month: number;
    availability: DayAvailability[];
  }): Promise<Schedule> {
    const response = await api.post('/schedules/import', scheduleData);
    return response.data.data;
  },
};
