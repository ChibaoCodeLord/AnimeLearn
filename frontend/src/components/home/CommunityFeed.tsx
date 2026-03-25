import { Link } from 'react-router-dom';
import { Eye, Heart, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';

// 1. Khai báo kiểu dữ liệu cho từng Video
export interface VideoItem {
  id: string | number;
  thumbnail_url?: string;
  title: string;
  jlpt_level?: string;
  views_count?: number;
  likes_count?: number;
  created_date: string | Date;
}

// 2. Khai báo kiểu dữ liệu cho Props truyền vào Component
interface CommunityFeedProps {
  videos?: VideoItem[]; // Có dấu ? vì đôi khi có thể bị undefined
  isLoading?: boolean;
}

// 3. Khai báo Record<string, string> để TS không báo lỗi khi gọi jlptColors[video.jlpt_level]
const jlptColors: Record<string, string> = {
  N5: 'bg-green-100 text-green-700 border-green-200',
  N4: 'bg-blue-100 text-blue-700 border-blue-200',
  N3: 'bg-purple-100 text-purple-700 border-purple-200',
  N2: 'bg-orange-100 text-orange-700 border-orange-200',
  N1: 'bg-red-100 text-red-700 border-red-200',
  Mixed: 'bg-slate-100 text-slate-700 border-slate-200',
};

// 4. Gắn type CommunityFeedProps vào hàm
export default function CommunityFeed({ videos, isLoading }: CommunityFeedProps) {
  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">Cộng đồng</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl bg-white border border-slate-200 overflow-hidden animate-pulse shadow-sm">
                <div className="aspect-video bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Cộng đồng</h2>
            <p className="text-slate-600 mt-1">Video được chia sẻ bởi cộng đồng</p>
          </div>
        </div>

        {!videos || videos.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">Chưa có video nào. Hãy là người đầu tiên chia sẻ!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <Link key={video.id} to={`/VideoWorkspace?id=${video.id}`}>
                <div className="group rounded-2xl bg-white border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all">
                  <div className="aspect-video bg-slate-100 relative overflow-hidden">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      // Đã sửa bg-gradient-to-br thành bg-linear-to-br
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-50">
                        <span className="text-4xl">🎬</span>
                      </div>
                    )}
                    {video.jlpt_level && (
                      <Badge className={`absolute top-3 left-3 ${jlptColors[video.jlpt_level] || jlptColors.Mixed} border`}>
                        {video.jlpt_level}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {video.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {moment(video.created_date).fromNow()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}