import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import moment from 'moment';

export interface VideoItem {
  id: string | number;
  thumbnail_url?: string;
  title: string;
  jlpt_level?: string;
  views_count?: number;
  likes_count?: number;
  created_date: string | Date;
}

interface VideosByLevelProps {
  videos?: VideoItem[];
  isLoading?: boolean;
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
  Mixed: 'Học tự do (Nguồn ngoài)',
};

function LevelSection({ level, levelVideos }: { level: string; levelVideos: VideoItem[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedVideos = isExpanded ? levelVideos : levelVideos.slice(0, 4);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Badge className={`${jlptColors[level]} border text-base px-3 py-1`}>
            {level}
          </Badge>
          <h2 className="text-2xl font-bold text-slate-900">{levelNames[level]}</h2>
        </div>
        
        {levelVideos.length > 4 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer outline-none transition-colors"
          >
            {isExpanded ? 'Thu gọn' : 'Xem tất cả'}
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedVideos.map(video => (
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
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-emerald-100 to-teal-100">
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
    </section>
  );
}

export default function VideosByLevel({ videos = [], isLoading }: VideosByLevelProps) {
  if (isLoading) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-12">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-8 bg-emerald-100 rounded w-32 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="rounded-xl bg-white border border-slate-200 overflow-hidden">
                      <div className="aspect-video bg-slate-100" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const videosByLevel: Record<string, VideoItem[]> = {
    N5: videos.filter(v => v.jlpt_level === 'N5'),
    N4: videos.filter(v => v.jlpt_level === 'N4'),
    N3: videos.filter(v => v.jlpt_level === 'N3'),
    N2: videos.filter(v => v.jlpt_level === 'N2'),
    N1: videos.filter(v => v.jlpt_level === 'N1'),
    Mixed: videos.filter(v => !['N1', 'N2', 'N3', 'N4', 'N5'].includes(v.jlpt_level || '')),
  };

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        {Object.entries(videosByLevel).map(([level, levelVideos]) => {
          if (levelVideos.length === 0) return null;
          
          return (
            <LevelSection 
              key={level} 
              level={level} 
              levelVideos={levelVideos} 
            />
          );
        })}
      </div>
    </div>
  );
}