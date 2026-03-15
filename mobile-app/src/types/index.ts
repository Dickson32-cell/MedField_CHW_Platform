// MedField Mobile App Type Definitions

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'chw' | 'admin' | 'supervisor';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Patient Types
export interface Patient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  household_id: string;
  is_pregnant: boolean;
  due_date?: string;
  risk_score: number;
  risk_factors: string[];
  chronic_conditions: string[];
  allergies: string[];
  emergency_contact?: EmergencyContact;
  is_active: boolean;
  synced?: boolean;
  synced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

// Visit Types
export interface Visit {
  id: string;
  visit_number: string;
  patient_id: string;
  patient?: Patient;
  chw_id?: string;
  chw?: User;
  visit_type: 'scheduled' | 'unscheduled' | 'follow_up' | 'emergency';
  visit_date: string;
  visit_status: 'pending' | 'completed' | 'cancelled';
  temperature?: number;
  symptoms: string[];
  vitals?: Vitals;
  assessments?: Assessment[];
  notes?: string;
  synced?: boolean;
  synced_at?: string;
  created_at?: string;
}

export interface Vitals {
  temperature?: number;
  blood_pressure?: string;
  heart_rate?: number;
  respiratory_rate?: number;
  weight?: number;
  height?: number;
}

export interface Assessment {
  condition: string;
  classification: 'GREEN' | 'YELLOW' | 'RED';
  action: string;
}

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  task_type: 'visit' | 'follow_up' | 'referral' | 'assessment' | 'other';
  patient_id?: string;
  patient?: Patient;
  assigned_to?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

// Household Types
export interface Household {
  id: string;
  household_id: string;
  head_of_household: string;
  address: string;
  gps_coordinates?: GpsCoordinates;
  members_count: number;
  phone?: string;
  synced?: boolean;
  synced_at?: string;
  created_at?: string;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

// Referral Types
export interface Referral {
  id: string;
  patient_id: string;
  patient?: Patient;
  chw_id?: string;
  chw?: User;
  referral_type: string;
  reason: string;
  priority: 'routine' | 'urgent' | 'emergency';
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  facility?: string;
  notes?: string;
  synced?: boolean;
  synced_at?: string;
  created_at?: string;
}

// Sync Types
export interface SyncQueue {
  patients: Patient[];
  visits: Visit[];
  households: Household[];
  tasks: Task[];
  referrals: Referral[];
}

export interface SyncStatus {
  timestamp: string;
  results?: Record<string, unknown>;
  offline?: boolean;
}

// Dashboard Types
export interface DashboardStats {
  total_patients: number;
  pending_tasks: number;
  today_visits: number;
  pending_referrals: number;
  total_chws?: number;
  offline?: boolean;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Form Types
export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role?: string;
}

export interface PatientFormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  household_id: string;
  is_pregnant: boolean;
  due_date?: string;
  risk_factors: string[];
  chronic_conditions: string[];
  allergies: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface VisitFormData {
  patient_id: string;
  visit_type: string;
  temperature?: string;
  cough: boolean;
  diarrhea: boolean;
  fever: boolean;
  rdt_positive: boolean;
  fast_breathing: boolean;
  chest_indrawing: boolean;
  notes?: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: { role?: string };
  PatientDetail: { patientId: string };
  AddPatient: undefined;
  Visits: { patientId?: string };
  NewVisit: { patientId?: string; patientName?: string };
  Households: undefined;
  AddHousehold: undefined;
  Referrals: undefined;
  Profile: undefined;
  About: undefined;
  UserManagement: undefined;
  SystemPerformance: undefined;
  ScalingConfig: undefined;
};

// Store Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isOffline: boolean;
  lastSync: string | null;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setOffline: (value: boolean) => void;
  setLastSync: (timestamp: string | null) => void;
  logout: () => void;
}
