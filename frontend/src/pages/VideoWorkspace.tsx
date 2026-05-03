import { useState, useEffect, useRef } from 'react';
import YouTubeOrigin from 'react-youtube';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const YouTube = (YouTubeOrigin as any).default || YouTubeOrigin;
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Loader2, Sparkles, Share2, Youtube, FileText, Mic, Brain, Eye, 
  EyeOff, Heart, AlertTriangle, BrainCircuit, PlayCircle, X, BookOpen , Mic2
} from 'lucide-react'; 
import { toast } from 'sonner';
import ScriptPanel, { type ScriptLine } from '../components/video/ScriptPanel';
import SubtitleOverlay from '../components/video/SubtitleOverlay';
import PlayerControls from '../components/video/PlayerControls';
import VocabularyPopup from '../components/video/VocabularyPopup';
import VideoRagChatWidget from '../components/video/VideoRagChatWidget';
import QuizPage from './QuizPage';
import KaraokeMode from '../components/video/KaraokeMode';

// ✨ THÊM IMPORT TRANG TỪ VỰNG Ở ĐÂY
import VocabularyTab from '../components/video/VocabularyTab';

// 1. Định nghĩa Interfaces
type VideoStatus = 'approved' | 'rejected' | 'pending';

interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role?: 'user' | 'admin';
}

interface QuizQuestion {
  timestamp: string;
  type: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizData {
  id: string;
  videoId: string;
  questions: QuizQuestion[];
}

const API_BASE = 'http://localhost:5000/api';
const VIDEO_VIEW_THRESHOLD = 0.7;

const STATUS_OPTIONS: Record<VideoStatus, { label: string; className: string }> = {
  approved: { label: 'Đã chấp nhận', className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  rejected: { label: 'Chưa chấp nhận', className: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' },
  pending: { label: 'Đang xem xét', className: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' },
};

const JLPT_COLORS: Record<string, string> = {
  'N1': 'border-red-200 bg-red-50 text-red-700',
  'N2': 'border-orange-200 bg-orange-50 text-orange-700',
  'N3': 'border-yellow-200 bg-yellow-50 text-yellow-700',
  'N4': 'border-blue-200 bg-blue-50 text-blue-700',
  'N5': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Unknown': 'border-slate-200 bg-slate-50 text-slate-600',
};

// Component Modal Pop-up Quiz
function PopupQuizModal({ question, onClose, onResume }: { question: QuizQuestion; onClose: () => void; onResume: () => void; }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (index: number) => {
    setSelectedOption(index);
    setShowResult(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <Badge className="bg-violet-100 text-violet-700 border-0 px-3 py-1 text-xs uppercase tracking-wider font-bold">Kiểm tra nhanh</Badge>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors p-1"><X className="w-6 h-6" /></button>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: question.questionText }} />

        <div className="space-y-3">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.correctAnswerIndex;
            const isSelected = i === selectedOption;

            return (
              <button
                key={i}
                onClick={() => !showResult && handleAnswer(i)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                  showResult ? isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : isSelected ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-100 bg-slate-50 opacity-50 text-slate-500'
                    : 'border-slate-200 hover:border-violet-400 hover:bg-violet-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold shrink-0 ${
                    showResult && isCorrect ? 'bg-emerald-500 text-white' : showResult && isSelected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-medium text-base">{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-6 p-4 rounded-xl bg-violet-50 border border-violet-100 text-sm text-slate-700 animate-in slide-in-from-bottom-4">
            <span className="font-bold text-violet-700 block mb-1">💡 Giải thích:</span>
            {question.explanation}
          </div>
        )}

        {showResult && (
          <Button onClick={onResume} className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl text-base font-semibold">
            Tiếp tục xem video <PlayCircle className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

function RejectReasonModal({ title, reason, onReasonChange, onConfirm, onCancel, isSubmitting }: any) {
  const trimmedReason = reason.trim();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-rose-600" /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Nhập lý do từ chối</h3>
            <p className="text-sm text-slate-500">Lý do sẽ được gửi về email của người tạo video.</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
          <p className="text-sm text-slate-800 font-medium line-clamp-2">{title}</p>
        </div>
        <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="video-workspace-reject-reason">Lý do từ chối</label>
        <textarea
          id="video-workspace-reject-reason" value={reason} onChange={(e) => onReasonChange(e.target.value)} rows={5}
          placeholder="Ví dụ: Nội dung chưa đúng chủ đề, âm thanh còn nhỏ..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 resize-none"
        />
        <div className="mt-5 flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">Hủy bỏ</Button>
          <Button onClick={onConfirm} disabled={isSubmitting || !trimmedReason} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white border-0">
            {isSubmitting ? 'Đang gửi...' : 'Từ chối & gửi email'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function extractYouTubeId(url: string | null) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

function parseTimestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE}/auth/me`, { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
  if (!response.ok) throw new Error('Không thể tải thông tin người dùng');
  return response.json();
}

export default function VideoWorkspace() {
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get('id');
  const youtubeUrl = params.get('url');

  const [script, setScript] = useState<ScriptLine[]>([]);
  const [vocabList, setVocabList] = useState<any[]>([]); 
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [loopCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  
  const [showVocabList, setShowVocabList] = useState(true);
  
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedVocabData, setSelectedVocabData] = useState<any | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  
  const [videoTitle, setVideoTitle] = useState('');
  const [currentYoutubeUrl, setCurrentYoutubeUrl] = useState(youtubeUrl || '');
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('pending');
  const [jlptLevel, setJlptLevel] = useState<string>('Unknown');
  const [viewsCount, setViewsCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  const [enablePopupQuiz, setEnablePopupQuiz] = useState(false);
  const [activePopupQuestion, setActivePopupQuestion] = useState<QuizQuestion | null>(null);
  const [shownPopups, setShownPopups] = useState<Set<string>>(new Set());

  // ... các state cũ
  const [activeTab, setActiveTab] = useState("shadowing"); // Khai báo tab mặc định

  const playerRef = useRef<any>(null);
  const hasCountedViewRef = useRef(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const isAdmin = currentUser?.role === 'admin';
  const showReviewBar = Boolean(videoId) && isAdmin;

  const { data: existingQuiz } = useQuery<QuizData | null>({
    queryKey: ['video-quiz', videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const res = await fetch(`${API_BASE}/quiz/${videoId}`, {
        headers: { ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) }
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Lỗi tải quiz');
      return res.json();
    },
    enabled: !!videoId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: VideoStatus; reason?: string }) => {
      if (!videoId) throw new Error('Thiếu mã video');
      return fetch(`${API_BASE}/admin/videos/${videoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, reason }),
      }).then(async response => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || 'Không thể cập nhật trạng thái');
        return data;
      });
    },
    onSuccess: (_data, variables) => {
      const { status } = variables;
      setVideoStatus(status);
      if (status === 'rejected') {
        setRejectDialogOpen(false);
        setRejectReason('');
      }
      toast.success(`Đã cập nhật trạng thái: ${STATUS_OPTIONS[status].label}`);
      queryClient.invalidateQueries({ queryKey: ['community-videos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || 'Không thể cập nhật trạng thái video');
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!videoId) throw new Error('Thiếu mã video');
      const response = await fetch(`${API_BASE}/video/like/${videoId}`, {
        method: 'POST',
        headers: { ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || data?.message || 'Không thể thích video');
      return data as { likes_count?: number; alreadyLiked?: boolean };
    },
    onMutate: async () => {
      const previousLikes = likesCount; const previousLikedByMe = likedByMe;
      setLikesCount((prev) => prev + 1); setLikedByMe(true);
      return { previousLikes, previousLikedByMe };
    },
    onSuccess: (data) => {
      if (typeof data.likes_count === 'number') setLikesCount(data.likes_count);
      if (data.alreadyLiked) setLikedByMe(true);
      toast.success(data.alreadyLiked ? 'Video đã được like rồi' : 'Đã like video');
    },
    onError: (error: Error, _v, context) => {
      if (typeof context?.previousLikes === 'number') setLikesCount(context.previousLikes);
      if (typeof context?.previousLikedByMe === 'boolean') setLikedByMe(context.previousLikedByMe);
      toast.error(error.message || 'Không thể thích video');
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      if (!videoId) throw new Error('Thiếu mã video');
      const response = await fetch(`${API_BASE}/video/unlike/${videoId}`, {
        method: 'POST',
        headers: { ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || data?.message || 'Không thể bỏ thích video');
      return data as { likes_count?: number; alreadyUnliked?: boolean };
    },
    onMutate: async () => {
      const previousLikes = likesCount; const previousLikedByMe = likedByMe;
      setLikesCount((prev) => Math.max(0, prev - 1)); setLikedByMe(false);
      return { previousLikes, previousLikedByMe };
    },
    onSuccess: (data) => {
      if (typeof data.likes_count === 'number') setLikesCount(data.likes_count);
      if (data.alreadyUnliked) setLikedByMe(false);
      toast.success(data.alreadyUnliked ? 'Video chưa được thích trước đó' : 'Đã bỏ thích video');
    },
    onError: (error: Error, _v, context) => {
      if (typeof context?.previousLikes === 'number') setLikesCount(context.previousLikes);
      if (typeof context?.previousLikedByMe === 'boolean') setLikedByMe(context.previousLikedByMe);
      toast.error(error.message || 'Không thể bỏ thích video');
    },
  });

  useEffect(() => {
    if (videoId) {
      setIsCheckingAccess(true);
      hasCountedViewRef.current = sessionStorage.getItem(`video-view-counted:${videoId}`) === '1';
      fetch(`http://localhost:5000/api/video/detail/${videoId}`, { credentials: 'include' })
        .then(async res => {
          const video = await res.json().catch(() => null);
          if (!res.ok) {
            const statusMessage = res.status === 401 ? 'Bạn cần đăng nhập để xem video này' : res.status === 403 ? 'Video chưa được duyệt nên chỉ admin hoặc người tạo mới được xem' : video?.error || 'Không thể tải video này';
            throw new Error(statusMessage);
          }
          if (video && !video.error) {
            setScript(video.script || []);
            setVocabList(video.vocab_list || []); 
            setVideoTitle(video.title || '');
            setCurrentYoutubeUrl(video.youtube_url || '');
            setVideoStatus(video.status || 'pending');
            setJlptLevel(video.jlpt_level || 'Unknown');
            setViewsCount(video.views_count || 0);
            setLikesCount(video.likes_count || 0);
            setLikedByMe(Boolean(video.likedByMe));
            setLoadError(null);
          }
        })
        .catch(err => {
          console.error(err);
          setLoadError(err instanceof Error ? err.message : 'Lỗi khi tải kịch bản từ máy chủ');
        })
        .finally(() => setIsCheckingAccess(false));
    }
  }, [videoId]);

  const ytId = extractYouTubeId(currentYoutubeUrl);

  useEffect(() => {
    let interval: number;
    if (isPlaying && playerRef.current && script.length > 0) {
      interval = window.setInterval(async () => {
        try {
          const currentTime = await playerRef.current.getCurrentTime();
          
          let foundIndex = -1;
          for (let i = 0; i < script.length; i++) {
            const timeSec = (script[i] as any).start !== undefined ? (script[i] as any).start : parseTimestampToSeconds(script[i].timestamp);
            if (currentTime >= timeSec - 0.1) foundIndex = i; else break;
          }
          
          if (foundIndex !== -1 && foundIndex !== currentIndex) setCurrentIndex(foundIndex);

          if (enablePopupQuiz && existingQuiz && !activePopupQuestion) {
            const popQuestion = existingQuiz.questions.find(q => {
              const triggerTime = parseTimestampToSeconds(q.timestamp) + 6;
              return currentTime >= triggerTime && currentTime <= triggerTime + 0.5;
            });
            if (popQuestion && !shownPopups.has(popQuestion.timestamp)) {
              playerRef.current.pauseVideo();
              setIsPlaying(false);
              setActivePopupQuestion(popQuestion);
              setShownPopups(prev => new Set(prev).add(popQuestion.timestamp));
            }
          }

          if (!hasCountedViewRef.current && videoId) {
            const duration = await playerRef.current.getDuration();
            if (duration > 0 && currentTime / duration >= VIDEO_VIEW_THRESHOLD) {
              hasCountedViewRef.current = true;
              sessionStorage.setItem(`video-view-counted:${videoId}`, '1');
              fetch(`http://localhost:5000/api/video/view/${videoId}`, { method: 'POST' }).then(res => res.json()).then(data => {
                if (typeof data?.views_count === 'number') setViewsCount(data.views_count);
              }).catch(() => {});
            }
          }
        } catch (e) { }
      }, 300); 
    }
    return () => clearInterval(interval);
  }, [isPlaying, script, currentIndex, enablePopupQuiz, existingQuiz, shownPopups, activePopupQuestion, videoId]);

  if (videoId && isCheckingAccess) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center text-slate-600">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
          <p className="text-sm font-medium">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (videoId && loadError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-sm text-center">
          <h2 className="text-xl font-bold text-slate-900">Không thể mở video</h2>
          <p className="mt-2 text-sm text-slate-600">{loadError}</p>
        </div>
      </div>
    );
  }

  const jumpToLine = (index: number) => {
    setCurrentIndex(index);
    if (playerRef.current && script[index]) {
      const timeSec = parseTimestampToSeconds(script[index].timestamp);
      playerRef.current.seekTo(timeSec, true);
      playerRef.current.playVideo();
    }
  };

  const generateScript = async () => {
    if (!currentYoutubeUrl) return toast.error('Vui lòng nhập link YouTube hợp lệ');
    setGenerating(true);
    toast.info('Hệ thống đang tải và phân tích audio, quá trình này có thể mất vài phút...');

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('http://localhost:5000/api/video/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ url: currentYoutubeUrl }),
        credentials: 'omit'
      });

      if (!response.ok) throw new Error('Đã có lỗi xảy ra từ máy chủ khi phân tích video.');
      const result = await response.json();
      
      const saveRes = await fetch('http://localhost:5000/api/video/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'omit',
        body: JSON.stringify({ title: result.title, youtube_url: currentYoutubeUrl, script: result.script })
      });

      const saveData = await saveRes.json();
      if (saveRes.ok && saveData.videoId) {
        setScript(saveData.script);
        setVocabList(saveData.vocab_list || []); 
        setVideoTitle(result.title);
        setJlptLevel(saveData.jlptLevel || 'Unknown');
        toast.success(`🎉 Hoàn tất! Trình độ video: ${saveData.jlptLevel || 'Đã phân tích'}`);
        queryClient.invalidateQueries({ queryKey: ['video-quiz', saveData.videoId] });
        window.history.replaceState(null, '', `?id=${saveData.videoId}`);
      } else {
        toast.error(saveData.error || saveData.message || 'Lỗi khi lưu Database');
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi phân tích video.');
    } finally {
      setGenerating(false);
    }
  };

  const currentLine = script[currentIndex] || null;

  const handleWordSelect = (word: string, pos: { x: number; y: number }, specificVocabData?: any) => {
    if (specificVocabData) {
      setSelectedVocabData(specificVocabData);
    } else {
      let vocabMatch = vocabList.find((v: any) => v.word === word || word.includes(v.word) || v.word.includes(word));
      if (!vocabMatch && script.length > 0) {
        for (const line of script) {
          const matchInLine = line.vocabulary?.find((v: any) => v.word === word || word.includes(v.word) || v.word.includes(word));
          if (matchInLine) { vocabMatch = matchInLine; break; }
        }
      }
      setSelectedVocabData(vocabMatch || null);
    }
    setSelectedWord(word);
    setPopupPos(pos);
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col p-4 md:p-6 lg:p-8 w-full mx-auto animate-in fade-in duration-500 ${showReviewBar ? 'pb-28' : ''}`}>
      {rejectDialogOpen && (
        <RejectReasonModal
          title={videoTitle || 'Video chưa đặt tên'}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          onCancel={() => { setRejectDialogOpen(false); setRejectReason(''); }}
          onConfirm={() => {
            const trimmedReason = rejectReason.trim();
            if (!trimmedReason) return toast.error('Vui lòng nhập lý do từ chối');
            updateStatusMutation.mutate({ status: 'rejected', reason: trimmedReason });
          }}
          isSubmitting={updateStatusMutation.isPending}
        />
      )}

      {activePopupQuestion && (
        <PopupQuizModal 
          question={activePopupQuestion}
          onClose={() => { setActivePopupQuestion(null); playerRef.current?.playVideo(); setIsPlaying(true); }}
          onResume={() => { setActivePopupQuestion(null); playerRef.current?.playVideo(); setIsPlaying(true); }}
        />
      )}

      <Tabs defaultValue="shadowing" value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1">
        <div className="flex justify-center mb-6 lg:mb-8 shrink-0 overflow-x-auto pb-2">
          <TabsList className="bg-white border border-slate-200 shadow-sm p-1.5 rounded-2xl h-auto flex-nowrap min-w-max">
            <TabsTrigger value="shadowing" className="rounded-xl px-6 py-2.5 font-semibold text-slate-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <Mic className="w-4 h-4" /> Luyện Shadowing
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="rounded-xl px-6 py-2.5 font-semibold text-slate-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Từ vựng & Kanji
            </TabsTrigger>
            <TabsTrigger value="karaoke" className="rounded-xl px-6 py-2.5 font-semibold text-slate-600 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <Mic2 className="w-4 h-4" /> Hát Karaoke
            </TabsTrigger>
            <TabsTrigger value="quiz" className="rounded-xl px-6 py-2.5 font-semibold text-slate-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <Brain className="w-4 h-4" /> Làm Quiz
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent 
          value="shadowing" 
          forceMount={true}
          className={
            activeTab === "shadowing" 
              ? "flex-1 flex flex-col xl:flex-row gap-6 lg:gap-8 m-0 p-0 outline-hidden" 
              : "!block fixed -top-[9999px] -left-[9999px] opacity-0 pointer-events-none w-0 h-0 overflow-hidden"
          }
        >
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <div className={`bg-white p-3 md:p-4 rounded-[2rem] border border-slate-200 shadow-sm shrink-0 ${activeTab === 'karaoke' ? 'hidden' : 'block'}`}>
              <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-inner relative group aspect-video">
                {ytId ? (
                  <YouTube
                    videoId={ytId}
                    className="w-full h-full border-0 absolute inset-0"
                    iframeClassName="w-full h-full"
                    opts={{ playerVars: { autoplay: 0, controls: 1, playsinline: 1, enablejsapi: 1, rel: 0, origin: window.location.origin } }}
                    onReady={(event: any) => { playerRef.current = event.target; }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnd={() => setIsPlaying(false)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200">
                    <Youtube className="w-16 h-16 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">Chưa có video. Vui lòng dán link YouTube.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {script.length === 0 ? (
                  <Button onClick={generateScript} disabled={generating || !ytId} className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-sm rounded-xl px-5">
                    {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {generating ? 'Đang phân tích AI...' : 'Tạo Script AI'}
                  </Button>
                ) : existingQuiz ? (
                  <Button 
                    variant={enablePopupQuiz ? 'default' : 'outline'}
                    onClick={() => {
                      setEnablePopupQuiz(!enablePopupQuiz);
                      if (!enablePopupQuiz) toast.success('Đã BẬT tính năng Pop-up Quiz khi xem video!');
                      else toast.info('Đã TẮT tính năng Pop-up Quiz.');
                    }}
                    className={`rounded-xl px-5 shadow-sm transition-all duration-300 ${enablePopupQuiz ? 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  >
                    <BrainCircuit className={`w-4 h-4 mr-2 ${enablePopupQuiz ? 'animate-pulse' : ''}`} />
                    {enablePopupQuiz ? 'Đang Bật Pop-up Quiz' : 'Bật Pop-up Quiz'}
                  </Button>
                ) : null}
                <Button variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl px-5" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Đã copy link bài học!'); }}>
                  <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
                </Button>
              </div>
              <div className="flex-1 min-w-50 text-left sm:text-right w-full sm:w-auto">
                {videoTitle ? (
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <h2 className="text-slate-800 font-bold truncate text-lg" title={videoTitle}>{videoTitle}</h2>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {videoId && (
                        <Badge variant="outline" className={`font-bold px-3 py-1.5 shadow-sm ${JLPT_COLORS[jlptLevel] || JLPT_COLORS['Unknown']}`}>
                          {jlptLevel.startsWith('N') ? jlptLevel : `Level ${jlptLevel}`}
                        </Badge>
                      )}
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">
                        <Eye className="w-4 h-4 text-slate-500" />
                        <span>{viewsCount.toLocaleString()} lượt xem</span>
                      </div>
                      <Button
                        type="button" variant="outline" size="sm" disabled={!videoId || likeMutation.isPending || unlikeMutation.isPending}
                        onClick={() => (likedByMe ? unlikeMutation.mutate() : likeMutation.mutate())}
                        className={`h-9 rounded-full border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 ${likedByMe ? 'opacity-90' : ''}`}
                      >
                        {likeMutation.isPending || unlikeMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Heart className={`mr-1.5 h-4 w-4 ${likedByMe ? 'fill-rose-600 text-rose-600' : ''}`} />}
                        {likedByMe ? `Bỏ thích (${likesCount.toLocaleString()})` : likesCount.toLocaleString()}
                      </Button>
                      {videoId && (
                        <Badge variant="outline" className={`font-semibold ${STATUS_OPTIONS[videoStatus].className}`}>
                          {STATUS_OPTIONS[videoStatus].label}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : <span className="text-slate-400 text-sm italic">Video Workspace</span>}
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-40 relative">
              <div className="flex-1 p-0 relative z-10">
                <SubtitleOverlay currentLine={currentLine} onWordSelect={handleWordSelect} />
              </div>
              <div className="bg-slate-50/80 border-t border-slate-100 p-2 relative z-20 backdrop-blur-sm">
                <PlayerControls
                  isPlaying={isPlaying} isLooping={isLooping} loopCount={loopCount}
                  onTogglePlay={() => {
                    if (playerRef.current) { isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo(); } 
                    else { setIsPlaying(!isPlaying); }
                  }}
                  onToggleLoop={() => setIsLooping(!isLooping)}
                  onPrevLine={() => jumpToLine(Math.max(0, currentIndex - 1))}
                  onNextLine={() => jumpToLine(Math.min(script.length - 1, currentIndex + 1))}
                />
              </div>
            </div>
          </div>

          <div className="w-full xl:w-100 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm overscroll-contain overflow-hidden shrink-0 h-[500px] xl:h-[850px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg tracking-tight">Kịch bản học tập</h3>
              </div>
              
              <div className="flex items-center gap-3">
                {script.length > 0 && (
                  <Button 
                    variant="outline" size="sm" className="h-8 rounded-full border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                    onClick={() => setShowVocabList(!showVocabList)}
                  >
                    {showVocabList ? <><EyeOff className="w-3.5 h-3.5 mr-1.5" /> Ẩn từ vựng</> : <><Eye className="w-3.5 h-3.5 mr-1.5" /> Hiện từ vựng</>}
                  </Button>
                )}
                {script.length > 0 && <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 shadow-xs font-semibold">{script.length} câu</Badge>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
              {script.length > 0 ? (
                <ScriptPanel 
                  script={script} 
                  currentIndex={currentIndex} 
                  onLineClick={(index) => jumpToLine(index)} 
                  onWordSelect={handleWordSelect} 
                  showVocabList={showVocabList} 
                  vocabList={vocabList}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-emerald-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Bấm <b>"Tạo Script AI"</b> để hệ thống tự động bóc băng video này thành bài học chi tiết.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ✨ TAB TỪ VỰNG KÈM KANJI ĐƯỢC CHUYỂN QUA COMPONENT MỚI */}
        <TabsContent value="vocabulary" className="flex-1 m-0 p-0 outline-hidden">
          <VocabularyTab vocabList={vocabList} />
        </TabsContent>

        {/* TAB KARAOKE MỚI */}
        <TabsContent value="karaoke" className="flex-1 m-0 p-0 outline-hidden">
          <KaraokeMode 
            script={script}
            vocabList={vocabList}
            currentIndex={currentIndex}
            playerRef={playerRef}
            isPlaying={isPlaying}
            onTogglePlay={() => {
              if (playerRef.current) { 
                isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo(); 
              } 
              else { setIsPlaying(!isPlaying); }
            }}
            onJumpToTime={jumpToLine}
          />
        </TabsContent>

        <TabsContent value="quiz" className="flex-1 m-0 p-0 outline-hidden">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full min-h-[500px]">
            <QuizPage videoId={videoId} script={script} ytId={ytId} onJumpToTime={jumpToLine} />
          </div>
        </TabsContent>
      </Tabs>

      {selectedWord && popupPos && (
        <VocabularyPopup
          word={selectedWord}
          position={popupPos}
          vocabData={selectedVocabData}
          onClose={() => { setSelectedWord(null); setSelectedVocabData(null); }}
          onSave={() => { 
            toast.success(`Đã lưu "${selectedWord}" vào sổ tay!`);
            setSelectedWord(null); 
            setSelectedVocabData(null); 
          }}
        />
      )}

      <VideoRagChatWidget videoId={videoId} bottomOffsetClassName={showReviewBar ? 'bottom-24 md:bottom-28' : 'bottom-4 md:bottom-6'} />

      {showReviewBar && videoId && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-12px_30px_rgba(15,23,42,0.12)]">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Thanh task bar đánh giá</p>
                <p className="text-xs text-slate-500">Cập nhật trạng thái video ngay trong Video Workspace.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_OPTIONS) as VideoStatus[]).map(status => {
                  const option = STATUS_OPTIONS[status];
                  const isActive = videoStatus === status;
                  const handleStatusClick = () => {
                    if (status === 'rejected') {
                      setRejectReason('');
                      setRejectDialogOpen(true);
                      return;
                    }
                    updateStatusMutation.mutate({ status });
                  };
                  return (
                    <Button
                      key={status} type="button" variant="outline" disabled={updateStatusMutation.isPending} onClick={handleStatusClick}
                      className={`rounded-full px-4 ${option.className} ${isActive ? 'ring-2 ring-offset-2 ring-slate-300' : ''}`}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}