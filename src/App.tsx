import React, { useEffect, useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import StudentList from "./components/StudentList";
import SessionEntry from "./components/SessionEntry";
import Login from "./components/Login";
import { Student, CourseInfo, Notification, UserProfile } from "./types";
import { DAT_REQUIREMENTS } from "./constants";
import { safeGet, safeSet } from "./utils/storage";

const DEFAULT_COURSE: CourseInfo = {
  id: "current",
  name: "Khóa đào tạo lái xe",
  academicYear: "2025",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
};

const App: React.FC = () => {
  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // App state
  const [activeTab, setActiveTab] =
    useState<"dashboard" | "students" | "session">("dashboard");
  const [students, setStudents] = useState<Student[]>([]);
  const [courseInfo, setCourseInfo] =
    useState<CourseInfo>(DEFAULT_COURSE);
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  /* =====================
     LOAD DATA (SAFE)
  ====================== */
  useEffect(() => {
    if (!currentUser) return;
    const raw = safeGet(`dat_${currentUser.id}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setStudents(parsed.students || []);
        setCourseInfo(parsed.courseInfo || DEFAULT_COURSE);
      } catch {
        console.warn("Không đọc được dữ liệu cũ");
      }
    }
  }, [currentUser]);

  /* =====================
     SAVE DATA (SAFE)
  ====================== */
  useEffect(() => {
    if (!currentUser) return;
    safeSet(
      `dat_${currentUser.id}`,
      JSON.stringify({ students, courseInfo })
    );
  }, [students, courseInfo, currentUser]);

  /* =====================
     LOGIN
  ====================== */
  const handleLogin = () => {
    setCurrentUser({ id: "admin", name: "Quản trị" });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setStudents([]);
  };

  /* =====================
     STUDENTS
  ====================== */
  const addStudent = () => {
    const config = DAT_REQUIREMENTS.B2;
    setStudents((prev) => [
      {
        id: `SV${Date.now()}`,
        fullName: "Học viên mới",
        licenseClass: "B2",
        dateOfBirth: "2000-01-01",
        phone: "000000000",
        targetKm: config.km,
        targetHours: config.hours,
        currentKm: 0,
        currentHours: 0,
        sessions: [],
      },
      ...prev,
    ]);
  };

  /* =====================
     NOTIFICATION
  ====================== */
  useEffect(() => {
    const today = new Date();
    const end = new Date(courseInfo.endDate);
    const diff =
      Math.ceil(
        (end.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      ) || 0;

    if (diff <= 7) {
      setNotifications([
        {
          id: "course-warning",
          type: "warning",
          message:
            diff <= 0
              ? "Khóa học đã kết thúc"
              : `Khóa học sắp kết thúc (${diff} ngày)`,
          date: today.toLocaleDateString("vi-VN"),
        },
      ]);
    } else {
      setNotifications([]);
    }
  }, [courseInfo]);

  /* =====================
     RENDER
  ====================== */
  if (!isLoggedIn) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Đăng nhập</h2>
        <button onClick={handleLogin}>Vào hệ thống</button>
      </div>
    );
  }

  return (
    <Layout>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setActiveTab("dashboard")}>
          Dashboard
        </button>
        <button onClick={() => setActiveTab("students")}>
          Học viên
        </button>
        <button onClick={() => setActiveTab("session")}>
          Buổi học
        </button>
        <button onClick={handleLogout}>Đăng xuất</button>
      </div>

      {activeTab === "dashboard" && (
        <Dashboard />
      )}

      {activeTab === "students" && (
        <>
          <button onClick={addStudent}>
            + Thêm học viên
          </button>
          <StudentList />
        </>
      )}

      {activeTab === "session" && (
        <SessionEntry />
      )}
    </Layout>
  );
};

export default App;
