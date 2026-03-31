import { create } from 'zustand';

interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  role: 'staff' | 'admin';
}

interface AuthState {
  isAuthenticated: boolean;
  user: AdminUser | null;
  setUser: (user: AdminUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    set({ user: null, isAuthenticated: false });
  },
}));
