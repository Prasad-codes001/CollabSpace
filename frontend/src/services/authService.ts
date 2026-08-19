import type { User } from '../types/auth';
import { apiClient } from '../api/client';

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return apiClient.post<{ token: string; user: User }>('/auth/login', { email, password });
  },
  async signup(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    return apiClient.post<{ token: string; user: User }>('/auth/signup', { name, email, password });
  },
  async logout(): Promise<void> {
    await apiClient.post<{ message: string }>('/auth/logout', {});
  },
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },
};