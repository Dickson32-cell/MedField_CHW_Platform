import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { 
  User, 
  Patient, 
  Visit, 
  Task, 
  Referral, 
  Household,
  DashboardStats,
  ApiResponse 
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Handle API errors
const handleApiError = <T = unknown>(error: AxiosError | Error): ApiResponse<T> => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return error.response.data as ApiResponse<T>;
    } else if (error.request) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  }
  return { success: false, message: error.message };
};

// Auth Service
export const authService = {
  async login(username: string, password: string): Promise<ApiResponse<{ accessToken: string; user: User }>> {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
      }
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<User | null> {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// User Service
export const userService = {
  async getAll(params?: { role?: string; limit?: number }): 
    Promise<ApiResponse<{ users: User[]; total: number }>> {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async getCHWs(): Promise<ApiResponse<{ users: User[] }>> {
    return this.getAll({ role: 'chw' });
  },

  async createStaff(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async update(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async deactivate(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async approveUser(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await api.post(`/users/${id}/approve`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async resetPassword(id: string, passwords: { currentPassword: string; newPassword: string }): 
    Promise<ApiResponse<void>> {
    try {
      const response = await api.post(`/users/${id}/reset-password`, passwords);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Patient Service
export const patientService = {
  async getAll(params?: { search?: string; limit?: number; offset?: number }): 
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

  async create(patientData: Partial<Patient>): Promise<ApiResponse<Patient>> {
    try {
      const response = await api.post('/patients', patientData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async update(id: string, patientData: Partial<Patient>): Promise<ApiResponse<Patient>> {
    try {
      const response = await api.put(`/patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`/patients/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Visit Service
export const visitService = {
  async getAll(params?: { patient_id?: string; chw_id?: string; limit?: number; offset?: number }): 
    Promise<ApiResponse<{ visits: Visit[]; total: number }>> {
    try {
      const response = await api.get('/visits', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async getById(id: string): Promise<ApiResponse<Visit>> {
    try {
      const response = await api.get(`/visits/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async create(visitData: Partial<Visit>): Promise<ApiResponse<Visit>> {
    try {
      const response = await api.post('/visits', visitData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async update(id: string, visitData: Partial<Visit>): Promise<ApiResponse<Visit>> {
    try {
      const response = await api.put(`/visits/${id}`, visitData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Task Service
export const taskService = {
  async getAll(params?: { status?: string; priority?: string; limit?: number; offset?: number }): 
    Promise<ApiResponse<{ tasks: Task[]; total: number }>> {
    try {
      const response = await api.get('/tasks', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async getById(id: string): Promise<ApiResponse<Task>> {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async create(taskData: Partial<Task>): Promise<ApiResponse<Task>> {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async update(id: string, taskData: Partial<Task>): Promise<ApiResponse<Task>> {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Referral Service
export const referralService = {
  async getAll(params?: { status?: string; limit?: number; offset?: number }): 
    Promise<ApiResponse<{ referrals: Referral[]; total: number }>> {
    try {
      const response = await api.get('/referrals', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async getById(id: string): Promise<ApiResponse<Referral>> {
    try {
      const response = await api.get(`/referrals/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async create(referralData: Partial<Referral>): Promise<ApiResponse<Referral>> {
    try {
      const response = await api.post('/referrals', referralData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async update(id: string, referralData: Partial<Referral>): Promise<ApiResponse<Referral>> {
    try {
      const response = await api.put(`/referrals/${id}`, referralData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Household Service
export const householdService = {
  async getAll(params?: { limit?: number; offset?: number }): 
    Promise<ApiResponse<{ households: Household[]; total: number }>> {
    try {
      const response = await api.get('/households', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async getById(id: string): Promise<ApiResponse<Household>> {
    try {
      const response = await api.get(`/households/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async create(householdData: Partial<Household>): Promise<ApiResponse<Household>> {
    try {
      const response = await api.post('/households', householdData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async update(id: string, householdData: Partial<Household>): Promise<ApiResponse<Household>> {
    try {
      const response = await api.put(`/households/${id}`, householdData);
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
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
      return handleApiError(error as AxiosError);
    }
  },

  async getRecentActivity(): Promise<ApiResponse<{ recent_syncs: unknown[] }>> {
    try {
      const response = await api.get('/sync/status');
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Sync Service
export const syncService = {
  async getStatus(): Promise<ApiResponse<{ last_sync: { timestamp: string } | null }>> {
    try {
      const response = await api.get('/sync/status');
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async triggerSync(): Promise<ApiResponse<void>> {
    try {
      const response = await api.post('/sync/trigger');
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

// Report Service
export const reportService = {
  async getVisitReport(params?: { start_date?: string; end_date?: string }): 
    Promise<ApiResponse<unknown>> {
    try {
      const response = await api.get('/reports/visits', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  },

  async getPatientReport(): Promise<ApiResponse<unknown>> {
    try {
      const response = await api.get('/reports/patients');
      return response.data;
    } catch (error) {
      return handleApiError(error as AxiosError);
    }
  }
};

export default {
  authService,
  userService,
  patientService,
  visitService,
  taskService,
  referralService,
  householdService,
  dashboardService,
  syncService,
  reportService
};
