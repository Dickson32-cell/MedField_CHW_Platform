import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  
  // Role helpers
  isAdmin: () => boolean;
  isSupervisor: () => boolean;
  isCHW: () => boolean;
  isFieldOfficer: () => boolean;
  isManagement: () => boolean; // Admin or Supervisor
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),

      login: (token, user) => {
        set({ token, user, isAuthenticated: true });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },

      isAdmin: () => get().user?.role === 'admin',
      isSupervisor: () => get().user?.role === 'supervisor',
      isCHW: () => get().user?.role === 'chw',
      isFieldOfficer: () => get().user?.role === 'chw', // CHW and Field Officer are the same role
      isManagement: () => {
        const role = get().user?.role;
        return role === 'admin' || role === 'supervisor';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Initialize from localStorage on app load
export const initializeAuth = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      useAuthStore.getState().login(token, user);
      return { token, user };
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  return null;
};
