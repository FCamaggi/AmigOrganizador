import api from './api';
import type { Group } from './groupService';

export interface Invitation {
  _id: string;
  group: {
    _id: string;
    name: string;
    code: string;
    description?: string;
    memberCount: number;
  };
  invitedBy: {
    _id: string;
    username: string;
    email: string;
    fullName?: string;
  };
  invitedUser?: {
    _id: string;
    username: string;
    email: string;
    fullName?: string;
  };
  invitedEmail: string;
  code: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt: string;
  acceptedAt?: string;
  message?: string;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationData {
  groupId: string;
  email: string;
  message?: string;
}

export const invitationService = {
  /**
   * Crear invitación
   */
  async createInvitation(data: CreateInvitationData): Promise<Invitation> {
    const response = await api.post('/invitations', data);
    return response.data.data;
  },

  /**
   * Obtener invitaciones del usuario actual
   */
  async getMyInvitations(): Promise<Invitation[]> {
    const response = await api.get('/invitations/my');
    return response.data.data;
  },

  /**
   * Obtener invitaciones de un grupo
   */
  async getGroupInvitations(groupId: string): Promise<Invitation[]> {
    const response = await api.get(`/invitations/group/${groupId}`);
    return response.data.data;
  },

  /**
   * Aceptar invitación
   */
  async acceptInvitation(
    invitationId: string
  ): Promise<{ invitation: Invitation; group: Group }> {
    const response = await api.post(`/invitations/${invitationId}/accept`);
    return response.data.data;
  },

  /**
   * Rechazar invitación
   */
  async rejectInvitation(invitationId: string): Promise<void> {
    await api.post(`/invitations/${invitationId}/reject`);
  },

  /**
   * Cancelar invitación
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    await api.delete(`/invitations/${invitationId}`);
  },
};
