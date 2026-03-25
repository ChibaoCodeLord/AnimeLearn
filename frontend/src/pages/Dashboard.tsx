import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Video, Brain, Star, TrendingUp, Clock, ArrowRight, Activity, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import moment from 'moment';

// 1. Khai báo Interfaces
interface VocabItem {
  id: string;
  word: string;
  reading?: string;
  jlpt_level?: string;
  next_review_date?: string;
}

interface VideoItem {
  id: string;
  title: string;
  created_date: string;
  jlpt_level?: string;
}

interface QuizItem {
  id: string;
  created_date: string;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  colorClass: string;
  bgClass: string;
  isLoading?: boolean;
}

// 2. Mock Data
const mockVocabulary: VocabItem[] = [
  { id: 'v1', word: '食べる', reading: 'たべる', jlpt_level: 'N5', next_review_date: '2026-03-10T00:00:00Z' },
  { id: 'v2', word: '約束', reading: 'やくそく', jlpt_level: 'N4', next_review_date: '2026-03-20T00:00:00Z' },
  { id: 'v3', word: '環境', reading: 'かんきょう', jlpt_level: 'N3', next_review_date: '2026-03-14T00:00:00Z' },
  { id: 'v4', word: '曖昧', reading: 'あいまい', jlpt_level: 'N1', next_review_date: '2026-04-01T00:00:00Z' },
];

const mockVideos: VideoItem[] = [
  { id: 'vid1', title: 'Học tiếng Nhật qua Jujutsu Kaisen Tập 1', created_date: '2026-03-13T10:00:00Z', jlpt_level: 'N3' },
  { id: 'vid2', title: 'Từ vựng N4 - Frieren: Beyond Journey\'s End', created_date: '2026-03-12T15:30:00Z', jlpt_level: 'N4' },
];

const mockQuizzes: QuizItem[] = [
  { id: 'q1', created_date: '2026-03-13T11:00:00Z' },
];

// 3. Giả lập API Calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockApi = {
  getVocabulary: async () => { await delay(600); return mockVocabulary; },
  getVideos: async () => { await delay(800); return mockVideos; },
  getQuizzes: async () => { await delay(500); return mockQuizzes; },
};

// 4. Component Component Con (StatCard được thiết kế lại)
function StatCard({ icon: Icon, label, value, colorClass, bgClass, isLoading }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Vệt màu trang trí trên cùng */}
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

// 5. Component Chính
export default function Dashboard() {
  const { data: vocabulary = [], isLoading: vocabLoading } = useQuery<VocabItem[]>({
    queryKey: ['dashboard-vocab'],
    queryFn: mockApi.getVocabulary,
    initialData: [],
  });

  const { data: videos = [], isLoading: videoLoading } = useQuery<VideoItem[]>({
    queryKey: ['dashboard-videos'],
    queryFn: mockApi.getVideos,
    initialData: [],
  });

  const { data: quizzes = [], isLoading: quizLoading } = useQuery<QuizItem[]>({
    queryKey: ['dashboard-quizzes'],
    queryFn: mockApi.getQuizzes,
    initialData: [],
  });

  const dueReviews = vocabulary.filter(v => {
    if (!v.next_review_date) return true;
    return new Date(v.next_review_date) <= new Date();
  });

  const jlptCounts = vocabulary.reduce((acc: Record<string, number>, v) => {
    const level = v.jlpt_level || 'Unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tổng quan học tập</h1>
          </div>
          <p className="text-slate-500 ml-14">Theo dõi tiến độ và chỉ số tích lũy của bạn</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Hôm nay</p>
          <p className="text-slate-700 font-medium">{moment().format('DD/MM/YYYY')}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={BookOpen} label="Từ vựng đã lưu" value={vocabulary.length} 
          colorClass="text-emerald-600" bgClass="bg-emerald-100" isLoading={vocabLoading} 
        />
        <StatCard 
          icon={Video} label="Video đã học" value={videos.length} 
          colorClass="text-blue-600" bgClass="bg-blue-100" isLoading={videoLoading} 
        />
        <StatCard 
          icon={Brain} label="Bài Quiz đã làm" value={quizzes.length} 
          colorClass="text-violet-600" bgClass="bg-violet-100" isLoading={quizLoading} 
        />
        <StatCard 
          icon={Star} label="Cần ôn tập ngay" value={dueReviews.length} 
          colorClass="text-amber-600" bgClass="bg-amber-100" isLoading={vocabLoading} 
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* JLPT Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Phân bố từ vựng JLPT
            </h3>
            <Badge variant="outline" className="text-slate-500 bg-slate-50">Tổng: {vocabulary.length}</Badge>
          </div>
          
          <div className="space-y-4">
            {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map(level => {
              const count = jlptCounts[level] || 0;
              const percent = vocabulary.length > 0 ? (count / vocabulary.length) * 100 : 0;
              
              const colors: Record<string, string> = {
                N5: 'bg-emerald-400',
                N4: 'bg-blue-400',
                N3: 'bg-indigo-400',
                N2: 'bg-orange-400',
                N1: 'bg-rose-400',
              };

              return (
                <div key={level} className="flex items-center gap-4 group">
                  <span className="text-sm font-bold text-slate-700 w-8">{level}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[level]} rounded-full transition-all duration-1000 ease-out`} 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-600 w-12 text-right">
                    {count} <span className="text-xs text-slate-400 font-normal">từ</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Videos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-blue-500" />
              Video học gần đây
            </h3>
            <Link to="/Home" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Xem tất cả</Link>
          </div>
          
          <div className="flex-1">
            {videoLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full bg-slate-100 rounded-xl" />
                <Skeleton className="h-16 w-full bg-slate-100 rounded-xl" />
              </div>
            ) : videos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                <PlayCircle className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Bạn chưa học video nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {videos.slice(0, 4).map(v => (
                  <Link key={v.id} to={`/VideoWorkspace?id=${v.id}`} className="block">
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                        🎬
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-emerald-600 transition-colors">{v.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{moment(v.created_date).fromNow()}</p>
                      </div>
                      {v.jlpt_level && (
                        <Badge className="bg-white border-slate-200 text-slate-600 shrink-0 font-medium">
                          {v.jlpt_level}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="font-bold text-slate-900 mb-4 text-lg">Hành động nhanh</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/Home">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all group h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-800 flex items-center justify-between z-10">
              Học video mới
              <ArrowRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-sm text-slate-500 mt-2 z-10">Dán link YouTube và tạo script AI</p>
          </div>
        </Link>
        
        <Link to="/Vocabulary">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-amber-300 hover:shadow-md transition-all group h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-800 flex items-center justify-between z-10">
              Ôn tập Flashcard
              <ArrowRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-sm text-slate-500 mt-2 z-10">
              {dueReviews.length > 0 ? (
                <span className="text-amber-600 font-medium">{dueReviews.length} từ đang chờ bạn</span>
              ) : (
                "Không có từ nào đến hạn"
              )}
            </p>
          </div>
        </Link>
        
        <Link to="/QuizPage">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-violet-300 hover:shadow-md transition-all group h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
            <h4 className="font-bold text-slate-800 flex items-center justify-between z-10">
              Kiểm tra kiến thức
              <ArrowRight className="w-5 h-5 text-violet-500 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-sm text-slate-500 mt-2 z-10">Làm Quiz tự động từ kịch bản</p>
          </div>
        </Link>
      </div>
    </div>
  );
}