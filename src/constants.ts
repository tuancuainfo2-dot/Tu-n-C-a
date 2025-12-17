import { Student, LicenseClass } from "./types";

export const DAT_REQUIREMENTS: Record<
  LicenseClass,
  { km: number; hours: number }
> = {
  A1: { km: 100, hours: 10 },
  A2: { km: 200, hours: 20 },
  B1: { km: 300, hours: 30 },
  B2: { km: 400, hours: 40 },
  C: { km: 500, hours: 50 },
};

export const MOCK_STUDENTS: Student[] = [];
