import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield, Users, Video, Trash2, Search, Eye, RefreshCw,
  ChevronLeft, ChevronRight, Film, BookOpen,
  ExternalLink, UserCog, Crown, AlertTriangle,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

// ─── Kiểu dữ liệu ─────────────────────────────────────────────────────────────

interface CreatorInfo {
  id: string | null;
  fullName: string;
  email: string;
}

type VideoStatus = 'approved' | 'rejected' | 'pending';

interface VideoItem {
  id: string;
  title: string;
  youtube_url: string;
  thumbnail_url: string;
  jlpt_level: string;
  status: VideoStatus;
  views_count: number;
  likes_count: number;
  created_date: string;
  script_length: number;
  creator: CreatorInfo;
}

interface VideosResponse {
  videos: VideoItem[];
  total: number;
  page: number;
  totalPages: number;
}

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user';
  jlptLevel: string;
  createdAt: string;
  isVerified: boolean;
}

interface StatsData {
  totalVideos: number;
  totalUsers: number;
  totalAdmins: number;
}

// ─── API ───────────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000/api';

const apiFetch = async (path: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
    throw new Error(err.error || 'Lỗi API');
  }
  return res.json();
};

// ─── Cấu hình trạng thái ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<VideoStatus, {
  label: string;
  icon: React.ReactNode;
  badgeCls: string;
  barCls: string;
}> = {
  approved: {
    label: 'Đã duyệt',
    icon: <CheckCircle2 className="w-3 h-3" />,
    badgeCls: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    barCls: 'bg-emerald-500',
  },
  pending: {
    label: 'Chờ duyệt',
    icon: <Clock className="w-3 h-3" />,
    badgeCls: 'bg-amber-100 text-amber-700 border-amber-200',
    barCls: 'bg-amber-400',
  },
  rejected: {
    label: 'Từ chối',
    icon: <XCircle className="w-3 h-3" />,
    badgeCls: 'bg-rose-100 text-rose-700 border-rose-200',
    barCls: 'bg-rose-500',
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Badge inline trạng thái (dùng trong cột bảng) */
function StatusBadge({ status }: { status: VideoStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badgeCls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/** Thumbnail video với bar trạng thái ở đáy */
function VideoThumbnail({ url, title, status }: { url: string; title: string; status: VideoStatus }) {
  const [err, setErr] = useState(false);
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="relative w-20 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
      {!err && url ? (
        <img src={url} alt={title} className="w-full h-full object-cover" onError={() => setErr(true)} />
      ) : (
        <Film className="w-4 h-4 text-slate-400" />
      )}
      {/* Bar màu trạng thái ở đáy thumbnail */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${cfg.barCls}`} />
    </div>
  );
}

/** Thẻ thống kê — đồng bộ với Dashboard */
function StatCard({
  icon: Icon, label, value, colorClass, bgClass, isLoading,
}: {
  icon: React.ElementType; label: string; value: number | string;
  colorClass: string; bgClass: string; isLoading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 left-0 right-0 h-1 ${bgClass} opacity-50 group-hover:opacity-100 transition-opacity`} />
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-20 bg-slate-100 mb-1" />
      ) : (
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      )}
      <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
    </div>
  );
}

/** Modal xác nhận xóa */
function DeleteConfirmModal({
  video, onConfirm, onCancel, isDeleting,
}: {
  video: VideoItem | null; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  if (!video) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa video</h3>
            <p className="text-sm text-slate-500">Hành động này không thể hoàn tác</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 mb-5 border border-slate-100">
          <p className="text-sm text-slate-800 font-medium line-clamp-2">{video.title}</p>
          <p className="text-xs text-slate-500 mt-1">Tạo bởi: {video.creator.fullName}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting} className="flex-1">
            Hủy bỏ
          </Button>
          <Button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-0">
            {isDeleting ? 'Đang xóa...' : 'Xóa video'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT CHÍNH ──────────────────────────────────────────────────────────

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Video filters
  const [videoSearch, setVideoSearch] = useState('');
  const [videoSearchDebounced, setVideoSearchDebounced] = useState('');
  const [jlptFilter, setJlptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<VideoItem | null>(null);

  // User search
  const [userSearch, setUserSearch] = useState('');
  const [userSearchDebounced, setUserSearchDebounced] = useState('');

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => { setVideoSearchDebounced(videoSearch); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [videoSearch]);

  useEffect(() => {
    const t = setTimeout(() => setUserSearchDebounced(userSearch), 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  // Lấy user hiện tại
  useEffect(() => {
    apiFetch('/auth/me')
      .then(u => setCurrentUser(u))
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoadingAuth(false));
  }, []);

  // ── Queries ───────────────────────────────────────────────────────────────

  const statsQuery = useQuery<StatsData>({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch('/admin/stats'),
    enabled: currentUser?.role === 'admin',
  });

  const videosQuery = useQuery<VideosResponse>({
    queryKey: ['admin-videos', videoSearchDebounced, jlptFilter, statusFilter, page],
    queryFn: () => apiFetch(
      `/admin/videos?search=${encodeURIComponent(videoSearchDebounced)}&jlpt=${jlptFilter}&status=${statusFilter}&page=${page}&limit=15`
    ),
    enabled: currentUser?.role === 'admin',
  });

  const usersQuery = useQuery<UserItem[]>({
    queryKey: ['admin-users', userSearchDebounced],
    queryFn: () => apiFetch(`/admin/users?search=${encodeURIComponent(userSearchDebounced)}`),
    enabled: currentUser?.role === 'admin',
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const deleteVideoMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/videos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Đã xóa video thành công');
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(`Lỗi: ${e.message}`),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VideoStatus }) =>
      apiFetch(`/admin/videos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      toast.success(`Đã cập nhật: ${STATUS_CONFIG[variables.status].label}`);
    },
    onError: (e: Error) => toast.error(`Lỗi: ${e.message}`),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiFetch(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Đã cập nhật quyền người dùng');
    },
    onError: (e: Error) => toast.error(`Lỗi: ${e.message}`),
  });

  // ── Render: Loading / Unauthorized ────────────────────────────────────────

  if (isLoadingAuth) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Skeleton className="h-10 w-60 bg-slate-100 mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-rose-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Truy cập bị từ chối</h2>
        <p className="text-slate-500">Khu vực này chỉ dành riêng cho Quản trị viên hệ thống.</p>
        <Button onClick={() => window.history.back()} className="mt-6 bg-slate-900 hover:bg-slate-800 text-white">
          Quay lại trang trước
        </Button>
      </div>
    );
  }

  const stats = statsQuery.data;
  const videos = videosQuery.data?.videos ?? [];
  const videosTotal = videosQuery.data?.total ?? 0;
  const totalPages = videosQuery.data?.totalPages ?? 1;
  const users = usersQuery.data ?? [];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <DeleteConfirmModal
        video={deleteTarget}
        onConfirm={() => deleteTarget && deleteVideoMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={deleteVideoMutation.isPending}
      />

      <div className="w-full px-4 md:px-6 py-6 animate-in fade-in duration-500">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Control Panel</h1>
              <p className="text-slate-500 font-medium">Quản lý nội dung và người dùng AnimeLearn</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm text-sm font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Hệ thống hoạt động bình thường
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <StatCard
            icon={Video} label="Tổng video" value={stats?.totalVideos ?? '—'}
            colorClass="text-blue-600" bgClass="bg-blue-100"
            isLoading={statsQuery.isLoading}
          />
          <StatCard
            icon={Users} label="Người dùng" value={stats?.totalUsers ?? '—'}
            colorClass="text-emerald-600" bgClass="bg-emerald-100"
            isLoading={statsQuery.isLoading}
          />
          <StatCard
            icon={Crown} label="Quản trị viên" value={stats?.totalAdmins ?? '—'}
            colorClass="text-amber-600" bgClass="bg-amber-100"
            isLoading={statsQuery.isLoading}
          />
        </div>

        {/* ── Main Content ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <Tabs defaultValue="videos" className="w-full">

            {/* Tab List */}
            <div className="border-b border-slate-200 px-6 py-3 bg-slate-50/50">
              <TabsList className="bg-slate-200/50 p-1">
                <TabsTrigger value="videos"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md px-6 flex gap-2 text-sm">
                  <Video className="w-4 h-4" /> Quản lý Video
                </TabsTrigger>
                <TabsTrigger value="users"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md px-6 flex gap-2 text-sm">
                  <Users className="w-4 h-4" /> Người dùng
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ═══ TAB: VIDEO ═══ */}
            <TabsContent value="videos" className="m-0 p-0">

              {/* Toolbar */}
              <div className="flex flex-wrap gap-2 p-3 border-b border-slate-100">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={videoSearch}
                    onChange={e => setVideoSearch(e.target.value)}
                    placeholder="Tìm theo tên video..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm
                      text-slate-900 placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
                  />
                </div>

                {/* Filter trạng thái */}
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                  className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700
                    focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">⏳ Chờ duyệt</option>
                  <option value="approved">✅ Đã duyệt</option>
                  <option value="rejected">❌ Từ chối</option>
                </select>

                {/* Filter JLPT */}
                <select
                  value={jlptFilter}
                  onChange={e => { setJlptFilter(e.target.value); setPage(1); }}
                  className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700
                    focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  <option value="all">Tất cả cấp độ</option>
                  {['N1', 'N2', 'N3', 'N4', 'N5', 'Unknown'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>

                <Button
                  variant="outline" size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-videos'] })}
                  className="shrink-0 px-3"
                  title="Làm mới"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Tổng số */}
              <div className="px-5 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                {videosQuery.isLoading ? 'Đang tải...' : `${videosTotal} video`}
              </div>

              {/* Bảng video — scroll ngang nếu quá rộng */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-xs">
                    <tr>
                      <th className="px-4 py-3">Video</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Trạng thái</th>
                      <th className="px-4 py-3 hidden md:table-cell">Người tạo</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Cấp độ</th>
                      <th className="px-4 py-3 hidden xl:table-cell">Lượt xem</th>
                      <th className="px-4 py-3 hidden xl:table-cell">Script</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Ngày tạo</th>
                      <th className="px-4 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {videosQuery.isLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={8} className="px-4 py-3">
                            <Skeleton className="h-8 w-full bg-slate-100 rounded-lg" />
                          </td>
                        </tr>
                      ))
                    ) : videos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400">
                          <Film className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                          <p className="font-medium text-slate-500">Không tìm thấy video nào</p>
                        </td>
                      </tr>
                    ) : (
                      videos.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">

                          {/* Cột Video */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <VideoThumbnail url={v.thumbnail_url} title={v.title} status={v.status} />
                              <span className="font-semibold text-slate-800 truncate max-w-[120px] lg:max-w-[200px]">
                                {v.title}
                              </span>
                            </div>
                          </td>

                          {/* Cột Trạng thái */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <StatusBadge status={v.status} />
                          </td>

                          {/* Cột Người tạo */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="font-medium text-slate-800 text-sm truncate max-w-[120px]">{v.creator.fullName}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[120px]">{v.creator.email}</p>
                          </td>

                          {/* Cột Cấp độ */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <Badge variant="outline" className="font-semibold text-slate-600 text-xs">
                              {v.jlpt_level || 'Unknown'}
                            </Badge>
                          </td>

                          {/* Cột Lượt xem */}
                          <td className="px-4 py-3 hidden xl:table-cell text-slate-600">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              {v.views_count.toLocaleString()}
                            </span>
                          </td>

                          {/* Cột Script */}
                          <td className="px-4 py-3 hidden xl:table-cell text-slate-600">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                              {v.script_length} câu
                            </span>
                          </td>

                          {/* Cột Ngày tạo */}
                          <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs">
                            {moment(v.created_date).format('DD/MM/YYYY')}
                          </td>

                          {/* Cột Hành động */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Duyệt */}
                              {v.status !== 'approved' && (
                                <button
                                  onClick={() => updateStatusMutation.mutate({ id: v.id, status: 'approved' })}
                                  disabled={updateStatusMutation.isPending}
                                  title="Duyệt video"
                                  className="w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/* Từ chối */}
                              {v.status !== 'rejected' && (
                                <button
                                  onClick={() => updateStatusMutation.mutate({ id: v.id, status: 'rejected' })}
                                  disabled={updateStatusMutation.isPending}
                                  title="Từ chối video"
                                  className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/* Xem YouTube */}
                              <a
                                href={v.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Xem trên YouTube"
                                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              {/* Xóa */}
                              <button
                                onClick={() => setDeleteTarget(v)}
                                title="Xóa video"
                                className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    Trang <span className="font-semibold text-slate-700">{page}</span> / {totalPages}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                      return (
                        <Button key={p} size="sm" onClick={() => setPage(p)}
                          className={`w-8 h-8 p-0 text-xs font-bold ${p === page
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          }`}>
                          {p}
                        </Button>
                      );
                    })}
                    <Button variant="outline" size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ═══ TAB: NGƯỜI DÙNG ═══ */}
            <TabsContent value="users" className="m-0 p-0">

              {/* Toolbar */}
              <div className="flex gap-3 p-4 border-b border-slate-100">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Tìm theo tên hoặc email..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm
                      text-slate-900 placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
                  />
                </div>
                <Button variant="outline" size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
                  title="Làm mới">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Tổng số */}
              <div className="px-5 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                {usersQuery.isLoading ? 'Đang tải...' : `${users.length} người dùng`}
              </div>

              {/* Danh sách user */}
              <div className="divide-y divide-slate-100">
                {usersQuery.isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="px-5 py-4">
                      <Skeleton className="h-12 bg-slate-100 rounded-xl" />
                    </div>
                  ))
                ) : users.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Không tìm thấy người dùng</p>
                  </div>
                ) : (
                  users.map(u => (
                    <div key={u.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/80 transition-colors group">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                          ${u.role === 'admin'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                          }`}>
                          {(u.fullName?.[0] || u.email?.[0] || '?').toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900 text-sm">{u.fullName || 'Ẩn danh'}</p>
                            {u.role === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Cấp JLPT */}
                        <div className="hidden lg:block text-right">
                          <p className="text-xs text-slate-400 font-medium uppercase">Cấp độ</p>
                          <p className="text-sm font-medium text-slate-700">{u.jlptLevel || 'Beginner'}</p>
                        </div>
                        {/* Ngày tham gia */}
                        <div className="hidden md:block text-right">
                          <p className="text-xs text-slate-400 font-medium uppercase">Tham gia</p>
                          <p className="text-sm font-medium text-slate-700">
                            {moment(u.createdAt).format('DD/MM/YYYY')}
                          </p>
                        </div>
                        {/* Badge role */}
                        <Badge className={`border-0 w-22 justify-center ${u.role === 'admin'
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}>
                          {u.role === 'admin' ? 'Quản trị' : 'Người dùng'}
                        </Badge>
                        {/* Nút đổi quyền */}
                        <button
                          onClick={() => changeRoleMutation.mutate({
                            id: u.id,
                            role: u.role === 'admin' ? 'user' : 'admin',
                          })}
                          disabled={changeRoleMutation.isPending}
                          title={u.role === 'admin' ? 'Hạ xuống Người dùng' : 'Nâng lên Admin'}
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-400
                            hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600
                            flex items-center justify-center transition-colors
                            opacity-0 group-hover:opacity-100"
                        >
                          <UserCog className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </>
  );
}