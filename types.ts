
export enum LicenseClass {
  B1 = 'B tự động',
  B2 = 'B cơ khí',
  C1 = 'C1',
}

export interface Session {
  id: string;
  studentId: string;
  date: string;
  startTime: string;
  endTime: string;
  distanceKm: number;
  durationMinutes: number;
  notes?: string;
  isNight: boolean;
  isAutomatic: boolean;
}

export interface Student {
  id: string;
  fullName: string;
  licenseClass: LicenseClass;
  dateOfBirth: string;
  phone: string;
  avatarUrl: string;
  targetKm: number;
  targetHours: number;
  currentKm: number;
  currentHours: number;
  targetNightHours: number;
  currentNightHours: number;
  targetAutomaticHours: number;
  currentAutomaticHours: number;
  sessions: Session[];
}

export type DatConfig = Record<LicenseClass, { 
  km: number; 
  hours: number; 
  nightHours: number;
  automaticHours: number;
}>;

export interface ClassDuration {
  startDate: string;
  endDate: string;
}

export interface CourseInfo {
  id?: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  classDates?: Partial<Record<LicenseClass, ClassDuration>>;
  students?: Student[];
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  date?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
