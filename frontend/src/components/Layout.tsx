import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Brain, BarChart3, Shield, MessageCircle, Menu, X, GraduationCap, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import animeLogo from '@/assets/animegirl.jpg';

const navItems = [
  { path: '/home', label: 'Trang chủ', icon: Home },
  { path: '/Vocabulary', label: 'Flashcard', icon: Brain }  ,
  { path: '/VocabularyNotebook', label: 'Sổ tay từ vựng', icon: BookOpen },
  { path: '/Dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/AIChatTutor', label: 'AI Tutor', icon: MessageCircle },
];

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
}

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('my_anime_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      const mockUser: User = {
        id: 'u123',
        email: 'it.engineer@japan.com',
        full_name: 'Ngọc Hậu',
        role: 'admin'
      };
      setUser(mockUser);
    }
  }, []);

  const handleLoginClick = () => {
    alert('Chuyển hướng đến trang Đăng nhập...');
  };

  const isAdmin = user?.role === 'admin';

  return (
    // 1. ROOT: Sửa thành flex-col, min-h-screen và overflow-x-hidden để tránh lỗi cuộn ngang
    <div className="flex flex-col min-h-screen w-full bg-linear-to-br from-emerald-50 via-teal-50 to-green-50 overflow-x-hidden">
      
      {/* Top Header - Đã đẩy nút Menu Mobile sang trái cho hợp lý */}
      <header className="fixed top-0 right-0 left-0 h-16 bg-white/80 backdrop-blur-lg border-b border-emerald-100 z-40 flex items-center justify-between px-6">
        <div className="flex items-center lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 ml-auto">
          {user ? (
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.full_name || user.email}</span>
            </div>
          ) : (
            <Button 
              onClick={handleLoginClick} 
              className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
            >
              Đăng nhập
            </Button>
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

      {/* 2. MAIN CONTENT: Thêm lg:pl-64 và pt-16 để nội dung tự lùi lại nhường chỗ cho Sidebar và Header */}
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