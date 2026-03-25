import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client'; // Đảm bảo file này tồn tại hoặc dùng new QueryClient()
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Page imports
import Home from './pages/Home';
import VideoWorkspace from './pages/VideoWorkspace';
import Vocabulary from './pages/Vocabulary';
import VocabularyNotebook from './pages/VocabularyNotebook';
import QuizPage from './pages/QuizPage';
import Dashboard from './pages/Dashboard';
import AIChatTutor from './pages/AIChatTutor';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';

// Mock Component cho trường hợp 404
const PageNotFound = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a1a] text-white">
    <h1 className="text-6xl font-bold mb-4">404</h1>
    <p className="text-gray-400">Trang bạn tìm kiếm không tồn tại.</p>
    <a href="/Home" className="mt-6 text-[#ff6b9d] hover:underline">Quay lại Trang chủ</a>
  </div>
);

const AuthenticatedApp = () => {
  // Vì chúng ta đang dùng Mock Data, mình sẽ bỏ qua bước check authError
  // và hiển thị thẳng giao diện chính.
  
  return (
    <Routes>
      {/* Route chính bọc trong Layout (Sidebar + Header) */}
      <Route element={<Layout />}>
        {/* Điều hướng mặc định */}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        
        {/* Các trang chức năng */}
        <Route path="/Home" element={<Home />} />
        <Route path="/VideoWorkspace" element={<VideoWorkspace />} />
        <Route path="/Vocabulary" element={<Vocabulary />} />
        <Route path="/VocabularyNotebook" element={<VocabularyNotebook />} />
        <Route path="/QuizPage" element={<QuizPage />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/AIChatTutor" element={<AIChatTutor />} />
        <Route path="/AdminPanel" element={<AdminPanel />} />
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