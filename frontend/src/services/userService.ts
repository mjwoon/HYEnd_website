import apiClient from './apiClient';

export interface MyInfo {
  id: number;
  email: string;
  name: string;
  studentId?: string;
  department?: string;
  role: string;
  isActive: boolean;
}

export const userService = {
  getMe: () =>
    apiClient.get<{ success: boolean; data: MyInfo }>('/auth/me'),
};
