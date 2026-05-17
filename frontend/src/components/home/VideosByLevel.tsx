import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';
import axios from 'axios';

export interface VideoItem {
  id: string | number;
  thumbnail_url?: string;
  title: string;
  jlpt_level?: string;
  views_count?: number;
  likes_count?: number;
  created_date: string | Date;
}

const jlptColors: Record<string, string> = {
  N5: 'bg-green-100 text-green-700 border-green-200',
  N4: 'bg-blue-100 text-blue-700 border-blue-200',
  N3: 'bg-purple-100 text-purple-700 border-purple-200',
  N2: 'bg-orange-100 text-orange-700 border-orange-200',
  N1: 'bg-red-100 text-red-700 border-red-200',
  Mixed: 'bg-slate-100 text-slate-700 border-slate-200',
};

const levelNames: Record<string, string> = {
  N5: 'Sơ cấp (N5)',
  N4: 'Sơ - Trung cấp (N4)',
  N3: 'Trung cấp (N3)',
  N2: 'Trung - Cao cấp (N2)',
  N1: 'Cao cấp (N1)',
  Mixed: 'Video chưa phân loại',
};

const fetchVideosFromApi = async (level: string, page: number, limit: number): Promise<{data: VideoItem[], hasMore: boolean}> => {
  try {
    // Lưu ý: Đổi /api/videos thành route gốc video của bạn (vd: /api/video/public-videos)
    const res = await axios.get(`http://localhost:5000/api/video/public-videos?level=${level}&page=${page}&limit=${limit}`);
    
    return {
      data: res.data.data,
      hasMore: res.data.hasMore
    };
  } catch (error) {
    console.error("Lỗi fetch video level", level, error);
    return { data: [], hasMore: false };
  }
};

function LevelSection({ level }: { level: string }) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Gọi API lần đầu khi component được render
  useEffect(() => {
    loadVideos(1);
  }, [level]);

  const loadVideos = async (pageNumber: number) => {
    if (pageNumber === 1) setIsLoading(true);
    else setIsLoadingMore(true);

    const limit = 4; // Lấy 4 video mỗi lần (vừa đẹp 1 hàng)
    const result = await fetchVideosFromApi(level, pageNumber, limit);

    if (pageNumber === 1) {
      setVideos(result.data);
    } else {
      setVideos(prev => [...prev, ...result.data]);
    }
    
    setHasMore(result.hasMore);
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadVideos(nextPage);
  };

  // Nếu loading lần đầu thì hiện Skeleton
  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="h-8 bg-emerald-100 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl bg-white border border-slate-200 overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-100" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Nếu level này không có video nào thì ẩn luôn section
  if (videos.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Badge className={`${jlptColors[level]} border text-base px-3 py-1`}>
            {level}
          </Badge>
          <h2 className="text-2xl font-bold text-slate-900">{levelNames[level]}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {videos.map(video => (
          <Link key={video.id} to={`/VideoWorkspace?id=${video.id}`}>
            <div className="group rounded-xl bg-white border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col h-full">
              <div className="aspect-video bg-slate-100 relative overflow-hidden shrink-0">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100">
                    <span className="text-4xl">🎬</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1">
                <h3 
                  title={video.title}
                  className="font-semibold text-slate-900 line-clamp-2 group-hover:text-emerald-600 transition-colors text-sm"
                >
                  {video.title}
                </h3>
                <div className="flex items-center gap-3 mt-auto pt-2 text-xs text-slate-500">
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

      {/* Nút Xem thêm */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-6 py-2 rounded-full border border-emerald-200 text-emerald-700 font-medium hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</>
            ) : (
              <>Xem thêm video {level} <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      )}
    </section>
  );
}

// Parent Component bây giờ cực kỳ gọn nhẹ
export default function VideosByLevel() {
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1', 'Mixed'];

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {levels.map(level => (
          <LevelSection key={level} level={level} />
        ))}
      </div>
    </div>
  );
}