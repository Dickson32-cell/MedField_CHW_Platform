import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config';
import type { 
  User, 
  Patient, 
  Visit, 
  Task, 
  Household, 
  Referral, 
  SyncQueue,
  DashboardStats,
  ApiResponse,
  LoginFormData,
  RegisterFormData 
} from '../types';

const API_URL = CONFIG.API_URL;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  async (config: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Helper for wait/sleep
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Add response interceptor for retries and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retryCount?: number; _authRetry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

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
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
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
const handleApiError = <T = unknown>(error: AxiosError | Error): ApiResponse<T> => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return error.response.data as ApiResponse<T>;
    } else if (error.request) {
      return { success: false, message: 'Network error - offline mode' };
    }
  }
  return { success: false, message: error.message };
};

// Auth Service
export const authService = {
  async login(
    username: string, 
    password: string, 
    deviceId: string
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>> {
    try {
      const response = await api.post('/auth/login', { 
        username, 
        password, 
        device_id: deviceId 
      });
      
      if (response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        await AsyncStorage.setItem('auth_token', accessToken);
        await AsyncStorage.setItem('auth_refresh_token', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async register(userData: RegisterFormData): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>> {
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
      return handleApiError(error as AxiosError);
    }
  },

  async getProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_refresh_token');
    await AsyncStorage.removeItem('user');
  },

  async getStoredUser(): Promise<User | null> {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// Patient Service (API)
export const patientApiService = {
  async getAll(params?: { search?: string; limit?: number }): 
    Promise<ApiResponse<{ patients: Patient[]; total: number }>> {
    try {
      const response = await api.get('/patients', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async getById(id: string): Promise<ApiResponse<Patient>> {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async create(patient: Partial<Patient>): Promise<ApiResponse<Patient>> {
    try {
      const response = await api.post('/patients', patient);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async update(id: string, patient: Partial<Patient>): Promise<ApiResponse<Patient>> {
    try {
      const response = await api.put(`/patients/${id}`, patient);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Visit Service (API)
export const visitApiService = {
  async getAll(params?: { patient_id?: string; limit?: number }): 
    Promise<ApiResponse<{ visits: Visit[]; total: number }>> {
    try {
      const response = await api.get('/visits', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async create(visit: Partial<Visit>): Promise<ApiResponse<Visit>> {
    try {
      const response = await api.post('/visits', visit);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Task Service (API)
export const taskApiService = {
  async getAll(params?: { status?: string; limit?: number }): 
    Promise<ApiResponse<{ tasks: Task[]; total: number }>> {
    try {
      const response = await api.get('/tasks', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async getToday(): Promise<ApiResponse<{ tasks: Task[] }>> {
    try {
      const response = await api.get('/tasks/today');
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async update(id: string, task: Partial<Task>): Promise<ApiResponse<Task>> {
    try {
      const response = await api.put(`/tasks/${id}`, task);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Household Service (API)
export const householdApiService = {
  async getAll(params?: { limit?: number }): 
    Promise<ApiResponse<{ households: Household[]; total: number }>> {
    try {
      const response = await api.get('/households', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async create(household: Partial<Household>): Promise<ApiResponse<Household>> {
    try {
      const response = await api.post('/households', household);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Referral Service (API)
export const referralApiService = {
  async getAll(params?: { status?: string; limit?: number }): 
    Promise<ApiResponse<{ referrals: Referral[]; total: number }>> {
    try {
      const response = await api.get('/referrals', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async create(referral: Partial<Referral>): Promise<ApiResponse<Referral>> {
    try {
      const response = await api.post('/referrals', referral);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Sync Service
export const syncApiService = {
  async pushData(): Promise<ApiResponse<{ server_timestamp: string; results: Record<string, unknown> }>> {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      // Note: syncService from database would be imported here
      // const queue = await syncService.getSyncQueue();

      const response = await api.post('/sync/push', {
        device_id: deviceId,
        data: {}, // queue data
        last_sync_timestamp: null // await syncService.getLastSync()
      });

      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async pullData(): Promise<ApiResponse<{ server_timestamp: string; data: SyncQueue }>> {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');

      const response = await api.post('/sync/pull', {
        device_id: deviceId,
        last_sync_timestamp: null // await syncService.getLastSync()
      });

      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async getStatus(): Promise<ApiResponse<{ last_sync: { timestamp: string } | null; offline?: boolean }>> {
    try {
      const response = await api.get('/sync/status');
      return response.data;
    } catch (error) {
      return { 
        success: true, 
        data: { 
          last_sync: null, 
          offline: true 
        } 
      };
    }
  }
};

// Dashboard Service
export const dashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      return { 
        success: true, 
        data: {
          total_patients: 0,
          pending_tasks: 0,
          today_visits: 0,
          pending_referrals: 0,
          offline: true
        }
      };
    }
  }
};

// Protocol Service
export const protocolApiService = {
  async assess(assessment: Record<string, unknown>): 
    Promise<ApiResponse<{ danger_signs: string[]; guidances: Array<{ condition: string; classification: string; action: string }> }>> {
    try {
      const response = await api.post('/protocols/assess', assessment);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Supply Service
export const supplyApiService = {
  async getAll(): Promise<ApiResponse<unknown[]>> {
    try {
      const response = await api.get('/supplies');
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
  
  async report(data: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    try {
      const response = await api.post('/supplies/report', data);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// User Management Service
export const userApiService = {
  async getAll(params?: { role?: string; limit?: number }): 
    Promise<ApiResponse<{ users: User[]; total: number }>> {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
  
  async approve(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await api.post(`/users/${id}/approve`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
  
  async update(id: string, data: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Scaling Management Service
export const scalingApiService = {
  async getStatus(): Promise<ApiResponse<unknown>> {
    try {
      const response = await api.get('/scaling/status');
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
  
  async getMetrics(): Promise<ApiResponse<unknown>> {
    try {
      const response = await api.get('/scaling/metrics');
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },
  
  async trigger(action: string, target: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await api.post('/scaling/trigger', { action, target });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
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
