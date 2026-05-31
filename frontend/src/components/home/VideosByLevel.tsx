import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, ChevronRight, ChevronLeft, Play, Layers, Heart, Search, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import { videoApi } from '@/api/video.api';

// Định nghĩa lại Type cho đồng bộ
export interface VideoItem {
  id: string | number;
  thumbnail_url?: string;
  title: string;
  jlpt_level?: string;
  views_count?: number;
  likes_count?: number;
  created_date: string | Date;
  vocab_count?: number; // Mock data
  duration?: string;    // Mock data
  theme?: string;       // Mock data
}

const jlptColors: Record<string, string> = {
  N5: 'bg-green-100 text-green-700',
  N4: 'bg-blue-100 text-blue-700',
  N3: 'bg-purple-100 text-purple-700',
  N2: 'bg-orange-100 text-orange-700',
  N1: 'bg-red-100 text-red-700',
  Mixed: 'bg-slate-100 text-slate-700',
};

const formatDuration = (totalSeconds: number | undefined | null) => {
  if (!totalSeconds) return '00:00';
  
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  
  // Ép thêm số 0 đằng trước nếu nhỏ hơn 10 (vd: 9 -> 09)
  const mDisplay = m < 10 && h > 0 ? `0${m}` : m;
  const sDisplay = s < 10 ? `0${s}` : s;
  
  if (h > 0) return `${h}:${mDisplay}:${sDisplay}`; // Hiển thị 1:02:30 nếu trên 1 tiếng
  return `${mDisplay}:${sDisplay}`; // Hiển thị 12:30 nếu dưới 1 tiếng
};

const FILTERS = ['Tất cả', 'N1', 'N2', 'N3', 'N4', 'N5', 'Mixed'];
const THEMES = ['Tất cả chủ đề', 'Anime', 'Podcast', 'Tin tức', 'Âm nhạc'];
const ITEMS_PER_PAGE_OPTIONS = [12, 18, 24, 36];

interface VideosByLevelProps {
  initialVideos?: VideoItem[];
  isInitialLoading?: boolean;
  onTotalUpdate?: (total: number) => void;
}

export default function VideosByLevel({ initialVideos = [], isInitialLoading = false, onTotalUpdate }: VideosByLevelProps) {
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [isLoading, setIsLoading] = useState(isInitialLoading);
  
  // States Filter & Pagination
  const [activeJlpt, setActiveJlpt] = useState('Tất cả');
  const [activeTheme, setActiveTheme] = useState('Tất cả chủ đề');
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(18);
  const [totalVideos, setTotalVideos] = useState(124); // Thay bằng API count thật nếu có

  const fetchVideos = async (levelFilter: string, currentPage: number, limit: number, searchRaw?: string) => {
    setIsLoading(true);
    try {
      const queryParams: any = {
        page: currentPage,
        limit,
        level: levelFilter === 'Tất cả' ? undefined : levelFilter,
      };
      if (searchRaw && searchRaw.trim() !== '') {
        queryParams.search = searchRaw.trim();
      }
      
      const res = await videoApi.getPublicVideos<{ data: any[]; hasMore: boolean; total?: number }>(queryParams);
      
      const enrichedData = res.data.map((v: any) => ({
        ...v,
        duration: formatDuration(v.duration) || '00:00', // Nhận số giây từ DB (ví dụ: 750)
        theme: v.video_theme || 'Anime', // Nhận chủ đề từ DB
        vocab_count: v.vocab_count || Math.floor(Math.random() * 50) + 10,
      }));

      setVideos(enrichedData);
      const fetchedTotal = res.total || enrichedData.length * 5;
      setTotalVideos(fetchedTotal);
      
      // 🚀 BẮN DỮ LIỆU LÊN CHO COMPONENT CHA (HOME) BẰNG DÒNG NÀY:
      if (onTotalUpdate) onTotalUpdate(fetchedTotal);
      
    } catch (error) {
      console.error("Lỗi fetch video", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect gọi lại API khi đổi Filter hoặc Page
  useEffect(() => {
    // Không gọi nếu đang load lần đầu từ props Home
    const timer = setTimeout(() => {
      fetchVideos(activeJlpt, page, itemsPerPage, searchQuery);
    }, 500); // Thêm debounce 500ms để tránh gọi API liên tục khi gõ

    return () => clearTimeout(timer);
  }, [activeJlpt, page, itemsPerPage, searchQuery]);

  // Đóng dropdown theme khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset page về 1 khi đổi filter
  const handleJlptChange = (level: string) => {
    setActiveJlpt(level);
    setPage(1);
  };

  const totalPages = Math.ceil(totalVideos / itemsPerPage) || 1;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8">
      
      {/* --- Filter Bar & Search --- */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 relative w-full">
        <div className="flex items-center relative w-full lg:w-[320px] xl:w-[350px] shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm bài học, anime hoặc bài hát..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 outline-none focus:ring-1 focus:ring-teal-400 transition-all text-sm text-slate-700 placeholder:text-slate-400 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:overflow-x-auto lg:pb-1 no-scrollbar shrink-0 mx-auto max-w-full">
          {FILTERS.map(filter => (
            <button
              key={filter}
              onClick={() => handleJlptChange(filter)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeJlpt === filter
                  ? 'bg-teal-100 text-teal-800 border border-teal-400 shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {filter === 'Tất cả' ? filter : `JLPT ${filter}`}
            </button>
          ))}
        </div>
        
        {/* Additional Filters (Themes) */}
        <div className="relative shrink-0 hidden lg:block" ref={themeDropdownRef}>
          <button
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white min-w-[140px] px-5 py-2.5 rounded-full text-sm font-medium outline-none cursor-pointer shadow-sm hover:bg-slate-800 transition-all border border-slate-900"
          >
            {activeTheme}
          </button>
          
          {/* Menu xổ xuống (Dropdown Menu) - Cân đối và mềm mại */}
          {isThemeOpen && (
            <div className="absolute right-0 top-full mt-2 min-w-[180px] bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-slate-100 p-2.5 z-50 font-medium">
              {THEMES.map(theme => (
                <button
                  key={theme}
                  onClick={() => {
                    setActiveTheme(theme);
                    setPage(1);
                    setIsThemeOpen(false);
                  }}
                  className={`w-full text-left px-5 py-3 rounded-2xl text-sm transition-colors mb-1 last:mb-0 ${
                    activeTheme === theme
                      ? 'bg-slate-100/80 text-slate-800'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Mobile Filter Theme */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-2 no-scrollbar w-full mt-2">
           {THEMES.map(theme => (
            <button
              key={theme}
              onClick={() => { setActiveTheme(theme); setPage(1); }}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm transition-all ${
                activeTheme === theme
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      {/* --- Overview & Info Bar --- */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <p className="text-sm text-slate-500 font-medium">
          Hiển thị <span className="text-slate-900 font-bold">{(page - 1) * itemsPerPage + 1} – {Math.min(page * itemsPerPage, totalVideos)}</span> trong số <span className="text-slate-900 font-bold">{totalVideos}</span> video
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 hidden sm:inline">Số lượng:</span>
          <select 
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
            className="text-sm border-slate-200 rounded-lg bg-slate-50 text-slate-700 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            {ITEMS_PER_PAGE_OPTIONS.map(num => (
              <option key={num} value={num}>{num} / trang</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- Video Grid (6 Cột) --- */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
          {Array.from({ length: itemsPerPage }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="pt-4 flex gap-2">
                  <div className="h-3 bg-slate-100 rounded w-12" />
                  <div className="h-3 bg-slate-100 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy video</h3>
          <p className="text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm nhé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
          {videos.map(video => (
            <Link key={video.id} to={`/VideoWorkspace?id=${video.id}`} className="group">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md  hover:border-teal-300 transition-all duration-300 flex flex-col h-full">
                
                {/* Thumbnail Section */}
                <div className="aspect-video relative overflow-hidden bg-slate-100 shrink-0">
                  {video.thumbnail_url ? (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title} 
                      className="w-full h-full object-cover transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <Play className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                  {/* Badges on Thumbnail */}
                  <div className="absolute top-2 left-2">
                    <Badge className={`${jlptColors[video.jlpt_level || 'Mixed']} border-0 px-2 py-0.5 text-[10px] font-bold uppercase shadow-sm`}>
                      {video.jlpt_level || 'Mixed'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/75 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-lg shadow-sm">
                    <Clock className="w-3 h-3 text-white/90" />
                    <span className="leading-none">{video.duration}</span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-2 flex flex-col flex-1">
                  <h3 
                    title={video.title}
                    className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-teal-600 transition-colors mb-1.5"
                  >
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1" title="Lượt xem">
                      <Eye className="w-3.5 h-3.5 text-green-400" />
                      {video.views_count?.toLocaleString() || 0}
                    </span>
                    {/* Thêm lại Lượt thích ở đây */}
                    <span className="flex items-center gap-1" title="Lượt thích">
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                      {video.likes_count?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1" title="Chủ đề">
                      <Layers className="w-3.5 h-3.5" />
                      {video.theme}
                    </span>
                  </div>

                  {/* Bottom Action CTA */}
                  <div className="border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {moment(video.created_date).fromNow()}
                    </span>
                    {/* <span className="text-teal-600 text-xs font-bold flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                      Bắt đầu <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span> */}
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      )}

      {/* --- Pagination --- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-10">
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="w-9 h-9 rounded-lg text-slate-500 hover:text-teal-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic hiển thị 5 trang gần nhất
              let p = page;
              if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              
              if (p < 1 || p > totalPages) return null;

              return (
                <Button 
                  key={p} 
                  variant={p === page ? "default" : "ghost"}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                    p === page 
                      ? 'bg-teal-500 text-white shadow-md hover:bg-teal-600' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </Button>
              );
            })}

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages}
              className="w-9 h-9 rounded-lg text-slate-500 hover:text-teal-600"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
