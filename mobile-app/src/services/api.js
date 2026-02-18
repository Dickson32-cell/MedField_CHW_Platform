import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncService, patientService, visitService, householdService, taskService, referralService } from './database';

import { CONFIG } from '../config';

const API_URL = CONFIG.API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper for wait/sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Add response interceptor for retries and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle Rate Limiting (429) and Server Errors (5xx) with Exponential Backoff
    const retryableStatuses = [429, 500, 502, 503, 504];
    if (error.response && retryableStatuses.includes(error.response.status)) {
      originalRequest._retryCount = originalRequest._retryCount || 0;

      if (originalRequest._retryCount < 3) {
        originalRequest._retryCount++;

        // Calculate delay: base * 2^retry + jitter
        const baseDelay = 1000;
        const backoff = baseDelay * Math.pow(2, originalRequest._retryCount);
        const jitter = backoff * 0.2 * (Math.random() * 2 - 1);
        const delay = backoff + jitter;

        await sleep(delay);
        return api(originalRequest);
      }
    }

    // 2. Handle Authentication Expiry (401)
    if (error.response?.status === 401 && !originalRequest._authRetry) {
      originalRequest._authRetry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('auth_refresh_token');
        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

        if (response.data.success) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          await AsyncStorage.setItem('auth_token', accessToken);
          await AsyncStorage.setItem('auth_refresh_token', newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, force logout
        await authService.logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Handle API errors
const handleApiError = (error) => {
  if (error.response) {
    return error.response.data;
  } else if (error.request) {
    return { success: false, message: 'Network error - offline mode' };
  } else {
    return { success: false, message: error.message };
  }
};

// Auth Service
export const authService = {
  async login(username, password, deviceId) {
    try {
      const response = await api.post('/auth/login', { username, password, device_id: deviceId });
      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        await AsyncStorage.setItem('auth_token', accessToken);
        await AsyncStorage.setItem('auth_refresh_token', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        await AsyncStorage.setItem('auth_token', accessToken);
        await AsyncStorage.setItem('auth_refresh_token', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async logout() {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
  },

  async getStoredUser() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// Patient Service (API)
export const patientApiService = {
  async getAll(params) {
    try {
      const response = await api.get('/patients', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(patient) {
    try {
      const response = await api.post('/patients', patient);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async update(id, patient) {
    try {
      const response = await api.put(`/patients/${id}`, patient);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Visit Service (API)
export const visitApiService = {
  async getAll(params) {
    try {
      const response = await api.get('/visits', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(visit) {
    try {
      const response = await api.post('/visits', visit);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Task Service (API)
export const taskApiService = {
  async getAll(params) {
    try {
      const response = await api.get('/tasks', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async getToday() {
    try {
      const response = await api.get('/tasks/today');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async update(id, task) {
    try {
      const response = await api.put(`/tasks/${id}`, task);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Household Service (API)
export const householdApiService = {
  async getAll(params) {
    try {
      const response = await api.get('/households', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(household) {
    try {
      const response = await api.post('/households', household);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Referral Service (API)
export const referralApiService = {
  async getAll(params) {
    try {
      const response = await api.get('/referrals', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(referral) {
    try {
      const response = await api.post('/referrals', referral);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Sync Service
export const syncApiService = {
  async pushData() {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      const queue = await syncService.getSyncQueue();

      const response = await api.post('/sync/push', {
        device_id: deviceId,
        data: queue,
        last_sync_timestamp: (await syncService.getLastSync())?.timestamp
      });

      if (response.data.success) {
        // Mark local data as synced
        await this.markAsSynced(queue);

        // Update last sync
        await syncService.setLastSync(
          response.data.data.server_timestamp,
          response.data.data.results
        );
      }

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async pullData() {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      const lastSync = await syncService.getLastSync();

      const response = await api.post('/sync/pull', {
        device_id: deviceId,
        last_sync_timestamp: lastSync?.timestamp
      });

      if (response.data.success) {
        // Store pulled data locally
        await this.storePulledData(response.data.data);

        // Update last sync
        await syncService.setLastSync(
          response.data.data.server_timestamp,
          { pulled: true }
        );
      }

      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async markAsSynced(queue) {
    // Mark patients as synced
    const patientUpdates = (queue.patients || []).map(patient =>
      patientService.update({ ...patient, synced: true, synced_at: new Date().toISOString() })
    );

    // Mark visits as synced
    const visitUpdates = (queue.visits || []).map(visit =>
      visitService.update({ ...visit, synced: true, synced_at: new Date().toISOString() })
    );

    // Mark households as synced
    const householdUpdates = (queue.households || []).map(hh =>
      householdService.update({ ...hh, synced: true, synced_at: new Date().toISOString() })
    );

    // Mark tasks as synced
    const taskUpdates = (queue.tasks || []).map(task =>
      taskService.update({ ...task, synced: true, synced_at: new Date().toISOString() })
    );

    // Mark referrals as synced
    const referralUpdates = (queue.referrals || []).map(ref =>
      referralService.update({ ...ref, synced: true, synced_at: new Date().toISOString() })
    );

    await Promise.allSettled([
      ...patientUpdates,
      ...visitUpdates,
      ...householdUpdates,
      ...taskUpdates,
      ...referralUpdates
    ]);
  },

  async storePulledData(data) {
    // Store patients
    if (data.patients) {
      for (const patient of data.patients) {
        await patientService.create({ ...patient, synced: true });
      }
    }

    // Store households
    if (data.households) {
      for (const household of data.households) {
        await householdService.create({ ...household, synced: true });
      }
    }

    // Store tasks
    if (data.tasks) {
      for (const task of data.tasks) {
        await taskService.create({ ...task, synced: true });
      }
    }
  },

  async getStatus() {
    try {
      const response = await api.get('/sync/status');
      return response.data;
    } catch (error) {
      const lastSync = await syncService.getLastSync();
      return {
        success: true,
        data: {
          last_sync: lastSync ? { timestamp: lastSync.timestamp } : null,
          offline: true
        }
      };
    }
  }
};

// Dashboard Service
export const dashboardService = {
  async getStats() {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      // Return local stats if offline
      const [patients, tasks, visits, referrals] = await Promise.all([
        patientService.getAll(),
        taskService.getPending(),
        visitService.getAll(),
        referralService.getPending()
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todayVisits = visits.rows?.filter(v => v.doc.visit_date?.startsWith(today)).length || 0;

      return {
        success: true,
        data: {
          total_patients: patients.total_rows || 0,
          pending_tasks: tasks.docs?.length || 0,
          today_visits: todayVisits,
          pending_referrals: referrals.docs?.length || 0,
          offline: true
        }
      };
    }
  }
};

// Protocol Service
export const protocolApiService = {
  async assess(assessment) {
    try {
      const response = await api.post('/protocols/assess', assessment);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Supply Service
export const supplyApiService = {
  async getAll() {
    try {
      const response = await api.get('/supplies');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  async report(data) {
    try {
      const response = await api.post('/supplies/report', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// User Management Service
export const userApiService = {
  async getAll(params) {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  async approve(id) {
    try {
      const response = await api.post(`/users/${id}/approve`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  async update(id, data) {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

// Scaling Management Service
export const scalingApiService = {
  async getStatus() {
    try {
      const response = await api.get('/scaling/status');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  async getMetrics() {
    try {
      const response = await api.get('/scaling/metrics');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  async trigger(action, target) {
    try {
      const response = await api.post('/scaling/trigger', { action, target });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }
};

export default {
  authService,
  patientApiService,
  visitApiService,
  taskApiService,
  householdApiService,
  referralApiService,
  syncApiService,
  dashboardService,
  protocolApiService,
  supplyApiService,
  userApiService,
  scalingApiService
};
