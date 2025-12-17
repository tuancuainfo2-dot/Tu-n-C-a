
import React, { useState } from 'react';
import { Student, LicenseClass } from '../types';
import { Save, AlertCircle, Moon, Zap } from 'lucide-react';

interface SessionEntryProps {
  students: Student[];
  onAddSession: (studentId: string, km: number, minutes: number, date: string, isNight: boolean, isAutomatic: boolean) => void;
}

const SessionEntry: React.FC<SessionEntryProps> = ({ students, onAddSession }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [km, setKm] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [isNight, setIsNight] = useState(false);
  const [isAutomatic, setIsAutomatic] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedStudentId || !km || !hours || !date) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    const kmVal = parseFloat(km);
    const hoursVal = parseFloat(hours);

    if (kmVal <= 0 || hoursVal <= 0) {
      setErrorMsg('Giá trị quãng đường và thời gian phải lớn hơn 0.');
      return;
    }

    // Convert hours to minutes for storage consistency
    const minVal = Math.round(hoursVal * 60);

    onAddSession(selectedStudentId, kmVal, minVal, date, isNight, isAutomatic);
    
    setSuccessMsg('Đã lưu phiên chạy thành công!');
    setKm('');
    setHours('');
    setIsNight(false);
    setIsAutomatic(false);
    // Reset success message after 3 seconds
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  
  // Kiểm tra xem có cần hiện tùy chọn xe số tự động không (chỉ B2 và C1)
  const showAutomaticOption = selectedStudent && selectedStudent.licenseClass !== LicenseClass.B1;

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Nhập Phiên Chạy DAT</h1>
        <p className="text-gray-500">Cập nhật thủ công quãng đường và thời gian cho học viên</p>
      </header>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          {successMsg && (
             <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-100 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {successMsg}
             </div>
          )}
          {errorMsg && (
             <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle size={18} />
                {errorMsg}
             </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn Học viên</label>
                <select 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    // Reset automatic checkbox when changing student to avoid invalid state
                    setIsAutomatic(false); 
                  }}
                >
                  <option value="">-- Chọn học viên --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} - Hạng {s.licenseClass} ({s.id})
                    </option>
                  ))}
                </select>
                {selectedStudent && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                      Tổng: {selectedStudent.currentKm}km / {selectedStudent.currentHours}h
                    </span>
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                      Đêm: {selectedStudent.currentNightHours}h
                    </span>
                    {selectedStudent.licenseClass !== LicenseClass.B1 && (
                         <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">
                         Tự động: {selectedStudent.currentAutomaticHours}h
                       </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày chạy</label>
                <input 
                  type="date"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                {/* Empty spacer for layout balance if needed */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quãng đường (Km)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian (Giờ)</label>
                <input 
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                 <div className="flex flex-col sm:flex-row gap-4">
                    <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${isNight ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isNight ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white'}`}>
                            {isNight && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <input type="checkbox" className="hidden" checked={isNight} onChange={() => setIsNight(!isNight)} />
                        <div className="flex items-center gap-2">
                             <Moon size={18} />
                             <span className="font-medium">Chạy ban đêm</span>
                        </div>
                    </label>

                    {showAutomaticOption && (
                        <label className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all flex-1 ${isAutomatic ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAutomatic ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
                                {isAutomatic && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <input type="checkbox" className="hidden" checked={isAutomatic} onChange={() => setIsAutomatic(!isAutomatic)} />
                            <div className="flex items-center gap-2">
                                <Zap size={18} />
                                <span className="font-medium">Xe số tự động</span>
                            </div>
                        </label>
                    )}
                 </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Lưu Phiên Chạy
            </button>
          </form>
        </div>
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 border-t border-gray-100">
          Dữ liệu sẽ được cộng dồn vào tổng thành tích của học viên.
        </div>
      </div>
    </div>
  );
};

export default SessionEntry;
