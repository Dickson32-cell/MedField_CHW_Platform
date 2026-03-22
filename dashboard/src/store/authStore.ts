import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
  
  // Role helpers
  isAdmin: () => boolean;
  isSupervisor: () => boolean;
  isCHW: () => boolean;
  isFieldOfficer: () => boolean;
  isManagement: () => boolean;
}

// Custom storage that syncs with localStorage directly
const storage = {
  getItem: (name: string): string | null => {
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

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

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      isAdmin: () => get().user?.role === 'admin',
      isSupervisor: () => get().user?.role === 'supervisor',
      isCHW: () => get().user?.role === 'chw',
      isFieldOfficer: () => get().user?.role === 'chw',
      isManagement: () => {
        const role = get().user?.role;
        return role === 'admin' || role === 'supervisor';
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
      onRehydrateStorage: () => (state) => {
        // Sync zustand state with localStorage values directly
        if (state) {
          const token = localStorage.getItem('token');
          const userStr = localStorage.getItem('user');
          
          if (token && userStr) {
            try {
              const user = JSON.parse(userStr);
              state.token = token;
              state.user = user;
              state.isAuthenticated = true;
            } catch (e) {
              // Invalid data, clear
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          }
          state._hasHydrated = true;
        }
      },
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

// Initialize auth synchronously on app load - call this BEFORE rendering
export const initializeAuth = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      const store = useAuthStore.getState();
      store.login(token, user);
      return { token, user };
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  return null;
};
