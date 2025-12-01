
export enum PerformanceLevel {
  Low = 0,
  Moderate = 1,
  High = 2
}

export enum PotentialLevel {
  Low = 0,
  Moderate = 1,
  High = 2
}

export type Role = 'admin' | 'manager' | 'director';

export interface Company {
  id: string;
  name: string;
  disableUserAddEmployees?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // For simulation
  role: Role;
  companyId: string;
}

export interface BoxDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  textColor: string;
  x: number;
  y: number;
}

// Static Employee Profile
export interface EmployeeProfile {
  id: string;
  name: string;
  position: string;
  companyId: string;
  createdByUserId: string;
  linkedUserId?: string; // Optional: if this employee record belongs to a registered User
}

// An Assessment Record
export interface Assessment {
  id: string;
  employeeId: string;
  userId: string; // Who did the assessment
  performance: PerformanceLevel;
  potential: PotentialLevel;
  answers: Record<string, number>;
  aiAdvice?: string;
  date: string;
}

// Combined View for Components
export interface EmployeeResult extends EmployeeProfile {
  performance: PerformanceLevel | null;
  potential: PotentialLevel | null;
  aiAdvice?: string;
  answers?: Record<string, number>;
  date?: string;
  assessmentId?: string;
  assessedByUserId?: string;
  riskFlag?: boolean;
  assessmentCount?: number;
  rawX?: number;
  rawY?: number;
}

export type AppStep = 'login' | 'admin_dashboard' | 'director_dashboard' | 'select_employee' | 'assess' | 'assessment_complete' | 'results';
