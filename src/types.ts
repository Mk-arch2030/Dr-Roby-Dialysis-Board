export type SessionStatus = 'active' | 'completed';
export type SlotStatus = SessionStatus | 'available';

export interface Patient {
  name: string;
  fileNo: string;
  age: number;
  phone?: string;
}

export interface Vital {
  id: string;
  at: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  ufRemovedMl: number;
  note?: string;
}

export interface Session {
  id: string;
  status: SessionStatus;
  patient: Patient;
  access: string;
  machine: string;
  dryWeight: number;
  preWeight: number;
  ufGoalMl: number;
  ufRemovedMl: number;
  qb: number;
  durationMin: number;
  startedAt: string;
  endedAt?: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  vitals: Vital[];
  notes?: string;
}

export interface Slot {
  id: number;
  machine: string;
  session: Session | null;
}

export interface SlotCounts {
  total: number;
  active: number;
  completed: number;
  available: number;
}

export type FilterKey = 'all' | SessionStatus | 'available';

export type Role = 'doctor' | 'nurse' | 'admin';

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: Role;
}

export const ROLE_LABELS: Record<Role, string> = {
  doctor: 'طبيب',
  nurse: 'تمريض',
  admin: 'مسؤول النظام',
};
