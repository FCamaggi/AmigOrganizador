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
    minimumAvailabilityHours?: number;
    availability?: AvailabilitySettings;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySettings {
  usefulStart: string;
  usefulEnd: string;
  minimumBlockMinutes: number;
  alternativeThreshold: number;
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

export type UpdateAvailabilitySettingsData = AvailabilitySettings;

const sanitizeGroup = (group: Group): Group => {
  const rawMembers = group.members as Array<
    Omit<GroupMember, 'user'> & { user: GroupMember['user'] | null }
  >;
  const members = rawMembers.filter(
    (member): member is GroupMember => Boolean(member.user?._id)
  );

  return {
    ...group,
    members,
    memberCount: members.length,
  };
};

const sanitizeGroups = (groups: Group[]): Group[] => groups.map(sanitizeGroup);

export const groupService = {
  /**
   * Crear nuevo grupo
   */
  async createGroup(data: CreateGroupData): Promise<Group> {
    const response = await api.post('/groups', data);
    return sanitizeGroup(response.data.data);
  },

  /**
   * Obtener todos los grupos del usuario
   */
  async getMyGroups(): Promise<Group[]> {
    const response = await api.get('/groups');
    return sanitizeGroups(response.data.data);
  },

  /**
   * Obtener grupo por ID
   */
  async getGroupById(groupId: string): Promise<Group> {
    const response = await api.get(`/groups/${groupId}`);
    return sanitizeGroup(response.data.data);
  },

  /**
   * Unirse a grupo por código
   */
  async joinGroupByCode(code: string): Promise<Group> {
    const response = await api.post(`/groups/join/${code}`);
    return sanitizeGroup(response.data.data);
  },

  /**
   * Actualizar grupo
   */
  async updateGroup(groupId: string, data: UpdateGroupData): Promise<Group> {
    const response = await api.put(`/groups/${groupId}`, data);
    return sanitizeGroup(response.data.data);
  },

  async updateAvailabilitySettings(
    groupId: string,
    data: UpdateAvailabilitySettingsData
  ): Promise<Group> {
    const response = await api.patch(
      `/groups/${groupId}/availability-settings`,
      data
    );
    return sanitizeGroup(response.data.data);
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
    return sanitizeGroup(response.data.data);
  },
};
