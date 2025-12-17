
import React, { useState, useRef, useEffect } from 'react';
import { Student, LicenseClass, CourseInfo } from '../types';
import { analyzeStudentProgress } from '../services/geminiService';
import { Search, BrainCircuit, Car, Clock, TrendingUp, Calendar, Filter, X, UserPlus, Trash2, AlertTriangle, Pencil, Download, History, Moon, Zap, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface StudentListProps {
  students: Student[];
  courseInfo?: CourseInfo;
  onAddStudent?: (data: { id?: string; fullName: string; licenseClass: LicenseClass; dateOfBirth: string; phone: string }) => void;
  onEditStudent?: (oldId: string, data: { id: string; fullName: string; licenseClass: LicenseClass; dateOfBirth: string; phone: string }) => void;
  onDeleteStudent?: (id: string) => void;
  onDeleteSession?: (studentId: string, sessionId: string) => void;
  readOnly?: boolean;
}

type FilterStatus = 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'ALMOST';

// Helper to remove Vietnamese tones for PDF compatibility
const removeVietnameseTones = (str: string) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
};

const StudentList: React.FC<StudentListProps> = ({ students, courseInfo, onAddStudent, onEditStudent, onDeleteStudent, onDeleteSession, readOnly = false }) => {
  // Filter States
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // AI Modal States
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  // History Modal State
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  // Add/Delete/Edit Modal States
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  // New Student Form State
  const [newStudentData, setNewStudentData] = useState({
    id: '',
    fullName: '',
    licenseClass: LicenseClass.B2,
    dateOfBirth: '',
    phone: ''
  });

  // Edit Student Form State
  const [editFormData, setEditFormData] = useState({
    id: '',
    fullName: '',
    licenseClass: LicenseClass.B2,
    dateOfBirth: '',
    phone: ''
  });
  const [editingId, setEditingId] = useState<string>('');

  // Refs for dialogs
  const aiModalRef = useRef<HTMLDialogElement>(null);
  const historyModalRef = useRef<HTMLDialogElement>(null);
  const addModalRef = useRef<HTMLDialogElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const deleteModalRef = useRef<HTMLDialogElement>(null);

  // Sync historyStudent with latest data when students prop changes
  useEffect(() => {
    if (historyStudent) {
      const updatedStudent = students.find(s => s.id === historyStudent.id);
      if (updatedStudent) {
        setHistoryStudent(updatedStudent);
      }
    }
  }, [students]);

  // Helper function to check status
  const checkStatus = (student: Student): FilterStatus => {
    const isKmDone = student.currentKm >= student.targetKm;
    const isHoursDone = student.currentHours >= student.targetHours;
    const isNightDone = student.currentNightHours >= student.targetNightHours;
    const isAutoDone = student.targetAutomaticHours > 0 ? student.currentAutomaticHours >= student.targetAutomaticHours : true;

    if (isKmDone && isHoursDone && isNightDone && isAutoDone) return 'COMPLETED';
    
    // Logic cho "Sắp đạt": > 80% quãng đường và tổng giờ
    const kmRatio = student.currentKm / student.targetKm;
    const hoursRatio = student.currentHours / student.targetHours;
    
    if (kmRatio >= 0.8 || hoursRatio >= 0.8) return 'ALMOST';
    
    return 'IN_PROGRESS';
  };

  const getCourseExpiryStatus = (student: Student) => {
    if (!courseInfo) return null;
    
    // Ưu tiên ngày kết thúc riêng của hạng bằng, nếu không có thì lấy ngày chung
    let endDateStr = courseInfo.endDate;
    if (courseInfo.classDates && courseInfo.classDates[student.licenseClass]?.endDate) {
        endDateStr = courseInfo.classDates[student.licenseClass]!.endDate;
    }

    if (!endDateStr) return null;

    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { type: 'EXPIRED', days: Math.abs(diffDays), label: `Quá hạn ${Math.abs(diffDays)} ngày` };
    if (diffDays <= 7) return { type: 'CRITICAL', days: diffDays, label: `Còn ${diffDays} ngày` };
    if (diffDays <= 15) return { type: 'WARNING', days: diffDays, label: `Còn ${diffDays} ngày` };
    
    return null;
  };

  const filteredStudents = students.filter(student => {
    const matchesClass = filterClass === 'ALL' || student.licenseClass === filterClass;
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.id.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (filterStatus !== 'ALL') {
      const currentStatus = checkStatus(student);
      matchesStatus = currentStatus === filterStatus;
    }
    let matchesDate = true;
    if (startDate || endDate) {
      if (student.sessions.length === 0) {
        matchesDate = false;
      } else {
        const hasSessionInRange = student.sessions.some(session => {
          const sDate = new Date(session.date);
          const start = startDate ? new Date(startDate) : new Date('1970-01-01');
          const end = endDate ? new Date(endDate) : new Date('2099-12-31');
          return sDate >= start && sDate <= end;
        });
        matchesDate = hasSessionInRange;
      }
    }
    return matchesClass && matchesSearch && matchesStatus && matchesDate;
  });

  const handleAnalyze = async (student: Student) => {
    setSelectedStudent(student);
    setAiAnalysis('');
    setLoadingAi(true);
    aiModalRef.current?.showModal();

    const analysis = await analyzeStudentProgress(student);
    setAiAnalysis(analysis);
    setLoadingAi(false);
  };

  const handleViewHistory = (student: Student) => {
    setHistoryStudent(student);
    historyModalRef.current?.showModal();
  };

  const clearFilters = () => {
    setFilterClass('ALL');
    setFilterStatus('ALL');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  // Add Student Handlers
  const openAddModal = () => {
    setNewStudentData({ id: '', fullName: '', licenseClass: LicenseClass.B2, dateOfBirth: '', phone: '' });
    addModalRef.current?.showModal();
  };

  const submitAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.fullName || !newStudentData.phone) return;
    if (onAddStudent) {
        onAddStudent(newStudentData);
    }
    addModalRef.current?.close();
  };

  // Edit Student Handlers
  const openEditModal = (student: Student) => {
    setEditingId(student.id);
    setEditFormData({
        id: student.id,
        fullName: student.fullName,
        licenseClass: student.licenseClass,
        dateOfBirth: student.dateOfBirth,
        phone: student.phone
    });
    editModalRef.current?.showModal();
  };

  const submitEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEditStudent) {
        onEditStudent(editingId, editFormData);
    }
    editModalRef.current?.close();
  };

  // Delete Student Handlers
  const confirmDelete = (student: Student) => {
    setStudentToDelete(student);
    deleteModalRef.current?.showModal();
  };

  const executeDelete = () => {
    if (studentToDelete && onDeleteStudent) {
      onDeleteStudent(studentToDelete.id);
      setStudentToDelete(null);
      deleteModalRef.current?.close();
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Danh sach hoc vien DAT", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 14, 28);

    // Prepare data
    const tableData = filteredStudents.map(student => [
        student.id,
        removeVietnameseTones(student.fullName),
        removeVietnameseTones(student.licenseClass),
        student.dateOfBirth,
        student.phone,
        `${student.currentKm}/${student.targetKm}`,
        `${student.currentHours}/${student.targetHours}`,
        `${student.currentNightHours}/${student.targetNightHours}`,
        student.targetAutomaticHours > 0 ? `${student.currentAutomaticHours}/${student.targetAutomaticHours}` : 'N/A'
    ]);

    autoTable(doc, {
        head: [['Ma HV', 'Ho Ten', 'Hang', 'Ngay Sinh', 'SDT', 'Km', 'Gio', 'Dem', 'Auto']],
        body: tableData,
        startY: 32,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // Blue-500
    });

    doc.save('danh-sach-hoc-vien.pdf');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Danh sách Học viên</h1>
            <p className="text-slate-500 mt-1">Quản lý và theo dõi tiến độ chi tiết</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={clearFilters}
              className="md:hidden self-start text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
            >
              <X size={14} /> Xóa lọc
            </button>
            
            <button
                onClick={handleExportPDF}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm"
                title="Xuất danh sách ra PDF"
            >
                <Download size={18} />
                <span className="hidden sm:inline">Xuất PDF</span>
            </button>

            {!readOnly && (
                <button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5"
                >
                <UserPlus size={18} />
                <span className="hidden sm:inline">Thêm HV</span>
                <span className="sm:hidden">Thêm</span>
                </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
          {/* Search */}
          <div className="lg:col-span-1">
            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Tìm kiếm</label>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Tên hoặc mã HV..."
                className="pl-11 pr-4 py-2.5 w-full border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Class & Status Filters */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-1">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Hạng bằng</label>
              <select 
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow appearance-none cursor-pointer"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="ALL">Tất cả</option>
                <option value={LicenseClass.B1}>Hạng B tự động</option>
                <option value={LicenseClass.B2}>Hạng B cơ khí</option>
                <option value={LicenseClass.C1}>Hạng C1</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Tiến độ</label>
              <select 
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow appearance-none cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              >
                <option value="ALL">Tất cả</option>
                <option value="COMPLETED">Đạt mục tiêu</option>
                <option value="ALMOST">Sắp đạt (>80%)</option>
                <option value="IN_PROGRESS">Đang đào tạo</option>
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="lg:col-span-2">
            <label className="text-xs font-bold text-slate-500 mb-2 block flex items-center gap-1 uppercase tracking-wide">
              <Calendar size={12} /> Phiên chạy trong khoảng
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="date"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-600 transition-shadow"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-slate-300 font-medium">-</span>
              <input 
                type="date"
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-600 transition-shadow"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {(filterClass !== 'ALL' || filterStatus !== 'ALL' || searchTerm || startDate || endDate) && (
                 <button 
                  onClick={clearFilters}
                  className="hidden md:flex p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Xóa bộ lọc"
                 >
                   <Filter size={20} className="rotate-45" />
                 </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudents.map((student) => {
          const progressPercentKm = Math.min(100, Math.round((student.currentKm / student.targetKm) * 100));
          const progressPercentHours = Math.min(100, Math.round((student.currentHours / student.targetHours) * 100));
          const overallStatus = checkStatus(student);
          const expiryStatus = getCourseExpiryStatus(student);
          
          return (
            <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300 relative group hover:-translate-y-1">
              {/* Status Badge */}
              {overallStatus === 'COMPLETED' && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl z-10 shadow-sm">
                  ĐẠT
                </div>
              )}
              {overallStatus === 'ALMOST' && (
                <div className="absolute top-0 right-0 bg-orange-400 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl z-10 shadow-sm">
                  SẮP ĐẠT
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                        <img 
                        src={student.avatarUrl} 
                        alt={student.fullName} 
                        className="w-14 h-14 rounded-full object-cover border-4 border-slate-50 shadow-sm"
                        />
                         <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                            overallStatus === 'COMPLETED' ? 'bg-green-500' : 
                            overallStatus === 'ALMOST' ? 'bg-orange-400' : 'bg-blue-500'
                        }`}></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{student.fullName}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className={`inline-flex items-center w-fit text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            student.licenseClass === LicenseClass.C1 ? 'bg-purple-100 text-purple-700' :
                            student.licenseClass === LicenseClass.B2 ? 'bg-blue-100 text-blue-700' :
                            'bg-teal-100 text-teal-700'
                        }`}>
                            Hạng {student.licenseClass}
                        </span>
                        
                        {/* Expiry Warning Badge */}
                        {expiryStatus && overallStatus !== 'COMPLETED' && (
                            <span className={`inline-flex items-center gap-1 w-fit text-xs px-2 py-0.5 rounded-full font-bold border ${
                                expiryStatus.type === 'EXPIRED' ? 'bg-red-100 text-red-700 border-red-200' :
                                expiryStatus.type === 'CRITICAL' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                                <AlertCircle size={10} />
                                {expiryStatus.label}
                            </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-4 right-14 bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm md:opacity-100 md:relative md:top-0 md:right-0 md:shadow-none md:bg-transparent">
                    <button 
                      onClick={() => handleViewHistory(student)}
                      className="p-2 text-slate-500 bg-slate-50 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Xem lịch sử chạy"
                    >
                      <History size={18} />
                    </button>
                    <button 
                      onClick={() => handleAnalyze(student)}
                      className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Phân tích AI"
                    >
                      <BrainCircuit size={18} />
                    </button>
                    {!readOnly && (
                        <>
                        <button 
                            onClick={() => openEditModal(student)}
                            className="p-2 text-slate-400 bg-transparent rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            title="Sửa thông tin"
                        >
                            <Pencil size={18} />
                        </button>
                        <button 
                            onClick={() => confirmDelete(student)}
                            className="p-2 text-red-300 bg-transparent rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Xóa học viên"
                        >
                            <Trash2 size={18} />
                        </button>
                        </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Progress Bars */}
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium"><Car size={14} className="text-blue-500"/> Quãng đường</span>
                      <span className="font-bold text-slate-700">{student.currentKm} <span className="text-slate-400 font-normal">/ {student.targetKm} Km</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out relative ${progressPercentKm >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                        style={{ width: `${progressPercentKm}%` }}
                      >
                         <div className="absolute top-0 left-0 bottom-0 right-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]"></div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-500 flex items-center gap-1.5 font-medium"><Clock size={14} className="text-orange-500"/> Thời gian</span>
                      <span className="font-bold text-slate-700">{student.currentHours} <span className="text-slate-400 font-normal">/ {student.targetHours} Giờ</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out relative ${progressPercentHours >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                        style={{ width: `${progressPercentHours}%` }}
                      >
                         <div className="absolute top-0 left-0 bottom-0 right-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]"></div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Requirements Badges */}
                  <div className="flex gap-2 pt-2">
                     <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs border font-medium ${student.currentNightHours >= student.targetNightHours ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <Moon size={12} />
                        Ban đêm: {student.currentNightHours}/{student.targetNightHours}h
                     </div>
                     {student.targetAutomaticHours > 0 && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs border font-medium ${student.currentAutomaticHours >= student.targetAutomaticHours ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <Zap size={12} />
                            Tự động: {student.currentAutomaticHours}/{student.targetAutomaticHours}h
                        </div>
                     )}
                  </div>
                </div>
              </div>
              <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex justify-between items-center text-xs font-medium text-slate-500">
                <span>Mã: <span className="text-slate-700">{student.id}</span></span>
                <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  <TrendingUp size={14} />
                  {Math.round((progressPercentKm + progressPercentHours) / 2)}% Tổng thể
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
           <Search size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">Không tìm thấy học viên phù hợp.</p>
          <button onClick={clearFilters} className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline">
            Xóa bộ lọc để xem tất cả
          </button>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* History Details Modal */}
      <dialog ref={historyModalRef} className="modal p-0 rounded-2xl shadow-2xl backdrop:bg-slate-900/50 open:animate-fade-in w-11/12 max-w-4xl bg-white relative">
        <div className="flex flex-col h-[85vh]">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-2xl">
            <div className="flex gap-4 items-center">
              {historyStudent && (
                <img 
                  src={historyStudent.avatarUrl} 
                  alt={historyStudent.fullName} 
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                />
              )}
              <div>
                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                  {historyStudent?.fullName}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      historyStudent?.licenseClass === LicenseClass.C1 ? 'bg-purple-100 text-purple-700' :
                      historyStudent?.licenseClass === LicenseClass.B2 ? 'bg-blue-100 text-blue-700' :
                      'bg-teal-100 text-teal-700'
                    }`}>
                      {historyStudent?.licenseClass}
                    </span>
                </h3>
                <p className="text-slate-500 text-sm mt-1">Mã HV: {historyStudent?.id}</p>
              </div>
            </div>
            <form method="dialog">
               <button className="text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full p-2 hover:bg-slate-100 shadow-sm border border-slate-100">
                  <X size={20} />
               </button>
            </form>
          </div>
          
          {/* Stats Bar */}
          {historyStudent && (
             <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 divide-x divide-slate-100">
                <div className="p-5 flex flex-col items-center justify-center bg-white">
                   <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Tổng quãng đường</p>
                   <p className="text-xl font-bold text-blue-600">{historyStudent.currentKm} <span className="text-sm text-slate-400 font-normal">/ {historyStudent.targetKm} Km</span></p>
                </div>
                <div className="p-5 flex flex-col items-center justify-center bg-white">
                   <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Tổng thời gian</p>
                   <p className="text-xl font-bold text-orange-500">{historyStudent.currentHours} <span className="text-sm text-slate-400 font-normal">/ {historyStudent.targetHours} h</span></p>
                </div>
                <div className="p-5 flex flex-col items-center justify-center bg-white">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Giờ ban đêm</p>
                    <p className={`text-xl font-bold ${historyStudent.currentNightHours >= historyStudent.targetNightHours ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {historyStudent.currentNightHours} <span className="text-sm text-slate-400 font-normal">/ {historyStudent.targetNightHours} h</span>
                    </p>
                </div>
                <div className="p-5 flex flex-col items-center justify-center bg-white">
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Giờ tự động</p>
                    <p className={`text-xl font-bold ${historyStudent.targetAutomaticHours > 0 && historyStudent.currentAutomaticHours >= historyStudent.targetAutomaticHours ? 'text-green-600' : 'text-slate-700'}`}>
                        {historyStudent.targetAutomaticHours > 0 ? (
                             <>{historyStudent.currentAutomaticHours} <span className="text-sm text-slate-400 font-normal">/ {historyStudent.targetAutomaticHours} h</span></>
                        ) : (
                            <span className="text-sm text-slate-300">Không yêu cầu</span>
                        )}
                    </p>
                </div>
             </div>
          )}

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <div className="p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                <History size={16} className="text-slate-500" />
               </div>
               Chi tiết các phiên chạy
            </h4>
            
            {historyStudent && historyStudent.sessions.length > 0 ? (
                <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Ngày</th>
                                <th className="px-6 py-4 font-semibold">Quãng đường</th>
                                <th className="px-6 py-4 font-semibold">Thời gian</th>
                                <th className="px-6 py-4 font-semibold">Loại hình</th>
                                {!readOnly && <th className="px-6 py-4 text-right font-semibold">Hành động</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[...historyStudent.sessions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(session => {
                                return (
                                    <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                                            {new Date(session.date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-blue-600 font-bold">
                                            {session.distanceKm} Km
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md text-xs font-bold">
                                                {(session.durationMinutes / 60).toFixed(1)} giờ
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex gap-1">
                                                {session.isNight && <Moon size={16} className="text-indigo-500" title="Chạy đêm" />}
                                                {session.isAutomatic && <Zap size={16} className="text-orange-500" title="Xe tự động" />}
                                                {!session.isNight && !session.isAutomatic && <span className="text-xs text-slate-400">Thường</span>}
                                            </div>
                                        </td>
                                        {!readOnly && (
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => onDeleteSession && onDeleteSession(historyStudent.id, session.id)}
                                                    className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Xóa phiên chạy"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <Car size={32} className="mb-2 opacity-20" />
                    <p>Chưa có dữ liệu phiên chạy nào.</p>
                </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl flex justify-end">
             <form method="dialog">
                <button className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
                    Đóng
                </button>
             </form>
          </div>
        </div>
      </dialog>

      {/* AI Analysis Modal */}
      <dialog ref={aiModalRef} id="analysis_modal" className="modal p-0 rounded-2xl shadow-2xl backdrop:bg-slate-900/50 open:animate-fade-in w-11/12 max-w-2xl bg-white relative">
        <div className="p-8">
          <form method="dialog">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">✕</button>
          </form>
          
          <h3 className="font-bold text-xl flex items-center gap-2 mb-4 text-slate-800">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <BrainCircuit size={20} />
            </div>
            Phân tích Tiến độ Học viên
          </h3>
          
          {selectedStudent && (
            <div className="mb-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                 <img 
                    src={selectedStudent.avatarUrl} 
                    alt={selectedStudent.fullName} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-100"
                  />
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{selectedStudent.fullName}</p>
                    <p className="text-sm text-slate-500">Hạng {selectedStudent.licenseClass} • ID: {selectedStudent.id}</p>
                  </div>
              </div>
            </div>
          )}

          <div className="min-h-[150px]">
            {loadingAi ? (
              <div className="flex flex-col items-center justify-center h-full py-10 text-blue-600 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-100 border-t-blue-600"></div>
                <p className="text-sm font-medium animate-pulse text-slate-500">Đang kết nối với Gemini AI...</p>
              </div>
            ) : (
              <div className="prose prose-sm prose-slate max-w-none bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-slate-700">
                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
            <form method="dialog">
               <button className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
                 Đóng
               </button>
            </form>
          </div>
        </div>
      </dialog>

      {/* Add Student Modal */}
      {!readOnly && (
        <dialog ref={addModalRef} className="modal p-0 rounded-2xl shadow-2xl backdrop:bg-slate-900/50 open:animate-fade-in w-11/12 max-w-lg bg-white relative">
            <div className="p-8">
            <form method="dialog">
                <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">✕</button>
            </form>

            <h3 className="font-bold text-xl flex items-center gap-2 mb-6 text-slate-800">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <UserPlus size={20} />
                </div>
                Thêm Học viên Mới
            </h3>

            <form onSubmit={submitAddStudent} className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mã học viên (Tùy chọn)</label>
                <input 
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-400 transition-shadow"
                    placeholder="VD: SV1234 (Để trống sẽ tự sinh mã)"
                    value={newStudentData.id}
                    onChange={e => setNewStudentData({...newStudentData, id: e.target.value})}
                />
                </div>
                
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên</label>
                <input 
                    required
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    placeholder="Nguyễn Văn A"
                    value={newStudentData.fullName}
                    onChange={e => setNewStudentData({...newStudentData, fullName: e.target.value})}
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hạng bằng đào tạo</label>
                <select
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-shadow"
                    value={newStudentData.licenseClass}
                    onChange={e => setNewStudentData({...newStudentData, licenseClass: e.target.value as LicenseClass})}
                >
                    <option value={LicenseClass.B1}>Hạng B tự động</option>
                    <option value={LicenseClass.B2}>Hạng B cơ khí</option>
                    <option value={LicenseClass.C1}>Hạng C1</option>
                </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngày sinh</label>
                    <input 
                    required
                    type="date"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-slate-600"
                    value={newStudentData.dateOfBirth}
                    onChange={e => setNewStudentData({...newStudentData, dateOfBirth: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
                    <input 
                    required
                    type="tel"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    placeholder="0901..."
                    value={newStudentData.phone}
                    onChange={e => setNewStudentData({...newStudentData, phone: e.target.value})}
                    />
                </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button 
                    type="button" 
                    onClick={() => addModalRef.current?.close()}
                    className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                    Hủy
                </button>
                <button 
                    type="submit"
                    className="px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5"
                >
                    Tạo hồ sơ
                </button>
                </div>
            </form>
            </div>
        </dialog>
      )}
      
      {/* Edit Student Modal */}
      {!readOnly && (
        <dialog ref={editModalRef} className="modal p-0 rounded-2xl shadow-2xl backdrop:bg-slate-900/50 open:animate-fade-in w-11/12 max-w-lg bg-white relative">
            <div className="p-8">
            <form method="dialog">
                <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">✕</button>
            </form>

            <h3 className="font-bold text-xl flex items-center gap-2 mb-6 text-slate-800">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Pencil size={20} />
                </div>
                Cập nhật thông tin
            </h3>

            <form onSubmit={submitEditStudent} className="space-y-4">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mã học viên</label>
                <input 
                    type="text"
                    required
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-slate-50 transition-shadow"
                    value={editFormData.id}
                    onChange={e => setEditFormData({...editFormData, id: e.target.value})}
                />
                <p className="text-xs text-orange-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Lưu ý: Đổi mã học viên sẽ cập nhật toàn bộ lịch sử phiên chạy.
                </p>
                </div>
                
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên</label>
                <input 
                    required
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    value={editFormData.fullName}
                    onChange={e => setEditFormData({...editFormData, fullName: e.target.value})}
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hạng bằng đào tạo</label>
                <select
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-shadow"
                    value={editFormData.licenseClass}
                    onChange={e => setEditFormData({...editFormData, licenseClass: e.target.value as LicenseClass})}
                >
                    <option value={LicenseClass.B1}>Hạng B tự động</option>
                    <option value={LicenseClass.B2}>Hạng B cơ khí</option>
                    <option value={LicenseClass.C1}>Hạng C1</option>
                </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Ngày sinh</label>
                    <input 
                    required
                    type="date"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-slate-600"
                    value={editFormData.dateOfBirth}
                    onChange={e => setEditFormData({...editFormData, dateOfBirth: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại</label>
                    <input 
                    required
                    type="tel"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                    value={editFormData.phone}
                    onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                    />
                </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-4">
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
      )}

      {/* Delete Confirmation Modal */}
      {!readOnly && (
        <dialog ref={deleteModalRef} className="modal p-0 rounded-2xl shadow-2xl backdrop:bg-slate-900/50 open:animate-fade-in w-11/12 max-w-md bg-white relative">
            <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertTriangle size={32} />
            </div>
            
            <h3 className="font-bold text-xl text-slate-900 mb-2">Xác nhận xóa học viên</h3>
            
            {studentToDelete && (
                <p className="text-slate-500 mb-6">
                Bạn có chắc chắn muốn xóa hồ sơ của <strong className="text-slate-800">{studentToDelete.fullName}</strong> ({studentToDelete.id})? 
                <br/>Hành động này không thể hoàn tác.
                </p>
            )}

            <div className="flex justify-center gap-3">
                <form method="dialog">
                <button className="px-5 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">
                    Hủy bỏ
                </button>
                </form>
                <button 
                onClick={executeDelete}
                className="px-5 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-all shadow-lg shadow-red-200 hover:shadow-red-300 transform hover:-translate-y-0.5"
                >
                Xóa ngay
                </button>
            </div>
            </div>
        </dialog>
      )}
    </div>
  );
};

export default StudentList;
