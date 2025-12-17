import React, { useState } from "react";
import { Student } from "../types";

const StudentList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);

  const addStudent = () => {
    setStudents((s) => [
      ...s,
      {
        id: `SV${Date.now()}`,
        fullName: "Học viên mới",
        licenseClass: "B2",
        dateOfBirth: "2000-01-01",
        phone: "000000000",
        targetKm: 400,
        targetHours: 40,
        currentKm: 0,
        currentHours: 0,
        sessions: [],
      },
    ]);
  };

  return (
    <div>
      <h3>Danh sách học viên</h3>
      <button onClick={addStudent}>+ Thêm học viên</button>
      <ul>
        {students.map((s) => (
          <li key={s.id}>{s.fullName}</li>
        ))}
      </ul>
    </div>
  );
};

export default StudentList;
