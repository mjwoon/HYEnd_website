import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'student' | 'staff' | 'admin';
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

// Synchronously retrieve initial auth state from localStorage to prevent flash of unauthenticated state
const getInitialAuth = () => {
  try {
    const token = localStorage.getItem('accessToken');
    const cachedUser = localStorage.getItem('userInfo');
    if (token && cachedUser) {
      return {
        isAuthenticated: true,
        user: JSON.parse(cachedUser) as User,
      };
    }
  } catch {
    localStorage.removeItem('userInfo');
  }
  return {
    isAuthenticated: false,
    user: null,
  };
};

const initialAuth = getInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: initialAuth.isAuthenticated,
  user: initialAuth.user,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    set({ user: null, isAuthenticated: false });
  },
}));
