import { create } from 'zustand';
import { groupService } from '../services/groupService';
import { invitationService } from '../services/invitationService';
import type {
  Group,
  CreateGroupData,
  UpdateGroupData,
} from '../services/groupService';
import type {
  Invitation,
  CreateInvitationData,
} from '../services/invitationService';

interface GroupState {
  groups: Group[];
  currentGroup: Group | null;
  myInvitations: Invitation[];
  invitations: Invitation[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;

  // Group actions
  fetchMyGroups: () => Promise<void>;
  fetchGroupById: (groupId: string) => Promise<void>;
  createGroup: (data: CreateGroupData) => Promise<Group>;
  joinGroupByCode: (code: string) => Promise<void>;
  updateGroup: (groupId: string, data: UpdateGroupData) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  removeMember: (groupId: string, memberId: string) => Promise<void>;

  // Invitation actions
  fetchMyInvitations: () => Promise<void>;
  fetchGroupInvitations: (groupId: string) => Promise<void>;
  createInvitation: (data: CreateInvitationData) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;

  // Utility
  clearError: () => void;
  clearCurrentGroup: () => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  currentGroup: null,
  myInvitations: [],
  invitations: [],
  loading: false,
  isLoading: false,
  error: null,

  fetchMyGroups: async () => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const groups = await groupService.getMyGroups();
      set({ groups, loading: false, isLoading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cargar grupos';
      set({ error: message, loading: false, isLoading: false });
      throw error;
    }
  },

  fetchGroupById: async (groupId: string) => {
    set({ loading: true, error: null });
    try {
      const group = await groupService.getGroupById(groupId);
      set({ currentGroup: group, loading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cargar grupo';
      set({ error: message, loading: false });
      throw error;
    }
  },

  createGroup: async (data: CreateGroupData) => {
    set({ loading: true, error: null });
    try {
      const group = await groupService.createGroup(data);
      set((state) => ({
        groups: [group, ...state.groups],
        loading: false,
      }));
      return group;
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al crear grupo';
      set({ error: message, loading: false });
      throw error;
    }
  },

  joinGroupByCode: async (code: string) => {
    set({ loading: true, error: null });
    try {
      const group = await groupService.joinGroupByCode(code);
      set((state) => {
        // Evitar duplicados: si el grupo ya existe, reemplazarlo; si no, agregarlo
        const groupExists = state.groups.some((g) => g._id === group._id);
        const newGroups = groupExists
          ? state.groups.map((g) => (g._id === group._id ? group : g))
          : [group, ...state.groups];

        return {
          groups: newGroups,
          loading: false,
        };
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al unirse al grupo';
      set({ error: message, loading: false });
      throw error;
    }
  },

  updateGroup: async (groupId: string, data: UpdateGroupData) => {
    set({ loading: true, error: null });
    try {
      const updatedGroup = await groupService.updateGroup(groupId, data);
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? updatedGroup : g)),
        currentGroup:
          state.currentGroup?._id === groupId
            ? updatedGroup
            : state.currentGroup,
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al actualizar grupo';
      set({ error: message, loading: false });
      throw error;
    }
  },

  deleteGroup: async (groupId: string) => {
    set({ loading: true, error: null });
    try {
      await groupService.deleteGroup(groupId);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        currentGroup:
          state.currentGroup?._id === groupId ? null : state.currentGroup,
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al eliminar grupo';
      set({ error: message, loading: false });
      throw error;
    }
  },

  leaveGroup: async (groupId: string) => {
    set({ loading: true, error: null });
    try {
      await groupService.leaveGroup(groupId);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== groupId),
        currentGroup:
          state.currentGroup?._id === groupId ? null : state.currentGroup,
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al salir del grupo';
      set({ error: message, loading: false });
      throw error;
    }
  },

  removeMember: async (groupId: string, memberId: string) => {
    set({ loading: true, error: null });
    try {
      const updatedGroup = await groupService.removeMember(groupId, memberId);
      set((state) => ({
        groups: state.groups.map((g) => (g._id === groupId ? updatedGroup : g)),
        currentGroup:
          state.currentGroup?._id === groupId
            ? updatedGroup
            : state.currentGroup,
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al remover miembro';
      set({ error: message, loading: false });
      throw error;
    }
  },

  fetchMyInvitations: async () => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const invitations = await invitationService.getMyInvitations();
      set({
        myInvitations: invitations,
        invitations,
        loading: false,
        isLoading: false,
      });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cargar invitaciones';
      set({ error: message, loading: false, isLoading: false });
      throw error;
    }
  },

  fetchGroupInvitations: async (groupId: string) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const invitations = await invitationService.getGroupInvitations(groupId);
      set({ invitations, loading: false, isLoading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cargar invitaciones del grupo';
      set({ error: message, loading: false, isLoading: false });
      throw error;
    }
  },

  createInvitation: async (data: CreateInvitationData) => {
    set({ loading: true, error: null });
    try {
      await invitationService.createInvitation(data);
      set({ loading: false });
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al crear invitación';
      set({ error: message, loading: false });
      throw error;
    }
  },

  acceptInvitation: async (invitationId: string) => {
    set({ loading: true, error: null });
    try {
      const { group } = await invitationService.acceptInvitation(invitationId);
      set((state) => ({
        groups: [group, ...state.groups],
        myInvitations: state.myInvitations.filter(
          (inv) => inv._id !== invitationId
        ),
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al aceptar invitación';
      set({ error: message, loading: false });
      throw error;
    }
  },

  rejectInvitation: async (invitationId: string) => {
    set({ loading: true, error: null });
    try {
      await invitationService.rejectInvitation(invitationId);
      set((state) => ({
        myInvitations: state.myInvitations.filter(
          (inv) => inv._id !== invitationId
        ),
        invitations: state.invitations.filter(
          (inv) => inv._id !== invitationId
        ),
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al rechazar invitación';
      set({ error: message, loading: false });
      throw error;
    }
  },

  cancelInvitation: async (invitationId: string) => {
    set({ loading: true, error: null });
    try {
      await invitationService.cancelInvitation(invitationId);
      set((state) => ({
        invitations: state.invitations.filter(
          (inv) => inv._id !== invitationId
        ),
        loading: false,
      }));
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Error al cancelar invitación';
      set({ error: message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  clearCurrentGroup: () => set({ currentGroup: null }),
}));
