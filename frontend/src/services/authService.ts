import apiClient from './apiClient';

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  department?: string;
  studentId?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export const authService = {
  register: (payload: RegisterPayload) =>
    apiClient.post<{ success: boolean; message: string; data: null }>('/auth/register', payload),

  login: (payload: LoginPayload) =>
    apiClient.post<{ success: boolean; message: string; data: TokenResponse }>('/auth/login', payload),

  logout: () =>
    apiClient.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    apiClient.post<{ success: boolean; message: string; data: TokenResponse }>('/auth/refresh', { refreshToken }),
};
