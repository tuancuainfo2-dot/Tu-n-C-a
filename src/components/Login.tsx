import React, { useState } from 'react';
import { Lock, User, UserPlus, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

// Key used to store registered users in localStorage
const USERS_STORAGE_KEY = 'dat_system_users_db';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // UI States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setFullName('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      if (isRegistering) {
        handleRegister();
      } else {
        handleLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    if (!username || !password || !fullName) {
      throw new Error('Vui lòng điền đầy đủ thông tin.');
    }

    if (username.length < 3) {
      throw new Error('Tên đăng nhập phải có ít nhất 3 ký tự.');
    }

    const existingUsersStr = localStorage.getItem(USERS_STORAGE_KEY);
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];

    // Check if username exists
    if (existingUsers.some((u: any) => u.username === username) || username === 'admin') {
      throw new Error('Tên đăng nhập đã tồn tại.');
    }

    // Create new user
    const newUser = {
      username,
      password, // In a real app, never store plain text passwords!
      profile: {
        id: `user_${Date.now()}`,
        name: fullName,
        email: `${username}@dat-system.com`, // Auto-generate fake email
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff`
      }
    };

    // Save to storage
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...existingUsers, newUser]));
    
    setSuccess('Đăng ký thành công! Đang đăng nhập...');
    
    // Auto login after short delay
    setTimeout(() => {
       onLogin(newUser.profile);
    }, 800);
  };

  const handleLogin = () => {
    // 1. Check Hardcoded Admin (Legacy support)
    if (username === 'admin' && password === '123456') {
      onLogin({
        id: 'admin-default',
        name: 'Quản trị viên',
        email: 'admin@dat-system.com',
        avatar: 'https://ui-avatars.com/api/?name=Admin&background=334155&color=fff'
      });
      return;
    }

    // 2. Check Registered Users from LocalStorage
    const existingUsersStr = localStorage.getItem(USERS_STORAGE_KEY);
    const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];
    
    const foundUser = existingUsers.find((u: any) => u.username === username && u.password === password);

    if (foundUser) {
      onLogin(foundUser.profile);
    } else {
      throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-slate-900 overflow-hidden z-0">
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"></div>
         <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
         <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 relative z-10 backdrop-blur-sm">
        {/* Decorative header background */}
        <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-300 ${isRegistering ? 'bg-gradient-to-r from-green-400 to-emerald-600' : 'bg-gradient-to-r from-blue-400 to-indigo-600'}`}></div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
              <div className="relative">
                   <div className={`absolute inset-0 rounded-full blur-lg opacity-20 animate-pulse ${isRegistering ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                   <img 
                      src="https://img.icons8.com/fluency/96/steering-wheel.png" 
                      alt="App Logo" 
                      className="w-28 h-28 relative z-10 rounded-full bg-white object-cover shadow-xl border-4 border-white"
                  />
              </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">DAT Tracker Pro</h1>
          <p className="text-slate-500 text-sm mt-2">
            {isRegistering ? 'Tạo tài khoản quản lý mới' : 'Đăng nhập vào hệ thống quản lý'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center flex items-center justify-center gap-2 animate-pulse">
            <span className="font-semibold">⚠ {error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm rounded-xl border border-green-100 text-center flex items-center justify-center gap-2">
            <span className="font-semibold">✓ {success}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {isRegistering && (
            <div className="animate-fade-in">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Họ và tên</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required={isRegistering}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder-slate-400"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tên đăng nhập</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <User size={20} />
              </div>
              <input
                type="text"
                required
                className={`w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 outline-none transition-all placeholder-slate-400 ${isRegistering ? 'focus:ring-green-500' : 'focus:ring-blue-500'}`}
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                required
                className={`w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 outline-none transition-all placeholder-slate-400 ${isRegistering ? 'focus:ring-green-500' : 'focus:ring-blue-500'}`}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6 transform hover:-translate-y-0.5
              ${isRegistering ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-200' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'}
              ${isLoading ? 'opacity-80 cursor-not-allowed transform-none' : ''}`}
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <>
                  {isRegistering ? 'Đăng ký Tài khoản' : 'Đăng nhập'}
                  {!isRegistering && <ArrowRight size={20} />}
                </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <button 
              onClick={toggleMode}
              className={`ml-2 font-bold hover:underline focus:outline-none transition-colors ${isRegistering ? 'text-blue-600 hover:text-blue-700' : 'text-green-600 hover:text-green-700'}`}
            >
              {isRegistering ? 'Đăng nhập ngay' : 'Tạo tài khoản mới'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
