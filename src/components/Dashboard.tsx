
import React, { useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Student, LicenseClass, CourseInfo } from '../types';
import { Users, AlertCircle, CheckCircle2, CalendarDays, GraduationCap, Pencil, Archive, History, Trash2, ArrowRight } from 'lucide-react';
import StudentList from './StudentList';

interface DashboardProps {
  students: Student[];
  courseInfo: CourseInfo;
  courseHistory: CourseInfo[];
  onUpdateCourse: (info: CourseInfo) => void;
  onArchiveCourse: () => void;
  onDeleteHistory: (id: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<DashboardProps> = ({ 
  students, 
  courseInfo, 
  courseHistory,
  onUpdateCourse, 
  onArchiveCourse,
  onDeleteHistory 
}) => {
  // Calculate Statistics
  const totalStudents = students.length;
  const completedStudents = students.filter(s => s.currentKm >= s.targetKm && s.currentHours >= s.targetHours).length;
  const inProgressStudents = totalStudents - completedStudents;

  // Edit Modal State
  const editModalRef = useRef<HTMLDialogElement>(null);
  const historyModalRef = useRef<HTMLDialogElement>(null);
  const [editData, setEditData] = useState<CourseInfo>(courseInfo);
  
  // View History State
  const [viewingHistory, setViewingHistory] = useState<CourseInfo | null>(null);

  const openEditModal = () => {
    setEditData(courseInfo);
    editModalRef.current?.showModal();
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCourse(editData);
    editModalRef.current?.close();
  };
  
  const handleViewHistory = (course: CourseInfo) => {
    setViewingHistory(course);
    historyModalRef.current?.showModal();
  };

  const classData = [
    { name: 'Hạng B tự động', value: students.filter(s => s.licenseClass === LicenseClass.B1).length },
    { name: 'Hạng B cơ khí', value: students.filter(s => s.licenseClass === LicenseClass.B2).length },
    { name: 'Hạng C1', value: students.filter(s => s.licenseClass === LicenseClass.C1).length },
  ];

  const progressData = students.map(s => ({
    name: s.fullName.split(' ').pop(), // Last name only for chart
    'Đã chạy (Km)': s.currentKm,
    'Mục tiêu (Km)': s.targetKm
  }));

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN').format(date);
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Bảng điều khiển</h1>
        <p className="text-slate-500 mt-1">Tổng quan tình hình đào tạo lái xe DAT</p>
      </header>

      {/* Course Info Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-900/20 text-white relative overflow-hidden group p-1">
         <div className="bg-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl h-full">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 opacity-30 pointer-events-none blur-3xl"></div>
            
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button 
                onClick={onArchiveCourse}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-all border border-white/10"
                title="Lưu vào lịch sử"
            >
                <Archive size={18} />
            </button>
            <button 
                onClick={openEditModal}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-all border border-white/10"
                title="Chỉnh sửa thông tin khóa học"
            >
                <Pencil size={18} />
            </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                  <div className="p-4 bg-white/20 rounded-2xl shadow-inner border border-white/10">
                  <GraduationCap size={36} className="text-white" />
                  </div>
                  <div>
                  <p className="text-blue-100 font-medium uppercase tracking-wider text-xs mb-1">Khóa đào tạo hiện tại</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{courseInfo.name}</h2>
                  <span className="inline-block mt-1 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-blue-50 border border-white/10">{courseInfo.academicYear}</span>
                  </div>
              </div>
            </div>

            {/* Class specific dates display */}
            {courseInfo.classDates && (
              <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {Object.values(LicenseClass).map((cls) => {
                    const dates = courseInfo.classDates?.[cls];
                    if (!dates) return null;
                    return (
                        <div key={cls} className="bg-white/5 rounded-lg p-3 border border-white/5">
                            <p className="text-xs font-bold text-blue-200 mb-1">{cls}</p>
                            <p className="text-sm text-white">
                                {formatDate(dates.startDate)} - {formatDate(dates.endDate)}
                            </p>
                        </div>
                    );
                 })}
              </div>
            )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Users size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Tổng học viên</p>
                <p className="text-3xl font-bold text-slate-800">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                <CheckCircle2 size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Đủ điều kiện thi</p>
                <p className="text-3xl font-bold text-slate-800">{completedStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
                <AlertCircle size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">Đang đào tạo</p>
                <p className="text-3xl font-bold text-slate-800">{inProgressStudents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            Tiến độ quãng đường (Km)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Đã chạy (Km)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="Mục tiêu (Km)" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
            Phân bố theo hạng bằng
          </h3>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                >
                  {classData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Course History Section */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <History size={20} className="text-slate-500" />
          Lịch sử Đào tạo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseHistory.length === 0 ? (
            <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              <History size={32} className="mx-auto mb-2 opacity-50" />
              Chưa có dữ liệu lịch sử khóa học.
            </div>
          ) : (
            courseHistory.map(course => (
              <div 
                key={course.id} 
                onClick={() => handleViewHistory(course)}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group relative cursor-pointer hover:border-blue-200"
              >
                <div>
                   <div className="flex justify-between items-start mb-2">
                     <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{course.name}</h4>
                     <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if(course.id) onDeleteHistory(course.id);
                        }}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-full"
                        title="Xóa khỏi lịch sử"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                   <p className="text-sm text-blue-600 font-medium mb-3">{course.academicYear}</p>
                   
                   <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl mb-3 border border-slate-100">
                      <CalendarDays size={14} />
                      <span>{formatDate(course.startDate)}</span>
                      <ArrowRight size={12} />
                      <span>{formatDate(course.endDate)}</span>
                   </div>
                   
                   <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Users size={14} />
                        <span>{course.students?.length || 0} học viên</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Course Modal */}
      <dialog ref={editModalRef} className="modal p-0 rounded-2xl shadow-2xl backdrop:bg-gray-900/50 open:animate-fade-in w-11/12 max-w-lg bg-white relative text-left">
        <div className="p-8 max-h-[90vh] overflow-y-auto">
          <form method="dialog">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">✕</button>
          </form>

          <h3 className="font-bold text-xl flex items-center gap-2 mb-6 text-slate-800">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Pencil size={20} />
            </div>
            Cập nhật Thông tin
          </h3>

          <form onSubmit={handleSaveCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên khóa học</label>
              <input 
                required
                type="text"
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                value={editData.name}
                onChange={e => setEditData({...editData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Niên khóa / Ghi chú</label>
              <input 
                required
                type="text"
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                value={editData.academicYear}
                onChange={e => setEditData({...editData, academicYear: e.target.value})}
              />
            </div>

            {/* Class Specific Dates Section */}
            <div className="mt-6 border-t border-slate-100 pt-4">
                 <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CalendarDays size={16} className="text-blue-500" />
                    Thời gian đào tạo theo hạng
                 </h4>
                 <div className="space-y-3">
                    {Object.values(LicenseClass).map((cls) => (
                        <div key={cls} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-blue-600 mb-2 uppercase">{cls}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Bắt đầu</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={editData.classDates?.[cls]?.startDate || editData.startDate}
                                        onChange={(e) => {
                                            const newDates = { ...(editData.classDates || {}) };
                                            newDates[cls] = { 
                                                startDate: e.target.value, 
                                                endDate: newDates[cls]?.endDate || editData.endDate 
                                            };
                                            setEditData({ ...editData, classDates: newDates });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Kết thúc</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={editData.classDates?.[cls]?.endDate || editData.endDate}
                                        onChange={(e) => {
                                            const newDates = { ...(editData.classDates || {}) };
                                            newDates[cls] = { 
                                                startDate: newDates[cls]?.startDate || editData.startDate, 
                                                endDate: e.target.value 
                                            };
                                            setEditData({ ...editData, classDates: newDates });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6 sticky bottom-0 bg-white">
              <button 
                type="button" 
                onClick={() => editModalRef.current?.close()}
                className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* History Details Modal */}
      <dialog ref={historyModalRef} className="modal p-0 rounded-2xl shadow-2xl backdrop:bg-gray-900/50 open:animate-fade-in w-11/12 max-w-6xl bg-slate-50 relative">
        <div className="p-6 md:p-8 h-[90vh] flex flex-col">
          <form method="dialog">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 z-50 p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
          </form>
          
          {viewingHistory && (
             <>
                <div className="mb-6 flex-shrink-0">
                    <div className="flex items-center gap-2 text-blue-600 mb-2 font-medium bg-blue-50 w-fit px-3 py-1 rounded-full text-sm">
                        <History size={16} />
                        Chi tiết Lịch sử
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{viewingHistory.name}</h2>
                    <div className="flex gap-4 mt-2 text-sm text-slate-500 font-medium flex-wrap">
                        <span>{viewingHistory.academicYear}</span>
                        <span className="text-slate-300">•</span>
                        <span>{formatDate(viewingHistory.startDate)} - {formatDate(viewingHistory.endDate)}</span>
                    </div>

                    {viewingHistory.classDates && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {Object.values(LicenseClass).map((cls) => {
                                const d = viewingHistory.classDates?.[cls];
                                if(!d) return null;
                                return (
                                    <span key={cls} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">
                                        <b>{cls}:</b> {formatDate(d.startDate)} - {formatDate(d.endDate)}
                                    </span>
                                )
                            })}
                        </div>
                    )}
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {viewingHistory.students && viewingHistory.students.length > 0 ? (
                        <StudentList students={viewingHistory.students} readOnly={true} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                            <Users size={48} className="mb-4 opacity-50"/>
                            <p>Không có dữ liệu học viên cho khóa này.</p>
                        </div>
                    )}
                </div>
             </>
          )}
        </div>
      </dialog>
    </div>
  );
};

export default Dashboard;
