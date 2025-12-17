import React, { useState } from "react";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import StudentList from "./components/StudentList";
import SessionEntry from "./components/SessionEntry";
import Login from "./components/Login";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] =
    useState<"dashboard" | "students" | "session">("dashboard");

  if (!isLoggedIn) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>
        <button onClick={() => setIsLoggedIn(true)}>Đăng nhập</button>
      </div>
    );
  }

  return (
    <Layout>
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
        <button onClick={() => setActiveTab("students")}>Students</button>
        <button onClick={() => setActiveTab("session")}>Session</button>
      </div>

      {activeTab === "dashboard" && <Dashboard />}
      {activeTab === "students" && <StudentList />}
      {activeTab === "session" && <SessionEntry />}
    </Layout>
  );
};

export default App;
