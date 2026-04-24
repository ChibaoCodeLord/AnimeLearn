import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client'; // Đảm bảo file này tồn tại hoặc dùng new QueryClient()
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useEffect, useRef } from 'react';

// Page imports
import Home from './pages/Home';
import Home_guest from './pages/Home_guest';
import VideoWorkspace from './pages/VideoWorkspace';
import Vocabulary from './pages/Vocabulary';
import VocabularyNotebook from './pages/VocabularyNotebook';
import QuizPage from './pages/QuizPage';
import Dashboard from './pages/Dashboard';
import AIChatTutor from './pages/AIChatTutor';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Layout from './components/Layout';

// Authentication check function
const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// Mock Component cho trường hợp 404
const PageNotFound = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a1a] text-white">
    <h1 className="text-6xl font-bold mb-4">404</h1>
    <p className="text-gray-400">Trang bạn tìm kiếm không tồn tại.</p>
    <a href="/" className="mt-6 text-[#ff6b9d] hover:underline">Quay lại Trang chủ</a>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  return isAuthenticated() ? element : <Navigate to="/login" replace />;
};

const AuthenticatedApp = () => {
  const sessionStartRef = useRef<number>(0);

  // Track session time
  useEffect(() => {
    // Initialize session start time inside useEffect to avoid impure function call during render
    sessionStartRef.current = Date.now();

    const handleBeforeUnload = () => {
      // Calculate session duration in seconds
      const durationSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      
      // Only track if duration is at least 5 seconds (to avoid accidental page refreshes)
      if (durationSeconds >= 5) {
        const token = localStorage.getItem('token');
        if (token) {
          // Use sendBeacon to ensure data is sent even if page is unloading
          const payload = JSON.stringify({
            durationSeconds,
            page: window.location.pathname
          });
          const blob = new Blob([payload], { type: 'application/json' });

          navigator.sendBeacon(
            'http://localhost:5000/api/auth/track-session',
            blob
          );
        }
      }
    };

    const handlePageVisibilityChange = () => {
      // Send beacon when tab becomes hidden
      if (document.hidden) {
        const durationSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
        
        if (durationSeconds >= 5) {
          const token = localStorage.getItem('token');
          if (token) {
            const payload = JSON.stringify({
              durationSeconds,
              page: window.location.pathname
            });
            const blob = new Blob([payload], { type: 'application/json' });

            navigator.sendBeacon(
              'http://localhost:5000/api/auth/track-session',
              blob
            );
          }
        }
        
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
      <Route path="/" element={<Home_guest />} />

      {/* Login & Signup - Public Routes (không bọc trong Layout) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Authenticated Routes bọc trong Layout (Sidebar + Header) */}
      <Route element={<Layout />}>
        {/* Dashboard */}
        <Route path="/home" element={<ProtectedRoute element={<Home />} />} />
        
        {/* Các trang chức năng */}
        <Route path="/VideoWorkspace" element={<ProtectedRoute element={<VideoWorkspace />} />} />
        <Route path="/Vocabulary" element={<ProtectedRoute element={<Vocabulary />} />} />
        <Route path="/VocabularyNotebook" element={<ProtectedRoute element={<VocabularyNotebook />} />} />
        <Route path="/QuizPage" element={<ProtectedRoute element={<QuizPage />} />} />
        <Route path="/Dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
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
      <Router>
        <AuthenticatedApp />
      </Router>
      {/* Toaster của Sonner để hiển thị thông báo "Đã lưu từ", "Đã xóa"... */}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}

export default App;