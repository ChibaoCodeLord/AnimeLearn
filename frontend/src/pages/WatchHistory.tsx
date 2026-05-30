import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, PlayCircle, Video } from 'lucide-react';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { videoApi } from '@/api/video.api';

interface WatchedVideoItem {
  history_id: string;
  id: string;
  title: string;
  thumbnail_url?: string;
  jlpt_level?: string;
  watched_at?: string;
  created_date?: string;
  duration?: number;
  progress_seconds?: number;
  views_count?: number;
  likes_count?: number;
}

const formatSeconds = (seconds?: number) => {
  const value = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(value / 60);
  const remainingSeconds = value % 60;

  if (minutes < 60) {
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return `${hours}:${String(restMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const fetchWatchHistory = async () => {
  const response = await videoApi.getWatchedVideos<{ data: WatchedVideoItem[] }>({ limit: 100 });
  return response.data || [];
};

export default function WatchHistory() {
  const { data: videos = [], isLoading } = useQuery<WatchedVideoItem[]>({
    queryKey: ['watch-history'],
    queryFn: fetchWatchHistory,
    initialData: [],
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <Link to="/Dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lịch sử video đã học</h1>
              <p className="text-slate-500 mt-1">Các lần xem video gần đây của bạn</p>
            </div>
          </div>
        </div>

        <Badge variant="outline" className="w-fit bg-white text-slate-600 border-slate-200 px-3 py-1.5">
          {videos.length} lượt xem
        </Badge>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(item => (
              <div key={item} className="flex items-center gap-4 p-3">
                <Skeleton className="w-28 h-16 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3 bg-slate-100" />
                  <Skeleton className="h-4 w-1/3 bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="min-h-80 flex flex-col items-center justify-center text-center px-6 py-16 text-slate-400">
            <PlayCircle className="w-14 h-14 mb-3 opacity-30" />
            <h2 className="text-lg font-bold text-slate-700">Chưa có lịch sử xem</h2>
            <p className="text-sm mt-1 max-w-sm">Khi bạn học một video, lịch sử sẽ xuất hiện tại đây.</p>
            <Button asChild className="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link to="/home">Học video mới</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {videos.map(video => (
              <Link
                key={video.history_id}
                to={`/VideoWorkspace?id=${video.id}`}
                className="grid grid-cols-[112px_1fr] md:grid-cols-[160px_1fr_auto] gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt=""
                    className="w-28 md:w-40 aspect-video rounded-xl object-cover bg-slate-100"
                  />
                ) : (
                  <div className="w-28 md:w-40 aspect-video rounded-xl bg-slate-100 flex items-center justify-center">
                    <Video className="w-7 h-7 text-slate-300" />
                  </div>
                )}

                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {video.jlpt_level && (
                      <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">
                        {video.jlpt_level}
                      </Badge>
                    )}
                    <span className="text-xs font-medium text-slate-400">
                      {moment(video.watched_at || video.created_date).fromNow()}
                    </span>
                  </div>
                  <h2 className="font-bold text-slate-900 truncate hover:text-emerald-600 transition-colors">
                    {video.title}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Đã xem tới {formatSeconds(video.progress_seconds)}
                    {video.duration ? ` / ${formatSeconds(video.duration)}` : ''}
                  </p>
                </div>

                <div className="hidden md:flex items-center">
                  <Button variant="outline" className="gap-2 border-slate-200 text-slate-700 hover:bg-white">
                    <PlayCircle className="w-4 h-4" />
                    Mở lại
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
