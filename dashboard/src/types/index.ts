// MedField Dashboard Type Definitions

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
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
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
  created_at?: string;
}

// Dashboard Types
export interface DashboardStats {
  total_chws?: number;
  total_patients: number;
  pending_tasks: number;
  today_visits: number;
  pending_referrals: number;
  offline?: boolean;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Sync Types
export interface SyncLog {
  id: string;
  user_id?: string;
  user?: User;
  type: 'push' | 'pull';
  status: 'success' | 'failed' | 'in_progress';
  records_pushed?: number;
  records_pulled?: number;
  timestamp: string;
  started_at?: string;
  completed_at?: string;
}

// Report Types
export interface VisitReport {
  total_visits: number;
  completed_visits: number;
  cancelled_visits: number;
  by_chw: Record<string, number>;
  by_type: Record<string, number>;
}

export interface PatientReport {
  total_patients: number;
  active_patients: number;
  by_gender: Record<string, number>;
  by_age_group: Record<string, number>;
  high_risk_count: number;
  pregnant_count: number;
}
