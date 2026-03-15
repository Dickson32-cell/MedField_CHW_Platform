import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, User } from '../types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isOffline: false,
      lastSync: null,

      // Actions
      setUser: (user: User | null) => set({ user }),
      
      setAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
      
      setOffline: (value: boolean) => set({ isOffline: value }),
      
      setLastSync: (timestamp: string | null) => set({ lastSync: timestamp }),
      
      logout: () => set({
        user: null,
        isAuthenticated: false,
        lastSync: null,
      }),
    }),
    {
      name: 'medfield-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastSync: state.lastSync,
      }),
    }
  )
);

// Selectors for common state slices
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useIsOffline = () => useAppStore((state) => state.isOffline);
export const useLastSync = () => useAppStore((state) => state.lastSync);

// Actions
export const useAuthActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  setAuthenticated: state.setAuthenticated,
  logout: state.logout,
}));

export const useSyncActions = () => useAppStore((state) => ({
  setOffline: state.setOffline,
  setLastSync: state.setLastSync,
}));
