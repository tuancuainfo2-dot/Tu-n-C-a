export type LicenseClass = "A1" | "A2" | "B1" | "B2" | "C";

export type Session = {
  id: string;
  studentId: string;
  date: string;
  startTime: string;
  endTime: string;
  distanceKm: number;
  durationMinutes: number;
};

export type Student = {
  id: string;
  fullName: string;
  licenseClass: LicenseClass;
  dateOfBirth: string;
  phone: string;
  avatarUrl?: string;
  targetKm: number;
  targetHours: number;
  currentKm: number;
  currentHours: number;
  sessions: Session[];
};

export type CourseInfo = {
  id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  students?: Student[];
};

export type Notification = {
  id: string;
  type: "info" | "warning" | "error";
  message: string;
  date: string;
};

export type UserProfile = {
  id: string;
  name: string;
};
