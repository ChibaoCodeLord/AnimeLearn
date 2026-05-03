import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserBannedErrorProps {
  banReason?: string;
  bannedAt?: string | null;
  unbannedAt?: string | null;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Khong ro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Khong ro';
  return date.toLocaleString('vi-VN');
};

export default function UserBannedError({ banReason, bannedAt, unbannedAt }: UserBannedErrorProps) {
  const navigate = useNavigate();
  const hasUnbanDate = Boolean(unbannedAt);

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-rose-50 via-amber-50 to-white flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full bg-white border border-rose-100 rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tài khoản đã bị khóa</h1>
            <p className="text-sm text-slate-500">Bạn tạm thời không thể đăng nhập</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Calendar className="w-4 h-4 text-rose-500" />
            <span className="font-semibold">Thoi gian khoa:</span>
            <span>{formatDateTime(bannedAt)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">Han mo khoa:</span>
            <span>{hasUnbanDate ? formatDateTime(unbannedAt) : 'Vinh vien'}</span>
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-semibold">Ly do:</span>
            <span className="ml-1">{banReason || 'Vi pham dieu khoan su dung.'}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
            className="flex-1"
          >
            Dang xuat
          </Button>
          <Button
            onClick={() => navigate('/login')}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
          >
            Ve trang dang nhap
          </Button>
        </div>
      </div>
    </div>
  );
}
