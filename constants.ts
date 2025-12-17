
import { DatConfig, LicenseClass, Student } from './types';

export const DAT_REQUIREMENTS: DatConfig = {
  [LicenseClass.B1]: { km: 710, hours: 12, nightHours: 1, automaticHours: 0 }, // B1 không yêu cầu giờ số tự động riêng biệt vì mặc định là tự động
  [LicenseClass.B2]: { km: 810, hours: 20, nightHours: 1, automaticHours: 1 },
  [LicenseClass.C1]: { km: 825, hours: 24, nightHours: 1, automaticHours: 1 },
};

export const MOCK_STUDENTS: Student[] = [
  {
    id: 'SV001',
    fullName: 'Nguyễn Văn An',
    licenseClass: LicenseClass.B2,
    dateOfBirth: '1998-05-12',
    phone: '0901234567',
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    targetKm: 810,
    targetHours: 20,
    currentKm: 450,
    currentHours: 12.5,
    targetNightHours: 1,
    currentNightHours: 0.5,
    targetAutomaticHours: 1,
    currentAutomaticHours: 0,
    sessions: [
      {
        id: 'SES001',
        studentId: 'SV001',
        date: '2023-10-25',
        startTime: '18:00',
        endTime: '21:00',
        distanceKm: 120,
        durationMinutes: 180,
        isNight: true,
        isAutomatic: false
      }
    ]
  },
  {
    id: 'SV002',
    fullName: 'Trần Thị Bích',
    licenseClass: LicenseClass.B1,
    dateOfBirth: '2000-01-20',
    phone: '0909888777',
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    targetKm: 710,
    targetHours: 12,
    currentKm: 680,
    currentHours: 11,
    targetNightHours: 1,
    currentNightHours: 1.5,
    targetAutomaticHours: 0,
    currentAutomaticHours: 0,
    sessions: []
  },
  {
    id: 'SV003',
    fullName: 'Lê Văn Cường',
    licenseClass: LicenseClass.C1,
    dateOfBirth: '1995-11-30',
    phone: '0912345678',
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    targetKm: 825,
    targetHours: 24,
    currentKm: 150,
    currentHours: 4,
    targetNightHours: 1,
    currentNightHours: 0,
    targetAutomaticHours: 1,
    currentAutomaticHours: 0.5,
    sessions: []
  },
];
