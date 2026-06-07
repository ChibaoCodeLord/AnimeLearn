import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client'; // Đảm bảo file này tồn tại hoặc dùng new QueryClient()
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect, useRef, useState } from 'react';
import GlobalAudioPlayer from '@/components/player/GlobalAudioPlayer';
import { PlayerStoreProvider } from '@/stores/usePlayerStore';

// Page imports
import Home from './pages/Home';
import Home_guest from './pages/Home_guest';
import VideoWorkspace from './pages/VideoWorkspace';
import Vocabulary from './pages/Vocabulary';
// import VocabularyNotebook from './pages/VocabularyNotebook';
import QuizPage from './pages/QuizPage';
import Dashboard from './pages/Dashboard';
import WatchHistory from './pages/WatchHistory';
import AIChatTutor from './pages/AIChatTutor';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Layout from './components/Layout';
import DictionaryPage from './pages/DictionaryPage';
import UserBannedError from './components/UserBannedError';
import { authApi } from '@/api/auth.api';
import type { AuthUser } from '@/api/types';

const CURRENT_USER_QUERY_KEY = ['current-user'] as const;

interface AuthRouteError {
  status?: number;
  data?: {
    error?: string;
    bannedAt?: string;
    unbannedAt?: string;
    banReason?: string;
  };
}

const fetchCurrentUser = () => authApi.getMe<AuthUser>();

const rememberBanInfo = (data?: AuthRouteError['data']) => {
  if (data?.error !== 'User is banned') return;

  try {
    sessionStorage.setItem('banInfo', JSON.stringify(data));
  } catch (error) {
    console.error('Cannot persist ban info', error);
  }
};

const AuthLoadingScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500">
    Đang kiểm tra đăng nhập...
  </div>
);

const useCurrentUser = () =>
  useQuery<AuthUser>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

// Mock Component cho trường hợp 404
const PageNotFound = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a1a] text-white">
    <h1 className="text-6xl font-bold mb-4">404</h1>
    <p className="text-gray-400">Trang bạn tìm kiếm không tồn tại.</p>
    <a href="/" className="mt-6 text-[#ff6b9d] hover:underline">Quay lại Trang chủ</a>
  </div>
);

const BannedRoute = () => {
  const [banInfo, setBanInfo] = useState<{ bannedAt?: string; unbannedAt?: string; banReason?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('banInfo');
      if (raw) {
        setBanInfo(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Cannot read ban info', e);
    }
  }, []);

  return (
    <UserBannedError
      banReason={banInfo?.banReason}
      bannedAt={banInfo?.bannedAt}
      unbannedAt={banInfo?.unbannedAt}
    />
  );
};

const GuestLandingRoute = () => {
  const { data: user, isLoading, isFetching, error } = useCurrentUser();
  const authError = error as AuthRouteError | undefined;

  if (user) return <Navigate to="/home" replace />;
  if (authError?.status === 403) {
    rememberBanInfo(authError.data);
    return <Navigate to="/banned" replace />;
  }
  if (isLoading || isFetching) return <AuthLoadingScreen />;

  return <Home_guest />;
};

const GuestOnlyRoute = ({ element }: { element: React.ReactNode }) => {
  const { data: user, isLoading, isFetching, error } = useCurrentUser();
  const authError = error as AuthRouteError | undefined;

  if (user) return <Navigate to="/home" replace />;
  if (authError?.status === 403) {
    rememberBanInfo(authError.data);
    return <Navigate to="/banned" replace />;
  }
  if (isLoading || isFetching) return <AuthLoadingScreen />;

  return element;
};

// Protected Route Component
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const { data: user, isLoading, isFetching, error } = useCurrentUser();
  const authError = error as AuthRouteError | undefined;

  if (user) return element;
  if (authError?.status === 403) {
    rememberBanInfo(authError.data);
    return <Navigate to="/banned" replace />;
  }
  if (isLoading || isFetching) return <AuthLoadingScreen />;

  localStorage.removeItem('token');
  return <Navigate to="/login" replace />;
};

const AuthenticatedApp = () => {
  const sessionStartRef = useRef<number>(0);

  // Track session time
  useEffect(() => {
    // Initialize session start time inside useEffect to avoid impure function call during render
    sessionStartRef.current = Date.now();

    const trackCurrentSession = () => {
      const durationSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      if (durationSeconds < 5 || !localStorage.getItem('token')) return;

      authApi.trackSessionBeacon({
        durationSeconds,
        page: window.location.pathname,
      });
    };

    const handleBeforeUnload = () => {
      trackCurrentSession();
    };

    const handlePageVisibilityChange = () => {
      // Send beacon when tab becomes hidden
      if (document.hidden) {
        trackCurrentSession();
        
        // Reset session start when tab becomes visible again
      } else {
        sessionStartRef.current = Date.now();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handlePageVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handlePageVisibilityChange);
    };
  }, []);

  return (
    <Routes>
      {/* Landing Page - Public */}
      <Route path="/" element={<GuestLandingRoute />} />

      {/* Login & Signup - Public Routes (không bọc trong Layout) */}
      <Route path="/login" element={<GuestOnlyRoute element={<Login />} />} />
      <Route path="/signup" element={<GuestOnlyRoute element={<Signup />} />} />
      <Route path="/banned" element={<BannedRoute />} />

      {/* Authenticated Routes bọc trong Layout (Sidebar + Header) */}
      <Route element={<Layout />}>
        {/* Dashboard */}
        <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
        
        {/* Các trang chức năng */}
        <Route path="/VideoWorkspace" element={<ProtectedRoute element={<VideoWorkspace />} />} />
        <Route path="/Vocabulary" element={<ProtectedRoute element={<Vocabulary />} />} />
        <Route path="/QuizPage" element={<ProtectedRoute element={<QuizPage />} />} />
        <Route path="/Dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/WatchHistory" element={<ProtectedRoute element={<WatchHistory />} />} />
        <Route path="/Dictionary" element={<ProtectedRoute element={<DictionaryPage />} />} />
        <Route path="/AIChatTutor" element={<ProtectedRoute element={<AIChatTutor />} />} />
        <Route path="/Profile" element={<ProtectedRoute element={<Profile />} />} />
        <Route path="/AdminPanel" element={<ProtectedRoute element={<AdminPanel />} />} />
      </Route>

      {/* Trang lỗi 404 */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    // QueryClientProvider là bắt buộc vì bạn dùng useQuery ở hầu hết các trang
    <QueryClientProvider client={queryClientInstance}>
      <PlayerStoreProvider>
        <Router>
          <AuthenticatedApp />
          <GlobalAudioPlayer />
        </Router>
        {/* Toaster của Sonner để hiển thị thông báo "Đã lưu từ", "Đã xóa"... */}
        <Toaster position="top-right" richColors closeButton />
      </PlayerStoreProvider>
    </QueryClientProvider>
  );
}

export default App;
