import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  userService, 
  patientService, 
  visitService, 
  taskService, 
  referralService,
  householdService,
  dashboardService 
} from '../services/api';
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

// Query Keys
export const queryKeys = {
  users: 'users',
  patients: 'patients',
  visits: 'visits',
  tasks: 'tasks',
  referrals: 'referrals',
  households: 'households',
  dashboard: 'dashboard',
};

// Dashboard Hooks
export const useDashboardStats = (options?: UseQueryOptions<DashboardStats, Error>) => {
  return useQuery({
    queryKey: [queryKeys.dashboard, 'stats'],
    queryFn: async () => {
      const response = await dashboardService.getStats();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch dashboard stats');
      }
      return response.data!;
    },
    ...options,
  });
};

export const useRecentActivity = () => {
  return useQuery({
    queryKey: [queryKeys.dashboard, 'activity'],
    queryFn: async () => {
      const response = await dashboardService.getRecentActivity();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch recent activity');
      }
      return response.data?.recent_syncs || [];
    },
  });
};

// User Hooks
export const useUsers = (params?: { role?: string; limit?: number }) => {
  return useQuery({
    queryKey: [queryKeys.users, params],
    queryFn: async () => {
      const response = await userService.getAll(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch users');
      }
      return response.data?.users || [];
    },
  });
};

export const useCHWs = () => {
  return useUsers({ role: 'chw' });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await userService.createStaff(userData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create user');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users] });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await userService.update(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update user');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users] });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useApproveUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await userService.approveUser(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to approve user');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.users] });
      toast.success('User approved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Patient Hooks
export const usePatients = (params?: { search?: string; limit?: number }) => {
  return useQuery({
    queryKey: [queryKeys.patients, params],
    queryFn: async () => {
      const response = await patientService.getAll(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch patients');
      }
      return response.data?.patients || [];
    },
  });
};

export const usePatient = (id: string) => {
  return useQuery({
    queryKey: [queryKeys.patients, id],
    queryFn: async () => {
      const response = await patientService.getById(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch patient');
      }
      return response.data!;
    },
    enabled: !!id,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (patientData: Partial<Patient>) => {
      const response = await patientService.create(patientData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create patient');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.patients] });
      toast.success('Patient created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Patient> }) => {
      const response = await patientService.update(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update patient');
      }
      return response.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.patients] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.patients, variables.id] });
      toast.success('Patient updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Visit Hooks
export const useVisits = (params?: { patient_id?: string; limit?: number }) => {
  return useQuery({
    queryKey: [queryKeys.visits, params],
    queryFn: async () => {
      const response = await visitService.getAll(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch visits');
      }
      return response.data?.visits || [];
    },
  });
};

export const useCreateVisit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (visitData: Partial<Visit>) => {
      const response = await visitService.create(visitData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create visit');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.visits] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.dashboard] });
      toast.success('Visit recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Task Hooks
export const useTasks = (params?: { status?: string; limit?: number }) => {
  return useQuery({
    queryKey: [queryKeys.tasks, params],
    queryFn: async () => {
      const response = await taskService.getAll(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch tasks');
      }
      return response.data?.tasks || [];
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Task> }) => {
      const response = await taskService.update(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update task');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.tasks] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.dashboard] });
      toast.success('Task updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Referral Hooks
export const useReferrals = (params?: { status?: string; limit?: number }) => {
  return useQuery({
    queryKey: [queryKeys.referrals, params],
    queryFn: async () => {
      const response = await referralService.getAll(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch referrals');
      }
      return response.data?.referrals || [];
    },
  });
};

export const useUpdateReferral = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Referral> }) => {
      const response = await referralService.update(id, data);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update referral');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.referrals] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.dashboard] });
      toast.success('Referral updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Household Hooks
export const useHouseholds = (params?: { limit?: number }) => {
  return useQuery({
    queryKey: [queryKeys.households, params],
    queryFn: async () => {
      const response = await householdService.getAll(params);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch households');
      }
      return response.data?.households || [];
    },
  });
};
