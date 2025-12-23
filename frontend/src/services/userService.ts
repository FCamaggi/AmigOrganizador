import api from './api';

export interface User {
  _id: string;
  email: string;
  username: string;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  username: string;
  email: string;
  fullName?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  /**
   * Obtener perfil del usuario actual
   */
  async getProfile(): Promise<User> {
    const response = await api.get('/users/profile');
    return response.data.data;
  },

  /**
   * Actualizar perfil
   */
  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await api.put('/users/profile', data);
    return response.data.data;
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.post('/users/change-password', data);
  },

  /**
   * Eliminar cuenta
   */
  async deleteAccount(password: string): Promise<void> {
    await api.delete('/users/account', { data: { password } });
  },
};
