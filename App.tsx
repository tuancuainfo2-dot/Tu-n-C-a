
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import SessionEntry from './components/SessionEntry';
import Login from './components/Login';
import { MOCK_STUDENTS, DAT_REQUIREMENTS } from './constants';
import { Student, LicenseClass, CourseInfo, Notification, UserProfile } from './types';

// Default initial state (if no local storage data found)
const DEFAULT_COURSE_INFO: CourseInfo = {
  id: 'current',
  name: "Khóa K24 - Đào tạo Sát hạch",
  academicYear: "Niên khóa 2023 - 2024",
  startDate: "2023-10-05",
  endDate: "2024-03-05",
  classDates: {
    [LicenseClass.B1]: { startDate: "2023-10-05", endDate: "2024-01-05" },
    [LicenseClass.B2]: { startDate: "2023-10-05", endDate: "2024-02-05" },
    [LicenseClass.C1]: { startDate: "2023-10-05", endDate: "2024-03-05" },
  }
};

const DEFAULT_COURSE_HISTORY: CourseInfo[] = [
    {
      id: 'h1',
      name: "Khóa K23 - Đào tạo Sát hạch",
      academicYear: "Niên khóa 2022 - 2023",
      startDate: "2022-10-05",
      endDate: "2023-02-05",
      classDates: {
        [LicenseClass.B1]: { startDate: "2022-10-05", endDate: "2023-01-05" },
        [LicenseClass.B2]: { startDate: "2022-10-05", endDate: "2023-02-05" },
        [LicenseClass.C1]: { startDate: "2022-10-05", endDate: "2023-03-05" },
      },
      students: []
    }
];

const App: React.FC = () => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // App State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'session'>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [courseInfo, setCourseInfo] = useState<CourseInfo>(DEFAULT_COURSE_INFO);
  const [courseHistory, setCourseHistory] = useState<CourseInfo[]>([]);

  // --- DATA PERSISTENCE LOGIC ---
  
  // Load data when user logs in
  const loadUserData = (userId: string) => {
    const storageKey = `dat_app_data_${userId}`;
    let savedData: string | null = null;
try {
  savedData = localStorage.getItem(storageKey);
} catch (e) {
  console.error("localStorage error", e);
}

    
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            
            // Migration logic: Ensure new fields exist on old data
            const migratedStudents = (parsed.students || []).map((s: any) => ({
                ...s,
                currentNightHours: s.currentNightHours || 0,
                targetNightHours: s.targetNightHours || (DAT_REQUIREMENTS[s.licenseClass as LicenseClass]?.nightHours || 1),
                currentAutomaticHours: s.currentAutomaticHours || 0,
                targetAutomaticHours: s.targetAutomaticHours || (DAT_REQUIREMENTS[s.licenseClass as LicenseClass]?.automaticHours || 0),
                sessions: (s.sessions || []).map((sess: any) => ({
                    ...sess,
                    isNight: sess.isNight || false,
                    isAutomatic: sess.isAutomatic || false
                }))
            }));

            // Migration for Course Info classDates
            const migratedCourseInfo = parsed.courseInfo || DEFAULT_COURSE_INFO;
            if (!migratedCourseInfo.classDates) {
                migratedCourseInfo.classDates = {
                    [LicenseClass.B1]: { startDate: migratedCourseInfo.startDate, endDate: migratedCourseInfo.endDate },
                    [LicenseClass.B2]: { startDate: migratedCourseInfo.startDate, endDate: migratedCourseInfo.endDate },
                    [LicenseClass.C1]: { startDate: migratedCourseInfo.startDate, endDate: migratedCourseInfo.endDate },
                };
            }

            setStudents(migratedStudents);
            setCourseInfo(migratedCourseInfo);
            setCourseHistory(parsed.courseHistory || DEFAULT_COURSE_HISTORY);
        } catch (e) {
            console.error("Error parsing user data", e);
            // Fallback to defaults
            setStudents(MOCK_STUDENTS);
            setCourseInfo(DEFAULT_COURSE_INFO);
            setCourseHistory(DEFAULT_COURSE_HISTORY);
        }
    } else {
        // First time user, load defaults
        setStudents(MOCK_STUDENTS); 
        setCourseInfo(DEFAULT_COURSE_INFO);
        setCourseHistory(DEFAULT_COURSE_HISTORY);
    }
  };

  // Save data whenever it changes
  useEffect(() => {
    if (isLoggedIn && currentUser) {
        const storageKey = `dat_app_data_${currentUser.id}`;
        const dataToSave = {
            students,
            courseInfo,
            courseHistory
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [students, courseInfo, courseHistory, isLoggedIn, currentUser]);


  // Auth Handlers
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    loadUserData(user.id);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    // Clear current state to avoid flashing old data on next login
    setStudents([]);
  };

  // Calculate notifications when courseInfo changes
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkCourseStatus = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(courseInfo.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const newNotifications: Notification[] = [];
      const todayStr = new Date().toLocaleDateString('vi-VN');

      if (diffDays < 0) {
        newNotifications.push({
          id: 'course-ended',
          type: 'error',
          message: `Khóa học "${courseInfo.name}" đã kết thúc vào ngày ${new Date(courseInfo.endDate).toLocaleDateString('vi-VN')}.`,
          date: todayStr
        });
      } else if (diffDays <= 7) {
        newNotifications.push({
          id: 'course-ending-soon',
          type: 'warning',
          message: diffDays === 0 
            ? `Khóa học "${courseInfo.name}" sẽ kết thúc HÔM NAY.` 
            : `Cảnh báo: Khóa học "${courseInfo.name}" chỉ còn ${diffDays} ngày nữa là kết thúc.`,
          date: todayStr
        });
      }
      
      setNotifications(newNotifications);
    };

    checkCourseStatus();
  }, [courseInfo, isLoggedIn]);

  const handleUpdateCourseInfo = (info: CourseInfo) => {
    setCourseInfo(info);
  };

  const handleArchiveCourse = () => {
    const newHistoryItem: CourseInfo = { 
        ...courseInfo, 
        id: `h-${Date.now()}`,
        students: [...students]
    };
    setCourseHistory([newHistoryItem, ...courseHistory]);
    alert("Đã lưu khóa học hiện tại vào lịch sử!");
  };

  const handleDeleteHistory = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khóa học này khỏi lịch sử?")) {
      setCourseHistory(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddSession = (studentId: string, km: number, minutes: number, date: string, isNight: boolean, isAutomatic: boolean) => {
    setStudents(prevStudents => prevStudents.map(student => {
      if (student.id !== studentId) return student;

      const durationHours = minutes / 60;

      const newSession = {
        id: `SES${Date.now()}`,
        studentId: student.id,
        date,
        startTime: '00:00', // Placeholder
        endTime: '00:00',   // Placeholder
        distanceKm: km,
        durationMinutes: minutes,
        isNight,
        isAutomatic
      };

      return {
        ...student,
        currentKm: +(student.currentKm + km).toFixed(1),
        currentHours: +(student.currentHours + durationHours).toFixed(1),
        currentNightHours: +(student.currentNightHours + (isNight ? durationHours : 0)).toFixed(1),
        currentAutomaticHours: +(student.currentAutomaticHours + (isAutomatic ? durationHours : 0)).toFixed(1),
        sessions: [newSession, ...student.sessions]
      };
    }));
  };
  
  const handleDeleteSession = (studentId: string, sessionId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phiên chạy này? Dữ liệu tổng sẽ được cập nhật lại.")) {
        setStudents(prevStudents => prevStudents.map(student => {
            if (student.id !== studentId) return student;

            const sessionToDelete = student.sessions.find(s => s.id === sessionId);
            if (!sessionToDelete) return student;

            const updatedSessions = student.sessions.filter(s => s.id !== sessionId);
            
            // Recalculate totals to ensure accuracy
            const totalKm = updatedSessions.reduce((sum, s) => sum + s.distanceKm, 0);
            const totalMinutes = updatedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
            const totalNightMinutes = updatedSessions.reduce((sum, s) => sum + (s.isNight ? s.durationMinutes : 0), 0);
            const totalAutoMinutes = updatedSessions.reduce((sum, s) => sum + (s.isAutomatic ? s.durationMinutes : 0), 0);

            return {
                ...student,
                sessions: updatedSessions,
                currentKm: parseFloat(totalKm.toFixed(1)),
                currentHours: parseFloat((totalMinutes / 60).toFixed(1)),
                currentNightHours: parseFloat((totalNightMinutes / 60).toFixed(1)),
                currentAutomaticHours: parseFloat((totalAutoMinutes / 60).toFixed(1))
            };
        }));
    }
  };

  const handleAddStudent = (data: { id?: string; fullName: string; licenseClass: LicenseClass; dateOfBirth: string; phone: string }) => {
    if (data.id && students.some(s => s.id === data.id)) {
        alert(`Mã học viên "${data.id}" đã tồn tại! Vui lòng chọn mã khác.`);
        return;
    }

    const config = DAT_REQUIREMENTS[data.licenseClass];
    const newStudent: Student = {
      id: data.id || `SV${Date.now().toString().slice(-4)}`,
      fullName: data.fullName,
      licenseClass: data.licenseClass,
      dateOfBirth: data.dateOfBirth,
      phone: data.phone,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random`,
      targetKm: config.km,
      targetHours: config.hours,
      currentKm: 0,
      currentHours: 0,
      targetNightHours: config.nightHours,
      currentNightHours: 0,
      targetAutomaticHours: config.automaticHours,
      currentAutomaticHours: 0,
      sessions: []
    };
    
    setStudents(prev => [newStudent, ...prev]);
  };

  const handleEditStudent = (oldId: string, data: { id: string; fullName: string; licenseClass: LicenseClass; dateOfBirth: string; phone: string }) => {
    setStudents(prev => {
        if (data.id !== oldId && prev.some(s => s.id === data.id)) {
             alert(`Mã học viên "${data.id}" đã tồn tại! Không thể cập nhật.`);
             return prev;
        }

        return prev.map(s => {
            if (s.id !== oldId) return s;

            let newTargets = { 
                targetKm: s.targetKm, 
                targetHours: s.targetHours,
                targetNightHours: s.targetNightHours,
                targetAutomaticHours: s.targetAutomaticHours
            };
            
            if (data.licenseClass !== s.licenseClass) {
                const config = DAT_REQUIREMENTS[data.licenseClass];
                newTargets = { 
                    targetKm: config.km, 
                    targetHours: config.hours,
                    targetNightHours: config.nightHours,
                    targetAutomaticHours: config.automaticHours
                };
            }

            const updatedSessions = s.sessions.map(sess => ({ ...sess, studentId: data.id }));

            return {
                ...s,
                id: data.id,
                fullName: data.fullName,
                licenseClass: data.licenseClass,
                dateOfBirth: data.dateOfBirth,
                phone: data.phone,
                ...newTargets,
                sessions: updatedSessions,
                avatarUrl: data.fullName !== s.fullName ? `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random` : s.avatarUrl
            };
        });
    });
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  if (!isLoggedIn) {
  return <div style={{ padding: 20 }}>LOGIN SCREEN OK</div>;
}
  return (
    <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        notifications={notifications} 
        onLogout={handleLogout}
        user={currentUser || undefined}
    >
      {activeTab === 'dashboard' && (
        <Dashboard 
          students={students} 
          courseInfo={courseInfo}
          courseHistory={courseHistory}
          onUpdateCourse={handleUpdateCourseInfo}
          onArchiveCourse={handleArchiveCourse}
          onDeleteHistory={handleDeleteHistory}
        />
      )}
      {activeTab === 'students' && (
        <StudentList 
          students={students} 
          courseInfo={courseInfo}
          onAddStudent={handleAddStudent}
          onEditStudent={handleEditStudent}
          onDeleteStudent={handleDeleteStudent}
          onDeleteSession={handleDeleteSession}
        />
      )}
      {activeTab === 'session' && (
        <SessionEntry 
          students={students} 
          onAddSession={handleAddSession} 
        />
      )}
    </Layout>
  );
};

export default App;
