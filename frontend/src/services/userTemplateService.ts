import api from './api';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface UserTemplate {
  _id: string;
  user: string;
  name: string;
  category: 'work' | 'study' | 'vacation' | 'personal' | 'custom';
  color: string;
  defaultSlots: TimeSlot[];
  isDefault: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserTemplateData {
  name: string;
  category: 'work' | 'study' | 'vacation' | 'personal' | 'custom';
  color: string;
  defaultSlots?: TimeSlot[];
}

export interface UpdateUserTemplateData
  extends Partial<CreateUserTemplateData> {
  order?: number;
}

export const userTemplateService = {
  /**
   * Obtener todas las plantillas del usuario
   */
  async getUserTemplates(): Promise<UserTemplate[]> {
    const response = await api.get('/user-templates');
    return response.data.data;
  },

  /**
   * Crear nueva plantilla personalizada
   */
  async createUserTemplate(
    data: CreateUserTemplateData
  ): Promise<UserTemplate> {
    const response = await api.post('/user-templates', data);
    return response.data.data;
  },

  /**
   * Actualizar plantilla
   */
  async updateUserTemplate(
    templateId: string,
    data: UpdateUserTemplateData
  ): Promise<UserTemplate> {
    const response = await api.put(`/user-templates/${templateId}`, data);
    return response.data.data;
  },

  /**
   * Eliminar plantilla
   */
  async deleteUserTemplate(templateId: string): Promise<void> {
    await api.delete(`/user-templates/${templateId}`);
  },

  /**
   * Reordenar plantillas
   */
  async reorderUserTemplates(templateIds: string[]): Promise<UserTemplate[]> {
    const response = await api.put('/user-templates/reorder', { templateIds });
    return response.data.data;
  },
};
