import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield, Users, Video, Trash2, Search, Eye, RefreshCw,
  ChevronLeft, ChevronRight, Film, BookOpen,
  UserCog, Crown, AlertTriangle,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
  isBanned?: boolean;
  bannedAt?: string | null;
  unbannedAt?: string | null;
  banReason?: string;
}

interface StatsData {
  totalVideos: number;
  totalUsers: number;
  totalAdmins: number;
}

// ─── API (ĐÃ TÍCH HỢP DEBUG LOGS) ──────────────────────────────────────────────

const API_BASE = 'http://localhost:5000/api';

const apiFetch = async (path: string, options?: RequestInit) => {
  console.log(`[🚀 API START] ${options?.method || 'GET'} ${path}`);
  const startTime = performance.now();
  
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    
    const endTime = performance.now();
    const timeTaken = (endTime - startTime).toFixed(2);
    
    console.log(`[✅ API END] ${options?.method || 'GET'} ${path} - ⏱️ Hết ${timeTaken}ms - Status: ${res.status}`);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Lỗi không xác định' }));
      throw new Error(err.error || 'Lỗi API');
    }
    
    // Đo lường thời gian parse JSON (đôi khi data quá to parse cũng chậm)
    const jsonStartTime = performance.now();
    const data = await res.json();
    const jsonEndTime = performance.now();
    
    if (jsonEndTime - jsonStartTime > 10) {
      console.warn(`[⚠️ CẢNH BÁO] API ${path} tốn ${(jsonEndTime - jsonStartTime).toFixed(2)}ms chỉ để parse JSON (Dữ liệu quá lớn?)`);
    }

    return data;
  } catch (error) {
    const endTime = performance.now();
    console.error(`[❌ API ERROR] ${options?.method || 'GET'} ${path} - ⏱️ Thất bại sau ${(endTime - startTime).toFixed(2)}ms`, error);
    throw error;
  }
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
    badgeCls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-200',
    barCls: 'bg-emerald-500',
  },
  pending: {
    label: 'Chờ duyệt',
    icon: <Clock className="w-3 h-3" />,
    badgeCls: 'bg-amber-100 text-amber-700 border-amber-200 dark:border-amber-800 dark:bg-amber-950/45 dark:text-amber-200',
    barCls: 'bg-amber-400',
  },
  rejected: {
    label: 'Từ chối',
    icon: <XCircle className="w-3 h-3" />,
    badgeCls: 'bg-rose-100 text-rose-700 border-rose-200 dark:border-rose-800 dark:bg-rose-950/45 dark:text-rose-200',
    barCls: 'bg-rose-500',
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VideoStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badgeCls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function VideoThumbnail({ url, title, status }: { url: string; title: string; status: VideoStatus }) {
  const [err, setErr] = useState(false);
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="relative w-20 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 dark:bg-slate-900">
      {!err && url ? (
        <img src={url} alt={title} className="w-full h-full object-cover" onError={() => setErr(true)} />
      ) : (
        <Film className="w-4 h-4 text-slate-400" />
      )}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${cfg.barCls}`} />
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, colorClass, bgClass, isLoading,
}: {
  icon: React.ElementType; label: string; value: number | string;
  colorClass: string; bgClass: string; isLoading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group dark:border-slate-700 dark:bg-slate-950">
      <div className={`absolute top-0 left-0 right-0 h-1 ${bgClass} opacity-50 group-hover:opacity-100 transition-opacity`} />
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-20 bg-slate-100 mb-1 dark:bg-slate-800" />
      ) : (
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      )}
      <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
    </div>
  );
}

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

function RejectReasonModal({
  video, reason, onReasonChange, onConfirm, onCancel, isSubmitting,
}: {
  video: VideoItem | null; reason: string; onReasonChange: (value: string) => void;
  onConfirm: () => void; onCancel: () => void; isSubmitting: boolean;
}) {
  if (!video) return null;
  const trimmedReason = reason.trim();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Nhập lý do từ chối</h3>
            <p className="text-sm text-slate-500">Lý do này sẽ được gửi về email của người tạo video.</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
          <p className="text-sm text-slate-800 font-medium line-clamp-2">{video.title}</p>
          <p className="text-xs text-slate-500 mt-1">Tạo bởi: {video.creator.fullName}</p>
        </div>
        <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="reject-reason">
          Lý do từ chối
        </label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={5}
          placeholder="Ví dụ: Âm thanh chưa rõ, nội dung chưa đúng chủ đề..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 resize-none"
        />
        <p className="mt-2 text-xs text-slate-500">
          Tối thiểu nhập một lý do ngắn để người dùng biết cần sửa phần nào.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
            Hủy bỏ
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting || !trimmedReason}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-0"
          >
            {isSubmitting ? 'Đang gửi...' : 'Từ chối & gửi email'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BanUserModal({
  user,
  reason,
  unbannedAt,
  onReasonChange,
  onUnbannedAtChange,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  user: UserItem | null;
  reason: string;
  unbannedAt: string;
  onReasonChange: (value: string) => void;
  onUnbannedAtChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  if (!user) return null;
  const trimmedReason = reason.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Ban người dùng</h3>
            <p className="text-sm text-slate-500">Thông báo sẽ được gửi qua email.</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
          <p className="text-sm text-slate-800 font-medium line-clamp-2">{user.fullName || 'Ẩn danh'}</p>
          <p className="text-xs text-slate-500 mt-1">{user.email}</p>
        </div>

        <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="ban-reason">
          Lý do ban
        </label>
        <textarea
          id="ban-reason"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={4}
          placeholder="Ví dụ: Spam bình luận, nội dung không phù hợp..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 resize-none"
        />

        <label className="block text-sm font-semibold text-slate-700 mt-4 mb-2" htmlFor="ban-until">
          Thời gian mở khóa (tùy chọn)
        </label>
        <input
          id="ban-until"
          type="date"
          value={unbannedAt}
          onChange={(e) => onUnbannedAtChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
        />

        <div className="mt-5 flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
            Hủy bỏ
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting || !trimmedReason}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-0"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Ban user'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UnbanConfirmModal({
  user,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  user: UserItem | null;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Gỡ ban người dùng</h3>
            <p className="text-sm text-slate-500">Tài khoản sẽ được mở lại ngay lập tức.</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-5 border border-slate-100">
          <p className="text-sm text-slate-800 font-medium line-clamp-2">{user.fullName || 'Ẩn danh'}</p>
          <p className="text-xs text-slate-500 mt-1">{user.email}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
            Hủy bỏ
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Gỡ ban'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT CHÍNH ──────────────────────────────────────────────────────────

export default function AdminPanel() {
  const queryClient = useQueryClient();
  const renderCount = useRef(0);

  // Debug Renders
  useEffect(() => {
    renderCount.current += 1;
    console.log(`[⚛️ REACT RENDER] AdminPanel Component Re-rendered (Total: ${renderCount.current})`);
  });

  // Video filters
  const [videoSearch, setVideoSearch] = useState('');
  const [videoSearchDebounced, setVideoSearchDebounced] = useState('');
  const [jlptFilter, setJlptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<VideoItem | null>(null);
  const [rejectTarget, setRejectTarget] = useState<VideoItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [banTarget, setBanTarget] = useState<UserItem | null>(null);
  const [banReasonText, setBanReasonText] = useState('');
  const [banUntil, setBanUntil] = useState('');
  const [unbanTarget, setUnbanTarget] = useState<UserItem | null>(null);

  // User search & pagination
  const [userSearch, setUserSearch] = useState('');
  const [userSearchDebounced, setUserSearchDebounced] = useState('');
  const [userPage, setUserPage] = useState(1);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => { setVideoSearchDebounced(videoSearch); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [videoSearch]);

  useEffect(() => {
    const t = setTimeout(() => { setUserSearchDebounced(userSearch); setUserPage(1); }, 400);
    return () => clearTimeout(t);
  }, [userSearch]);

  // Lấy user hiện tại
  const { data: currentUser, isLoading: isLoadingAuth } = useQuery<{ role: string } | null>({
    queryKey: ['current-user'],
    queryFn: () => apiFetch('/auth/me').catch(() => null),
    retry: false
  });

  // ── Queries ───────────────────────────────────────────────────────────────

  const statsQuery = useQuery<StatsData>({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch('/admin/stats'),
    enabled: currentUser?.role === 'admin',
  });

  const videosQuery = useQuery<VideosResponse>({
    queryKey: ['admin-videos', videoSearchDebounced, jlptFilter, statusFilter, page],
    queryFn: () => apiFetch(
      `/admin/videos?search=${encodeURIComponent(videoSearchDebounced)}&jlpt=${jlptFilter}&status=${statusFilter}&page=${page}&limit=10`
    ),
    enabled: currentUser?.role === 'admin',
  });

  const usersQuery = useQuery<UserItem[]>({
    queryKey: ['admin-users', userSearchDebounced],
    queryFn: () => apiFetch(`/admin/users?search=${encodeURIComponent(userSearchDebounced)}`),
    enabled: currentUser?.role === 'admin',
  });

  // Debug Trạng thái Queries
  useEffect(() => {
    if (videosQuery.isFetching) console.log('🔄 Đang lấy dữ liệu Videos...');
    if (usersQuery.isFetching) console.log('🔄 Đang lấy dữ liệu Users (Có thể nặng nề)...');
  }, [videosQuery.isFetching, usersQuery.isFetching]);

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
    mutationFn: ({ id, status, reason }: { id: string; status: VideoStatus; reason?: string }) =>
      apiFetch(`/admin/videos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
      toast.success(`Đã cập nhật: ${STATUS_CONFIG[variables.status].label}`);
      if (variables.status === 'rejected') {
        setRejectTarget(null);
        setRejectReason('');
      }
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

  const banUserMutation = useMutation({
    mutationFn: ({ id, banReason, unbannedAt }: { id: string; banReason: string; unbannedAt?: string | null }) =>
      apiFetch(`/admin/users/${id}/ban`, {
        method: 'PATCH',
        body: JSON.stringify({ banReason, unbannedAt: unbannedAt || null }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Đã ban người dùng');
      setBanTarget(null);
      setBanReasonText('');
      setBanUntil('');
    },
    onError: (e: Error) => toast.error(`Lỗi: ${e.message}`),
  });

  const unbanUserMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/users/${id}/unban`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Đã gỡ ban người dùng');
      setUnbanTarget(null);
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
  
  // Áp dụng phân trang Frontend cho Users
  const users = usersQuery.data ?? [];
  const usersPerPage = 10;
  const paginatedUsers = users.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);
  const totalUserPages = Math.ceil(users.length / usersPerPage);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <DeleteConfirmModal
        video={deleteTarget}
        onConfirm={() => deleteTarget && deleteVideoMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={deleteVideoMutation.isPending}
      />
      <RejectReasonModal
        video={rejectTarget}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        onConfirm={() => {
          if (!rejectTarget) return;
          const trimmedReason = rejectReason.trim();
          if (!trimmedReason) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
          }
          updateStatusMutation.mutate({ id: rejectTarget.id, status: 'rejected', reason: trimmedReason });
        }}
        isSubmitting={updateStatusMutation.isPending}
      />
      <BanUserModal
        user={banTarget}
        reason={banReasonText}
        unbannedAt={banUntil}
        onReasonChange={setBanReasonText}
        onUnbannedAtChange={setBanUntil}
        onCancel={() => {
          setBanTarget(null);
          setBanReasonText('');
          setBanUntil('');
        }}
        onConfirm={() => {
          if (!banTarget) return;
          const trimmedReason = banReasonText.trim();
          if (!trimmedReason) {
            toast.error('Vui lòng nhập lý do ban');
            return;
          }
          banUserMutation.mutate({
            id: banTarget.id,
            banReason: trimmedReason,
            unbannedAt: banUntil || null,
          });
        }}
        isSubmitting={banUserMutation.isPending}
      />
      <UnbanConfirmModal
        user={unbanTarget}
        onCancel={() => setUnbanTarget(null)}
        onConfirm={() => unbanTarget && unbanUserMutation.mutate(unbanTarget.id)}
        isSubmitting={unbanUserMutation.isPending}
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
                  className="data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md px-6 flex gap-2 text-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-50">
                  <Video className="w-4 h-4" /> Quản lý Video
                </TabsTrigger>
                <TabsTrigger value="users"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md px-6 flex gap-2 text-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-slate-50">
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
                  <option value="pending">⏳ Đang xử lý</option>
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
                                  onClick={() => {
                                    setRejectTarget(v);
                                    setRejectReason('');
                                  }}
                                  disabled={updateStatusMutation.isPending}
                                  title="Từ chối video"
                                  className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/* Xem video */}
                              <Link
                                to={`/VideoWorkspace?id=${v.id}`}
                                title="Mở trang xem video"
                                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
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

              {/* Phân trang Video */}
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
                ) : paginatedUsers.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Không tìm thấy người dùng</p>
                  </div>
                ) : (
                  paginatedUsers.map(u => (
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
                        {u.isBanned && (
                          <Badge className="border-0 w-22 justify-center bg-rose-100 text-rose-700 hover:bg-rose-200">
                            Bị cấm
                          </Badge>
                        )}
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
                        {u.isBanned ? (
                          <button
                            onClick={() => setUnbanTarget(u)}
                            disabled={unbanUserMutation.isPending || u.role === 'admin'}
                            title={u.role === 'admin' ? 'Không thể gỡ ban admin' : 'Gỡ ban người dùng'}
                            className="w-8 h-8 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600
                              hover:bg-emerald-100 flex items-center justify-center transition-colors
                              opacity-0 group-hover:opacity-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setBanTarget(u);
                              setBanReasonText('');
                              setBanUntil('');
                            }}
                            disabled={banUserMutation.isPending || u.role === 'admin'}
                            title={u.role === 'admin' ? 'Không thể ban admin' : 'Ban người dùng'}
                            className="w-8 h-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600
                              hover:bg-rose-100 flex items-center justify-center transition-colors
                              opacity-0 group-hover:opacity-100"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Phân trang Người dùng */}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500">
                    Trang <span className="font-semibold text-slate-700">{userPage}</span> / {totalUserPages}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm"
                      onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(userPage - 2, totalUserPages - 4)) + i;
                      return (
                        <Button key={p} size="sm" onClick={() => setUserPage(p)}
                          className={`w-8 h-8 p-0 text-xs font-bold ${p === userPage
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}>
                          {p}
                        </Button>
                      );
                    })}
                    <Button variant="outline" size="sm"
                      onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))} disabled={userPage === totalUserPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </>
  );
}
