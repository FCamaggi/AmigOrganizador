import api from './api';

export interface GroupMember {
  user: {
    _id: string;
    username: string;
    email: string;
    fullName?: string;
  };
  joinedAt: string;
  role: 'admin' | 'member';
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  code: string;
  creator: {
    _id: string;
    username: string;
    email: string;
    fullName?: string;
  };
  members: GroupMember[];
  memberCount: number;
  settings: {
    isPrivate: boolean;
    allowMemberInvites: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  allowMemberInvites?: boolean;
}

export const groupService = {
  /**
   * Crear nuevo grupo
   */
  async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await api.post('/groups', data);
    return response.data.data;
  },

  /**
   * Obtener todos los grupos del usuario
   */
  async getMyGroups(): Promise<Group[]> {
    const response = await api.get('/groups');
    return response.data.data;
  },

  /**
   * Obtener grupo por ID
   */
  async getGroupById(groupId: string): Promise<Group> {
    const response = await api.get(`/groups/${groupId}`);
    return response.data.data;
  },

  /**
   * Unirse a grupo por código
   */
  async joinGroupByCode(code: string): Promise<Group> {
    const response = await api.post(`/groups/join/${code}`);
    return response.data.data;
  },

  /**
   * Actualizar grupo
   */
  async updateGroup(groupId: string, data: UpdateGroupData): Promise<Group> {
    const response = await api.put(`/groups/${groupId}`, data);
    return response.data.data;
  },

  /**
   * Eliminar grupo
   */
  async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/groups/${groupId}`);
  },

  /**
   * Salir del grupo
   */
  async leaveGroup(groupId: string): Promise<void> {
    await api.post(`/groups/${groupId}/leave`);
  },

  /**
   * Remover miembro del grupo
   */
  async removeMember(groupId: string, memberId: string): Promise<Group> {
    const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
    return response.data.data;
  },
};
