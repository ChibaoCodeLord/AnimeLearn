import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import MiniVinylPlayer from '@/components/player/MiniVinylPlayer';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/stores/usePlayerStore';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const fetchUserProfile = async (): Promise<UserProfile> => {
  const response = await fetch('http://localhost:5000/api/home/user-profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
};

export default function Navbar() {
  const navigate = useNavigate();
  const clearPlayer = usePlayerStore((store) => store.clearPlayer);
  const { data: user, isLoading, error } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
    staleTime: 10 * 60 * 1000,
  });

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        clearPlayer();
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-emerald-100 bg-emerald-300 text-slate-700 shadow-sm backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          to="/home"
          className="shrink-0 text-xl font-black tracking-tight text-emerald-600"
        >
          My Anime
        </Link>

        <MiniVinylPlayer className="w-full max-w-[500px]" />

        <div className="hidden shrink-0 items-center gap-5 text-sm font-semibold md:flex">
          <Link to="/home" className="transition-colors hover:text-emerald-600">
            Khám phá
          </Link>
          <Link to="/Dashboard" className="transition-colors hover:text-emerald-600">
            Video của tôi
          </Link>
          <Link to="/Vocabulary" className="transition-colors hover:text-emerald-600">
            Từ vựng đã lưu
          </Link>
        </div>

        <div className="ml-auto shrink-0">
          {isLoading ? (
            <span className="text-sm text-slate-500">Đang tải...</span>
          ) : error ? (
            <span className="text-sm font-medium text-slate-500">Guest</span>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/Profile"
                className="flex items-center gap-2 rounded-full bg-emerald-50 py-1 pl-1 pr-3 transition-colors hover:bg-emerald-100"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-semibold text-slate-700 sm:block">
                  {user?.name}
                </span>
              </Link>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="gap-2 rounded-full border-emerald-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
