import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, BookOpen, Brain, BarChart3, Shield, MessageCircle, Menu, GraduationCap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import animeLogo from '@/assets/animegirl.jpg';

const navItems = [
  { path: '/home', label: 'Trang chủ', icon: Home },
  { path: '/Vocabulary', label: 'Flashcard', icon: Brain },
  { path: '/VocabularyNotebook', label: 'Sổ tay từ vựng', icon: BookOpen },
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

// Fetch user profile from backend
const fetchUserProfile = async (): Promise<User> => {
  const response = await fetch('http://localhost:5000/api/auth/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: send cookies
  });

  // if (!response.ok) {
  //   throw new Error("Failed to fetch user:", ${response.status}),
  // };

  return response.json();
};

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['current-user'],
    queryFn: fetchUserProfile,
    staleTime: 10 * 60 * 1000,
    retry: 2, // Retry 2 times
  });

  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug log
  console.log('User data:', { user, isLoading, error });

  const handleLoginClick = () => {
    window.location.href = '/Login';
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col min-h-screen w-full bg-linear-to-br from-emerald-50 via-teal-50 to-green-50 overflow-x-hidden">
      
      {/* Top Header */}
      <header className="fixed top-0 right-0 left-0 h-16 bg-white/80 backdrop-blur-lg border-b border-emerald-100 z-40 flex items-center justify-between px-6">
        <div className="flex items-center lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 ml-auto">
          {isLoading ? (
            <div className="text-sm text-slate-500">Đang tải...</div>
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
                className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {user.fullName?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.fullName}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-md shadow-lg z-50">
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Trang cá nhân</Link>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('http://localhost:5000/api/auth/logout', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                        });

                        // clear local token and navigate to login regardless of response
                        localStorage.removeItem('token');
                        setMenuOpen(false);
                        navigate('/login');
                      } catch (e) {
                        console.error('Logout failed', e);
                        localStorage.removeItem('token');
                        setMenuOpen(false);
                        navigate('/login');
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-slate-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Left Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-emerald-100 transition-all duration-300 flex flex-col shrink-0 ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
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
            className={`hidden lg:flex text-slate-400 hover:text-emerald-600 ${!sidebarOpen && 'mx-auto'}`}
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                  ${active 
                    ? 'bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-md' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50'
                  } ${!sidebarOpen && 'justify-center'}`}>
                  <Icon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                  {sidebarOpen && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                </div>
              </Link>
            );
          })}
          
          {isAdmin && (
            <>
              <div className={`mt-4 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider ${!sidebarOpen && 'text-center'}`}>
                {sidebarOpen ? 'Quản trị' : '•••'}
              </div>
              <Link to="/AdminPanel">
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                  ${location.pathname === '/AdminPanel'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-emerald-50'
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

      <main className={`flex-1 min-w-0 flex flex-col w-full h-full relative pt-16 transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        <Outlet />
      </main>

      {/* 3. FOOTER: w-full giúp nó full màn hình, thẻ div bên trong lùi lề để chữ không bị Sidebar đè */}
      <footer className="w-full bg-white border-t border-emerald-100 mt-auto shrink-0 z-10 relative">
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
                <p className="text-sm text-slate-600 max-w-xs">Học tiếng Nhật qua Anime với AI.</p>
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