import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Home, Brain, BarChart3, Shield, MessageCircle,
  Menu, GraduationCap, ChevronRight, Search, Sun, Moon, ChevronDown // ✨ Đã import thêm icon Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import animeLogo from '@/assets/animegirl.jpg';
import UserBannedError from '@/components/UserBannedError';
import MiniVinylPlayer from '@/components/player/MiniVinylPlayer';
import { useTheme } from '@/hooks/useTheme';
import { authApi } from '@/api/auth.api';

const navItems = [
  { path: '/home', label: 'Trang chủ', icon: Home },
  { path: '/Dictionary', label: 'Từ điển', icon: Search },
  { path: '/Vocabulary', label: 'Flashcard', icon: Brain },
  { path: '/Dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/AIChatTutor', label: 'AI Tutor', icon: MessageCircle },
];

interface User {
  id: string;
  email: string;
  fullName: string;
  jlptLevel?: string;
  profilePicture?: string | null;
  bio?: string;
  role?: 'user' | 'admin';
}

interface AuthError {
  status?: number;
  data?: { error?: string; bannedAt?: string; unbannedAt?: string; banReason?: string };
}

const fetchUserProfile = async (): Promise<User> => {
  return authApi.getMe<User>();
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { isDark, toggleTheme } = useTheme();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['current-user'],
    queryFn: fetchUserProfile,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });

  const authError = error as AuthError | undefined;
  const banInfo = authError?.status === 403
    ? authError?.data || { error: 'User is banned' }
    : null;

  useEffect(() => {
    const authError = error as AuthError | undefined;
    if (!authError || authError.status !== 401) return;

    const logout = async () => {
      try {
        await authApi.logout();
      } catch (e) {
        console.error('Logout failed', e);
      } finally {
        localStorage.removeItem('token');
        queryClient.setQueryData(['current-user'], null);
        navigate('/login', { replace: true });
      }
    };

    void logout();
  }, [error, navigate, queryClient]);

  if (banInfo) {
    try {
      sessionStorage.setItem('banInfo', JSON.stringify(banInfo));
    } catch (e) {
      console.error('Cannot persist ban info', e);
    }
    return (
      <UserBannedError
        banReason={banInfo.banReason}
        bannedAt={banInfo.bannedAt}
        unbannedAt={banInfo.unbannedAt}
      />
    );
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginClick = () => {
    window.location.href = '/Login';
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-linear-to-br from-emerald-50 via-teal-50 to-green-50 transition-colors duration-300 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950">
      <header className={`fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-emerald-400 bg-white/80 px-4 backdrop-blur-lg transition-all duration-300 dark:border-emerald-900/70 dark:bg-slate-950/85 sm:px-6 ${sidebarOpen ? 'lg:left-64' : 'lg:left-20'}`}>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex items-center lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-slate-600 dark:text-slate-300">
              <Menu className="w-6 h-6" />
            </Button>
          </div>

          <MiniVinylPlayer className="w-full max-w-[460px]" />
        </div>
        
        <div className="flex shrink-0 items-center gap-3">
          {isLoading ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</div>
          ) : error || !user ? (
            <Button 
              onClick={handleLoginClick} 
              className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
            >
              Đăng nhập
            </Button>
          ) : (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(open => !open)}
                className="flex cursor-pointer items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.fullName?.[0]?.toUpperCase()
                  )}
                </div>
                <span className="hidden text-sm font-medium text-slate-700 dark:text-slate-200 sm:block">{user.fullName}</span>
                <ChevronDown className={`hidden h-4 w-4 text-slate-500 transition-transform dark:text-slate-400 sm:block ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  <Link to="/Profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">Trang cá nhân</Link>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                    aria-pressed={isDark}
                  >
                    <span className="flex items-center gap-2">
                      {isDark ?  <Moon className="h-4 w-4 text-slate-500" />  : <Sun className="h-4 w-4 text-amber-400" /> }
                      {isDark ?  'Chế độ tối' : 'Chế độ sáng'}
                    </span>
                    <span className={`relative h-5 w-9 rounded-full transition-colors ${isDark ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      <span className={`theme-toggle-thumb absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${isDark ? '' : '-translate-x-4'}`} />
                    </span>
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800" />
                  <button
                    onClick={async () => {
                      try {
                        await authApi.logout();
                      } catch (e) {
                        console.error('Logout failed', e);
                      } finally {
                        localStorage.removeItem('token');
                        setMenuOpen(false);
                        queryClient.setQueryData(['current-user'], null);
                        navigate('/login');
                      }
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-slate-50 dark:text-rose-400 dark:hover:bg-slate-800"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <aside className={`fixed left-0 top-0 z-50 flex h-screen shrink-0 flex-col border-r border-emerald-400 bg-white transition-all duration-300 dark:border-emerald-900/70 dark:bg-slate-950 ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <Link to="/home" className={`flex items-center gap-2 overflow-hidden transition-all ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
            <img 
              src={animeLogo} 
              alt="MyAnime Logo" 
              className="w-9 h-9 object-contain border border-emerald-500 rounded-xl shrink-0" 
            />
            <span className="text-lg font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">
              MyAnime
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`hidden text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 lg:flex ${!sidebarOpen && 'mx-auto'}`}
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname.toLowerCase().includes(item.path.toLowerCase());
            return (
              <Link key={item.path} to={item.path}>
                <div className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                  ${active 
                    ? 'bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-md' 
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                  } ${!sidebarOpen && 'justify-center'}`}>
                  <Icon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                  {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                </div>
              </Link>
            );
          })}
          
          {isAdmin && (
            <>
              <div className={`mb-2 mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${!sidebarOpen && 'text-center'}`}>
                {sidebarOpen ? 'Quản trị' : '•••'}
              </div>
              <Link to="/AdminPanel">
                <div className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all
                  ${location.pathname === '/AdminPanel'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                  } ${!sidebarOpen && 'justify-center'}`}>
                  <Shield className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                  {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Admin Panel</span>}
                </div>
              </Link>
            </>
          )}
        </nav>
      </aside>

      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={`relative flex h-full min-w-0 flex-1 flex-col pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        <Outlet />
      </main>

      <footer className="relative z-10 mt-auto w-full shrink-0 border-t border-emerald-100 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-900">My Anime</span>
                </div>
                <p className="text-sm text-slate-600 max-w-xs">Nền tảng Học tiếng Nhật qua Anime với AI.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Tính năng</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="hover:text-emerald-600 cursor-pointer">Script AI tự động</li>
                  <li className="hover:text-emerald-600 cursor-pointer">Phụ đề song ngữ</li>
                  <li className="hover:text-emerald-600 cursor-pointer">Flashcard thông minh</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Hỗ trợ</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="hover:text-emerald-600 cursor-pointer">Hướng dẫn sử dụng</li>
                  <li className="hover:text-emerald-600 cursor-pointer">FAQ</li>
                  <li className="hover:text-emerald-600 cursor-pointer">Liên hệ</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Theo dõi</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="hover:text-emerald-600 cursor-pointer">Facebook</li>
                  <li className="hover:text-emerald-600 cursor-pointer">Twitter</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-emerald-100 text-center text-sm text-slate-500">
              © 2026 My Anime. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}