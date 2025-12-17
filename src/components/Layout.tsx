import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Users, PlusCircle, Bell, AlertCircle, LogOut, Menu } from 'lucide-react';
import { Notification, UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'students' | 'session';
  setActiveTab: (tab: 'dashboard' | 'students' | 'session') => void;
  notifications?: Notification[];
  onLogout: () => void;
  user?: UserProfile;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, notifications = [], onLogout, user }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row h-screen overflow-hidden font-sans text-slate-800">
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <nav className="bg-slate-900 text-slate-300 w-full md:w-72 flex-shrink-0 md:h-screen sticky top-0 md:left-0 z-50 flex flex-col shadow-xl">
        <div className="p-6 flex items-center gap-3 font-bold text-xl text-white border-b border-slate-800/50 bg-slate-900">
          <img 
            src="https://img.icons8.com/fluency/96/steering-wheel.png" 
            alt="App Logo" 
            className="w-11 h-11 rounded-full bg-white object-cover border-2 border-slate-700 shadow-md"
          />
          <span className="tracking-tight">DAT Tracker <span className="text-blue-500">Pro</span></span>
        </div>
        
        <div className="flex md:flex-col overflow-x-auto md:overflow-visible w-full p-4 gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left whitespace-nowrap group ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
            <span className="hidden md:inline font-medium">Tổng quan</span>
            <span className="md:hidden">Tổng quan</span>
          </button>
          
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left whitespace-nowrap group ${
              activeTab === 'students' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={20} className={activeTab === 'students' ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
            <span className="hidden md:inline font-medium">Danh sách Học viên</span>
            <span className="md:hidden">Học viên</span>
          </button>

          <button
            onClick={() => setActiveTab('session')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 w-full text-left whitespace-nowrap group ${
              activeTab === 'session' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PlusCircle size={20} className={activeTab === 'session' ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
            <span className="hidden md:inline font-medium">Nhập phiên chạy</span>
            <span className="md:hidden">Nhập liệu</span>
          </button>
        </div>
        
        <div className="hidden md:block p-4 mt-auto">
          {user && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-slate-600" />
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
            </div>
          )}
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 w-full transition-colors font-medium p-3 hover:bg-slate-800 rounded-xl"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between md:justify-end items-center shadow-sm z-20 shrink-0 sticky top-0">
            <div className="md:hidden font-bold text-slate-700 flex items-center gap-2">
               {activeTab === 'dashboard' ? 'Tổng quan' : activeTab === 'students' ? 'Học viên' : 'Nhập liệu'}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative" ref={notificationRef}>
                    <button 
                    onClick={() => setShowNotifications(!showNotifications)} 
                    className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100 active:scale-95"
                    >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                    )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in origin-top-right ring-1 ring-black/5">
                            <div className="p-4 border-b border-slate-50 font-semibold text-slate-700 flex justify-between items-center bg-slate-50/80">
                                <span>Thông báo</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">{unreadCount} mới</span>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                {unreadCount === 0 ? (
                                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                        <Bell size={40} className="mb-3 opacity-20" />
                                        <p className="text-sm">Không có thông báo mới</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${n.type === 'error' ? 'bg-red-50/50' : n.type === 'warning' ? 'bg-orange-50/50' : ''}`}>
                                            <div className="flex gap-3">
                                            <div className={`mt-0.5 shrink-0 ${n.type === 'error' ? 'text-red-500' : n.type === 'warning' ? 'text-orange-500' : 'text-blue-500'}`}>
                                                <AlertCircle size={18} />
                                            </div>
                                            <div>
                                                <p className={`text-sm ${n.type === 'error' ? 'text-red-800 font-medium' : n.type === 'warning' ? 'text-slate-800 font-medium' : 'text-slate-700'}`}>{n.message}</p>
                                                {n.date && <p className="text-xs text-slate-400 mt-1">{n.date}</p>}
                                            </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile User Info & Logout */}
                {user && (
                    <div className="md:hidden">
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200" />
                    </div>
                )}
                
                <button 
                    onClick={onLogout}
                    className="md:hidden p-2 text-slate-500 hover:bg-red-50 rounded-full hover:text-red-600 transition-colors"
                    title="Đăng xuất"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
            <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
            </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
