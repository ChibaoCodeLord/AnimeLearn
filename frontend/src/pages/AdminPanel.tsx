import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, Users, Video, Flag, Trash2, CheckCircle2, XCircle, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

// --- 1. Định nghĩa kiểu dữ liệu ---
export interface UserItem {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  created_date: string;
}

export interface VideoItem {
  id: string;
  title: string;
  thumbnail_url: string;
  created_by: string;
  created_date: string;
  status: 'approved' | 'rejected' | 'pending';
}

export interface ReportItem {
  id: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_date: string;
  reason: string;
  description?: string;
  reporter_email: string;
}

// --- 2. MOCK DATA ---
const mockUsers: UserItem[] = [
  { id: 'u1', email: 'admin@myanime.com', full_name: 'Thân Ngọc Hậu', role: 'admin', created_date: '2026-01-01T10:00:00Z' },
  { id: 'u2', email: 'user1@test.com', full_name: 'Nguyễn Văn A', role: 'user', created_date: '2026-02-15T08:30:00Z' },
  { id: 'u3', email: 'user2@test.com', full_name: 'Trần Thị B', role: 'user', created_date: '2026-03-01T14:15:00Z' },
];

let mockVideos: VideoItem[] = [
  { id: 'v1', title: 'Học tiếng Nhật qua Jujutsu Kaisen - Phân tích ngữ pháp', thumbnail_url: '', created_by: 'Nguyễn Văn A', created_date: '2026-03-10T14:20:00Z', status: 'pending' },
  { id: 'v2', title: 'Từ vựng N3 - Frieren: Beyond Journey\'s End', thumbnail_url: '', created_by: 'Thân Ngọc Hậu', created_date: '2026-03-12T09:15:00Z', status: 'approved' },
  { id: 'v3', title: 'Test upload video rác', thumbnail_url: '', created_by: 'Trần Thị B', created_date: '2026-03-13T10:00:00Z', status: 'rejected' },
];
const mockReports: ReportItem[] = [
  { id: 'r1', status: 'pending', created_date: '2026-03-13T16:45:00Z', reason: 'Nội dung không phù hợp', description: 'Video chứa hình ảnh nhạy cảm ở phút 2:15', reporter_email: 'admin@myanime.com' },
  { id: 'r2', status: 'resolved', created_date: '2026-03-10T09:00:00Z', reason: 'Sai phụ đề', description: 'Dịch sai nghĩa hoàn toàn đoạn hội thoại đầu.', reporter_email: 'user1@test.com' },
];

// --- 3. MOCK API ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const mockApi = {
  authMe: async () => { await delay(300); return mockUsers[0]; },
  getUsers: async () => { await delay(500); return [...mockUsers]; },
  getVideos: async () => { await delay(500); return [...mockVideos]; },
  getReports: async () => { await delay(500); return [...mockReports]; },
  updateVideo: async (id: string, data: Partial<VideoItem>) => {
    await delay(500);
    const index = mockVideos.findIndex(v => v.id === id);
    if (index !== -1) mockVideos[index] = { ...mockVideos[index], ...data };
    return mockVideos[index];
  },
  deleteVideo: async (id: string) => {
    await delay(500);
    mockVideos = mockVideos.filter(v => v.id !== id);
    return true;
  },
  updateReport: async (id: string, data: Partial<ReportItem>) => {
    await delay(500);
    const index = mockReports.findIndex(r => r.id === id);
    if (index !== -1) mockReports[index] = { ...mockReports[index], ...data };
    return mockReports[index];
  }
};

// --- COMPONENT CHÍNH ---
export default function AdminPanel() {
  const [user, setUser] = useState<UserItem | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    mockApi.authMe().then(setUser).catch(() => {});
  }, []);

  const { data: users = [] } = useQuery<UserItem[]>({ queryKey: ['admin-users'], queryFn: mockApi.getUsers, initialData: [] });
  const { data: videos = [] } = useQuery<VideoItem[]>({ queryKey: ['admin-videos'], queryFn: mockApi.getVideos, initialData: [] });
  const { data: reports = [] } = useQuery<ReportItem[]>({ queryKey: ['admin-reports'], queryFn: mockApi.getReports, initialData: [] });

  const updateVideo = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VideoItem> }) => mockApi.updateVideo(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-videos'] }); toast.success('Đã cập nhật trạng thái video'); },
  });

  const deleteVideo = useMutation({
    mutationFn: (id: string) => mockApi.deleteVideo(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-videos'] }); toast.success('Đã xóa video'); },
  });

  const updateReport = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReportItem> }) => mockApi.updateReport(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-reports'] }); toast.success('Đã cập nhật báo cáo'); },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50">
        <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-rose-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Truy cập bị từ chối</h2>
        <p className="text-slate-500">Khu vực này chỉ dành riêng cho Quản trị viên hệ thống.</p>
        <Button onClick={() => window.history.back()} className="mt-6 bg-slate-900 text-white hover:bg-slate-800">
          Quay lại trang trước
        </Button>
      </div>
    );
  }

  const pendingReports = reports.filter(r => r.status === 'pending');
  const pendingVideos = videos.filter(v => v.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-10 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Control Panel</h1>
            <p className="text-slate-500 font-medium">Quản lý nội dung và người dùng My Anime</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm font-medium text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Hệ thống hoạt động bình thường
        </div>
      </div>

      {/* Quick Stats (Thẻ thống kê hiện đại) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-500" />
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng người dùng</p>
            <p className="text-4xl font-extrabold text-slate-900">{users.length}</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <Users className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-emerald-500" />
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Video chờ duyệt</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold text-slate-900">{pendingVideos.length}</p>
              <p className="text-sm font-medium text-slate-400">/ {videos.length} tổng</p>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <Video className="w-7 h-7 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className={`absolute right-0 top-0 bottom-0 w-2 ${pendingReports.length > 0 ? 'bg-rose-500' : 'bg-slate-300'}`} />
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Báo cáo vi phạm</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-extrabold ${pendingReports.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {pendingReports.length}
              </p>
              <p className="text-sm font-medium text-slate-400">cần xử lý</p>
            </div>
          </div>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${pendingReports.length > 0 ? 'bg-rose-50' : 'bg-slate-100'}`}>
            <Flag className={`w-7 h-7 ${pendingReports.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Tabs defaultValue="videos" className="w-full">
          {/* Menu Tab được làm giống macOS/Vercel */}
          <div className="border-b border-slate-200 px-6 py-3 bg-slate-50/50">
            <TabsList className="bg-slate-200/50 p-1">
              <TabsTrigger value="videos" className="data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md px-6 flex gap-2">
                <Video className="w-4 h-4" /> Quản lý Video
                {pendingVideos.length > 0 && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0 ml-1 h-5 px-1.5">{pendingVideos.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md px-6 flex gap-2">
                <Flag className="w-4 h-4" /> Báo cáo
                {pendingReports.length > 0 && <Badge className="bg-rose-500 text-white hover:bg-rose-600 border-0 ml-1 h-5 px-1.5 animate-pulse">{pendingReports.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md px-6 flex gap-2">
                <Users className="w-4 h-4" /> Người dùng
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Nội dung Tab Video (Bảng dữ liệu) */}
          <TabsContent value="videos" className="m-0 p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                  <tr>
                    <th className="px-6 py-4">Video</th>
                    <th className="px-6 py-4">Người tải lên</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {videos.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 rounded bg-slate-200 flex items-center justify-center text-xs shrink-0 overflow-hidden">
                            {v.thumbnail_url ? <img src={v.thumbnail_url} className="w-full h-full object-cover" /> : '🎬'}
                          </div>
                          <span className="font-semibold text-slate-800 truncate max-w-[200px] md:max-w-xs">{v.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{v.created_by}</td>
                      <td className="px-6 py-4 text-slate-500">{moment(v.created_date).format('DD/MM/YYYY')}</td>
                      <td className="px-6 py-4">
                        {v.status === 'approved' && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0"><CheckCircle2 className="w-3 h-3 mr-1"/> Đã duyệt</Badge>}
                        {v.status === 'pending' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0"><AlertCircle className="w-3 h-3 mr-1"/> Chờ duyệt</Badge>}
                        {v.status === 'rejected' && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0"><XCircle className="w-3 h-3 mr-1"/> Từ chối</Badge>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {v.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => updateVideo.mutate({ id: v.id, data: { status: 'approved' } })} className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                                Duyệt
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateVideo.mutate({ id: v.id, data: { status: 'rejected' } })} className="h-8 border-rose-200 text-rose-600 hover:bg-rose-50">
                                Từ chối
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => deleteVideo.mutate(v.id)} className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Xóa vĩnh viễn">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Nội dung Tab Báo cáo (Dạng thẻ chi tiết) */}
          <TabsContent value="reports" className="m-0 p-6 bg-slate-50/50">
            {reports.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Flag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-lg font-medium text-slate-700">Hệ thống đang sạch sẽ</p>
                <p>Không có báo cáo vi phạm nào cần xử lý.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {reports.map(r => (
                  <div key={r.id} className={`bg-white rounded-xl border p-5 shadow-sm relative ${r.status === 'pending' ? 'border-rose-200' : 'border-slate-200'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <Badge className={`border-0 ${r.status === 'pending' ? 'bg-rose-500 text-white hover:bg-rose-600' : r.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-100'}`}>
                        {r.status === 'pending' ? 'CẦN XỬ LÝ' : r.status === 'resolved' ? 'ĐÃ GIẢI QUYẾT' : 'ĐÃ BỎ QUA'}
                      </Badge>
                      <span className="text-xs font-medium text-slate-400">{moment(r.created_date).fromNow()}</span>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-bold text-slate-900 mb-1">{r.reason}</h4>
                      {r.description && <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{r.description}</p>}
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Người báo cáo: <span className="font-medium text-slate-700">{r.reporter_email}</span>
                      </div>
                      
                      {r.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateReport.mutate({ id: r.id, data: { status: 'resolved' } })} className="h-8 bg-slate-900 text-white hover:bg-slate-800">
                            Xác nhận xử lý
                          </Button>
                          <Button size="sm" onClick={() => updateReport.mutate({ id: r.id, data: { status: 'dismissed' } })} variant="ghost" className="h-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100">
                            Bỏ qua
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Nội dung Tab User */}
          <TabsContent value="users" className="m-0 p-0">
            <div className="p-4 border-b border-slate-100 flex justify-end">
               <div className="relative w-full md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input type="text" placeholder="Tìm kiếm người dùng..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
               </div>
            </div>
            <div className="divide-y divide-slate-100">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white shadow-xs">
                      {u.full_name?.[0] || u.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{u.full_name || 'Người dùng ẩn danh'}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-slate-400 font-medium uppercase">Ngày tham gia</p>
                      <p className="text-sm font-medium text-slate-700">{moment(u.created_date).format('DD/MM/YYYY')}</p>
                    </div>
                    <Badge className={`border-0 w-20 justify-center ${u.role === 'admin' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {u.role === 'admin' ? 'Quản trị' : 'Học viên'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}