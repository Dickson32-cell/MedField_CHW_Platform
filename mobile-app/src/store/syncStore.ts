import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SyncQueue, SyncStatus } from '../types';

interface SyncStore {
  isOnline: boolean;
  lastSync: string | null;
  syncQueue: SyncQueue;
  isSyncing: boolean;
  pendingCount: number;
  
  setOnlineStatus: (status: boolean) => void;
  setLastSync: (timestamp: string) => void;
  addToQueue: (type: keyof SyncQueue, item: unknown) => void;
  removeFromQueue: (type: keyof SyncQueue, id: string) => void;
  clearQueue: () => void;
  setIsSyncing: (syncing: boolean) => void;
  getPendingCount: () => number;
}

const initialQueue: SyncQueue = {
  patients: [],
  visits: [],
  households: [],
  tasks: [],
  referrals: [],
};

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: true,
      lastSync: null,
      syncQueue: initialQueue,
      isSyncing: false,
      pendingCount: 0,

      // Actions
      setOnlineStatus: (status: boolean) => {
        set({ isOnline: status });
      },

      setLastSync: (timestamp: string) => {
        set({ lastSync: timestamp });
      },

      addToQueue: (type: keyof SyncQueue, item: unknown) => {
        const queue = get().syncQueue;
        set({
          syncQueue: {
            ...queue,
            [type]: [...queue[type], item],
          },
        });
        get().getPendingCount();
      },

      removeFromQueue: (type: keyof SyncQueue, id: string) => {
        const queue = get().syncQueue;
        const items = queue[type] as Array<{ id: string }>;
        set({
          syncQueue: {
            ...queue,
            [type]: items.filter((item) => item.id !== id),
          },
        });
        get().getPendingCount();
      },

      clearQueue: () => {
        set({ syncQueue: initialQueue, pendingCount: 0 });
      },

      setIsSyncing: (syncing: boolean) => {
        set({ isSyncing: syncing });
      },

      getPendingCount: () => {
        const queue = get().syncQueue;
        const count = Object.values(queue).reduce(
          (acc, items) => acc + items.length,
          0
        );
        set({ pendingCount: count });
        return count;
      },
    }),
    {
      name: 'medfield-sync-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastSync: state.lastSync,
        syncQueue: state.syncQueue,
      }),
    }
  )
);

// Hooks for accessing sync state
export const useSyncStatus = () => useSyncStore((state) => ({
  isOnline: state.isOnline,
  lastSync: state.lastSync,
  isSyncing: state.isSyncing,
  pendingCount: state.pendingCount,
}));

export const useSyncQueue = () => useSyncStore((state) => state.syncQueue);
