import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import YouTubeOrigin from 'react-youtube';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const YouTube = (YouTubeOrigin as any).default || YouTubeOrigin;
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Loader2, Sparkles, Share2, Youtube, Mic, Brain, Eye, 
  EyeOff, Heart, AlertTriangle, BrainCircuit, PlayCircle, X, BookOpen , Mic2
} from 'lucide-react'; 
import { toast } from 'sonner';


import ScriptPanel, { type ScriptLine } from '../components/video/ScriptPanel'; // box hiển thị script bên phải

import SubtitleOverlay from '../components/video/SubtitleOverlay'; // phụ đề

import VocabularyPopup from '../components/video/VocabularyPopup'; //popup từ vựng khi click vào từ trong subtitle
import VideoRagChatWidget from '../components/video/VideoRagChatWidget'; // chat rag
import { usePlayerStore } from '@/stores/usePlayerStore';


//Tabs
import QuizPage from './QuizPage';
import KaraokeMode from '../components/video/KaraokeMode';
import VocabularyTab from '../components/video/VocabularyTab';
import { ApiError } from '@/api/client';
import { adminApi } from '@/api/admin.api';
import { authApi } from '@/api/auth.api';
import { quizApi } from '@/api/quiz.api';
import { videoApi } from '@/api/video.api';

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

type PopupAnchorPosition = {
  x: number;
  y: number;
  anchorTop?: number;
  anchorBottom?: number;
  anchorLeft?: number;
  anchorRight?: number;
};

const VIDEO_VIEW_THRESHOLD = 0.1;
const pillBase =
  "h-9 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-0 text-sm font-semibold leading-none whitespace-nowrap";


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
  return authApi.getMe<CurrentUser>();
}

export default function VideoWorkspace() {
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get('id');
  const youtubeUrl = params.get('url');
  const resumeTimeParam = Number(params.get('t') || 0);
  const routeResumeTime = Number.isFinite(resumeTimeParam) && resumeTimeParam > 0
    ? resumeTimeParam
    : 0;

  const [script, setScript] = useState<ScriptLine[]>([]);
  const [vocabList, setVocabList] = useState<any[]>([]); 
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [showVocabList, setShowVocabList] = useState(true);
  const [showFurigana, setShowFurigana] = useState(true);
  
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedVocabData, setSelectedVocabData] = useState<any | null>(null);
  const [popupPos, setPopupPos] = useState<PopupAnchorPosition | null>(null);
  
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
  const {
    isPlaying: globalIsPlaying,
    currentTime: globalCurrentTime,
    setCurrentVideo,
    setIsPlaying: setGlobalIsPlaying,
    setPlaybackPosition,
    setProgress: setGlobalProgress,
  } = usePlayerStore();

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
      return quizApi.getQuizByVideoId<QuizData>(videoId);
    },
    enabled: !!videoId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: VideoStatus; reason?: string }) => {
      if (!videoId) throw new Error('Thiếu mã video');
      return adminApi.updateVideoStatus(videoId, { status, reason });
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
      return videoApi.likeVideo<{ likes_count?: number; alreadyLiked?: boolean }>(videoId);
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
      return videoApi.unlikeVideo<{ likes_count?: number; alreadyUnliked?: boolean }>(videoId);
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

  
  // RESIZE BAR
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [scriptPanelWidth, setScriptPanelWidth] = useState(() => {
    if (typeof window === 'undefined') return 400;

    const savedWidth = Number(localStorage.getItem('video-workspace-script-panel-width'));
    return Number.isFinite(savedWidth) && savedWidth >= 320 ? savedWidth : 400;
  });
  useEffect(() => {
    if (videoId) {
      setIsCheckingAccess(true);
      hasCountedViewRef.current = sessionStorage.getItem(`video-view-counted:${videoId}`) === '1';
      videoApi.getVideoDetail<any>(videoId)
        .then(video => {
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
          const statusMessage =
            err instanceof ApiError && err.status === 401
              ? 'Bạn cần đăng nhập để xem video này'
              : err instanceof ApiError && err.status === 403
                ? 'Video chưa được duyệt nên chỉ admin hoặc người tạo mới được xem'
                : err instanceof Error
                  ? err.message
                  : 'Lỗi khi tải kịch bản từ máy chủ';
          setLoadError(statusMessage);
        })
        .finally(() => setIsCheckingAccess(false));
    }
  }, [videoId]);


  
  //furigana
  const [currentFurigana, setCurrentFurigana] = useState<string>('');
  const furiganaCache = useRef<Record<string, string>>({});
  const furiganaPending = useRef<Record<string, Promise<string>>>({});
  const activeFuriganaText = useRef('');

  const fetchFurigana = useCallback((rawText: string) => {
    const text = rawText.trim();

    if (!text) {
      return Promise.resolve('');
    }

    if (furiganaCache.current[text]) {
      return Promise.resolve(furiganaCache.current[text]);
    }

    if (!furiganaPending.current[text]) {
      furiganaPending.current[text] = videoApi.createFuriganaLine<{ html?: string }>(text)
        .then(data => {
          const html = typeof data.html === 'string' ? data.html : '';

          if (html) {
            furiganaCache.current[text] = html;
          }

          return html;
        })
        .catch(err => {
          console.error("Lá»—i láº¥y Furigana:", err);
          return '';
        })
        .finally(() => {
          delete furiganaPending.current[text];
        });
    }

    return furiganaPending.current[text];
  }, []);
  // Đặt useEffect này bên dưới mấy cái useEffect cũ
  useEffect(() => {
    const activeLineText = script[currentIndex]?.japanese?.trim() || '';
    activeFuriganaText.current = activeLineText;
    
    if (!activeLineText) {
      setCurrentFurigana('');
      return;
    }

    // Nếu đã dịch câu này rồi thì lôi trong Cache ra xài
    if (furiganaCache.current[activeLineText]) {
      setCurrentFurigana(furiganaCache.current[activeLineText]);
      return;
    } else {
      setCurrentFurigana('');
    }

    // Chưa có thì gọi API dịch đúng 1 câu này
    void fetchFurigana(activeLineText).then(html => {
      if (activeLineText === activeFuriganaText.current) {
        setCurrentFurigana(html);
      }
    });
  }, [currentIndex, fetchFurigana, script]); // Chỉ chạy lại khi nhảy sang câu mới

  useEffect(() => {
    const upcomingTexts = [currentIndex + 1, currentIndex + 2]
      .map(index => script[index]?.japanese?.trim() || '')
      .filter(Boolean);

    upcomingTexts.forEach(text => {
      void fetchFurigana(text);
    });
  }, [currentIndex, fetchFurigana, script]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      const container = workspaceRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const minVideoWidth = 520;
      const minScriptWidth = 320;
      const maxScriptWidth = 620;

      const rawScriptWidth = rect.right - event.clientX;
      const maxAllowedScriptWidth = Math.min(
        maxScriptWidth,
        Math.max(minScriptWidth, rect.width - minVideoWidth)
      );

      const nextWidth = Math.max(
        minScriptWidth,
        Math.min(rawScriptWidth, maxAllowedScriptWidth)
      );

      setScriptPanelWidth(Math.round(nextWidth));
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isResizing]);

  useEffect(() => {
    localStorage.setItem(
      'video-workspace-script-panel-width',
      String(scriptPanelWidth)
    );
  }, [scriptPanelWidth]);

  const ytId = extractYouTubeId(currentYoutubeUrl);

  useEffect(() => {
    if (!currentYoutubeUrl || !ytId) return;

    const playerVideoId = videoId || ytId;
    const workspacePath = videoId
      ? `/VideoWorkspace?id=${videoId}`
      : `/VideoWorkspace?url=${encodeURIComponent(currentYoutubeUrl)}`;

    setCurrentVideo({
      id: playerVideoId,
      title: videoTitle || 'Anime đang phát',
      youtubeUrl: currentYoutubeUrl,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      workspacePath,
    });
  }, [currentYoutubeUrl, setCurrentVideo, videoId, videoTitle, ytId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !ytId || globalIsPlaying === isPlaying) return;

    if (globalIsPlaying) {
      player.playVideo?.();
    } else {
      player.pauseVideo?.();
    }
  }, [globalIsPlaying, isPlaying, ytId]);

  useEffect(() => {
    if (activeTab !== 'shadowing' || !playerRef.current) return;

    window.requestAnimationFrame(async () => {
      try {
        const currentTime = await playerRef.current.getCurrentTime?.();
        if (typeof currentTime === 'number') {
          playerRef.current.seekTo?.(currentTime, true);
          setPlaybackPosition(currentTime);
        }

        if (isPlaying) {
          playerRef.current.playVideo?.();
        }
      } catch {
        // YouTube iframe sometimes needs a tick to redraw after being offscreen.
      }
    });
  }, [activeTab, isPlaying, setPlaybackPosition]);

  useEffect(() => {
    let interval: number;
    if (isPlaying && playerRef.current) {
      interval = window.setInterval(async () => {
        try {
          const currentTime = await playerRef.current.getCurrentTime();
          const duration = await playerRef.current.getDuration();
          setPlaybackPosition(currentTime, duration);
          
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
            if (duration > 0 && currentTime / duration >= VIDEO_VIEW_THRESHOLD) {
              hasCountedViewRef.current = true;
              sessionStorage.setItem(`video-view-counted:${videoId}`, '1');
              videoApi.countView<{ views_count?: number }>(videoId).then(data => {
                if (typeof data?.views_count === 'number') setViewsCount(data.views_count);
              }).catch(() => {});
            }
          }
        } catch (e) { }
      }, 300); 
    }
    return () => clearInterval(interval);
  }, [isPlaying, script, currentIndex, enablePopupQuiz, existingQuiz, shownPopups, activePopupQuestion, videoId, setPlaybackPosition]);

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
      setPlaybackPosition(timeSec);
      setGlobalIsPlaying(true);
    }
  };

  const generateScript = async () => {
    if (isAdmin) return toast.error('Admin không được đăng video');
    if (!currentYoutubeUrl) return toast.error('Vui lòng nhập link YouTube hợp lệ');
    setGenerating(true);
    toast.info('Hệ thống đang tải và phân tích audio, quá trình này có thể mất vài phút...');

    try {
      const result = await videoApi.analyzeVideo<{ title: string; script: ScriptLine[] }>({
        url: currentYoutubeUrl,
      });
      
      const saveData = await videoApi.saveVideo<{
        videoId?: string;
        script: ScriptLine[];
        vocab_list?: any[];
        jlptLevel?: string;
        error?: string;
        message?: string;
      }>({ title: result.title, youtube_url: currentYoutubeUrl, script: result.script });

      if (saveData.videoId) {
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
  const visibleFurigana = showFurigana ? currentFurigana : '';

  const handleWordSelect = (word: string, pos: PopupAnchorPosition, specificVocabData?: any) => {
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
    <div className={`min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col md:p-2 w-full mx-auto animate-in fade-in duration-500 ${showReviewBar ? 'pb-28' : ''}`}>
      {isResizing && (
        <div className="fixed inset-0 z-[9999] cursor-col-resize select-none" />
      )}

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
        <div className="flex justify-center shrink-0 overflow-x-auto">
          <TabsList className="bg-white border border-slate-300 shadow-sm p-1.5 rounded-2xl h-auto flex-nowrap min-w-max">
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
              ? "flex-1 m-0 p-0 outline-hidden min-h-0"
              : "!block fixed -top-[9999px] -left-[9999px] w-[720px] h-[405px] opacity-0 pointer-events-none overflow-hidden"
          }
        >
          <div
            ref={workspaceRef}
            className="flex h-full min-h-0 w-full flex-col xl:flex-row gap-3 xl:gap-0"
          >
            <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div
              className={`
                bg-white rounded-[1.5rem] border border-slate-200 shadow-sm shrink-0
              `}
            >
              {/*
                Outer video box:
                - w-full: ăn theo chiều rộng layout
                - aspect-video: khi màn hình hẹp thì video box co chéo theo 16:9
                - max-h: giới hạn chiều cao tối đa
                - bg-black: khi màn hình quá rộng, 2 bên sẽ là khoảng đen
              */}
              <div
                className="
                  relative group
                  w-full aspect-video
                  max-h-[260px] lg:max-h-[340px] 2xl:max-h-[420px]
                  mx-auto
                  overflow-hidden rounded-xl
                  bg-black shadow-inner
                  flex items-center justify-center
                "
              >
                {/*
                  Inner video frame:
                  - giữ video thật đúng tỉ lệ 16:9
                  - khi outer box quá rộng, inner frame không phình nữa
                  - phần dư hai bên sẽ là nền đen của outer box
                */}
                <div
                  className="
                    relative h-full w-full
                    max-w-[462px] lg:max-w-[604px] 2xl:max-w-[747px]
                  "
                >
                  {ytId ? (
                    <YouTube
                      videoId={ytId}
                      className="absolute inset-0 w-full h-full border-0"
                      iframeClassName="w-full h-full"
                      opts={{
                        playerVars: {
                          autoplay: 0,
                          controls: 1,
                          playsinline: 1,
                          enablejsapi: 1,
                          rel: 0,
                          origin: window.location.origin,
                        },
                      }}
                      onReady={(event: any) => {
                        playerRef.current = event.target;
                        const resumeTime = routeResumeTime || globalCurrentTime;

                        if (resumeTime > 0) {
                          event.target.seekTo?.(resumeTime, true);
                          setPlaybackPosition(resumeTime);
                        }

                        if (globalIsPlaying) {
                          event.target.playVideo?.();
                        }
                      }}
                      onPlay={() => {
                        setIsPlaying(true);
                        setGlobalIsPlaying(true);
                      }}
                      onPause={() => {
                        setIsPlaying(false);
                        setGlobalIsPlaying(false);
                      }}
                      onEnd={() => {
                        setIsPlaying(false);
                        setGlobalIsPlaying(false);
                        setGlobalProgress(100);
                      }}
                    />
                  ) : (
                    <div
                      className="
                        w-full h-full
                        flex flex-col items-center justify-center
                        bg-slate-50 border-2 border-dashed border-slate-200
                      "
                    >
                      <Youtube className="w-16 h-16 text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium">
                        {isAdmin ? 'Admin chỉ có thể mở video đã có để kiểm duyệt.' : 'Chưa có video. Vui lòng dán link YouTube.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            
            <div className="bg-white rounded-[0.5rem] border border-slate-300 shadow-sm overflow-hidden flex flex-col relative">
              <div className="flex-1 p-0 relative z-10">
                <SubtitleOverlay currentLine={currentLine} currentFurigana={visibleFurigana} onWordSelect={handleWordSelect} />
              </div>
              {/* <div className="bg-slate-50/80 border-t border-slate-100 p-2 relative z-20 backdrop-blur-sm">
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
              </div> */}
            </div>
            <div className="bg-white rounded-[0.75rem] border border-slate-300 p-4 shadow-sm flex flex-col gap-3">
              {/* Title */}
              <div className="min-w-0">
                {videoTitle ? (
                  <h2
                    className="
                      max-w-full
                      truncate
                      text-base md:text-lg
                      font-bold
                      text-slate-800
                      leading-tight
                    "
                    title={videoTitle}
                  >
                    {videoTitle}
                  </h2>
                ) : (
                  <span className="text-slate-400 text-sm italic">
                    Video Workspace
                  </span>
                )}
              </div>

              {/* Actions + Metadata */}
              <div className="flex flex-wrap items-center gap-2">
                {script.length === 0 ? (
                  isAdmin ? (
                    <div
                      className={`
                        ${pillBase}
                        min-w-[204px]
                        border border-amber-200
                        bg-amber-50
                        text-amber-700
                      `}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span className="truncate">Admin không được đăng video</span>
                    </div>
                  ) : (
                  <Button
                    onClick={generateScript}
                    disabled={generating || !ytId}
                    className={`
                      ${pillBase}
                      min-w-[132px]
                      bg-linear-to-r from-emerald-500 to-teal-600
                      text-white
                      hover:opacity-90
                      shadow-sm
                      border-0
                    `}
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 shrink-0" />
                    )}
                    <span className="truncate">
                      {generating ? 'Đang phân tích...' : 'Tạo Script AI'}
                    </span>
                  </Button>
                  )
                ) : existingQuiz ? (
                  <Button
                    type="button"
                    variant={enablePopupQuiz ? 'default' : 'outline'}
                    onClick={() => {
                      setEnablePopupQuiz(!enablePopupQuiz);
                      if (!enablePopupQuiz) toast.success('Đã BẬT tính năng Pop-up Quiz khi xem video!');
                      else toast.info('Đã TẮT tính năng Pop-up Quiz.');
                    }}
                    className={`
                      ${pillBase}
                      min-w-[132px]
                      transition-all duration-200
                      ${
                        enablePopupQuiz
                          ? 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200'
                      }
                    `}
                  >
                    <BrainCircuit
                      className={`
                        w-4 h-4 shrink-0
                        ${enablePopupQuiz ? 'animate-pulse' : ''}
                      `}
                    />
                    <span className="truncate">
                      {enablePopupQuiz ? 'Pop-up Quiz bật' : 'Bật Quiz'}
                    </span>
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Đã copy link bài học!');
                  }}
                  className={`
                    ${pillBase}
                    min-w-[92px]
                    bg-white
                    text-slate-600
                    border-slate-200
                    hover:bg-slate-50
                    hover:text-teal-700
                    hover:border-teal-200
                  `}
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>Chia sẻ</span>
                </Button>

                {videoId && (
                  <Badge
                    variant="outline"
                    className={`
                      ${pillBase}
                      min-w-[72px]
                      shadow-sm
                      ${JLPT_COLORS[jlptLevel] || JLPT_COLORS['Unknown']}
                    `}
                  >
                    {jlptLevel.startsWith('N') ? jlptLevel : `Level ${jlptLevel}`}
                  </Badge>
                )}

                <div
                  className={`
                    ${pillBase}
                    min-w-[120px]
                    border border-slate-200
                    bg-slate-50
                    text-slate-600
                  `}
                >
                  <Eye className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>{viewsCount.toLocaleString()} lượt xem</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!videoId || likeMutation.isPending || unlikeMutation.isPending}
                  onClick={() => (likedByMe ? unlikeMutation.mutate() : likeMutation.mutate())}
                  className={`
                    ${pillBase}
                    min-w-[96px]
                    border-rose-200
                    bg-white
                    text-rose-600
                    hover:bg-rose-50
                    hover:text-rose-700
                    ${likedByMe ? 'opacity-90' : ''}
                  `}
                >
                  {likeMutation.isPending || unlikeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                  ) : (
                    <Heart
                      className={`
                        w-4 h-4 shrink-0
                        ${likedByMe ? 'fill-rose-600 text-rose-600' : ''}
                      `}
                    />
                  )}

                  <span>
                    {likedByMe
                      ? `Bỏ thích (${likesCount.toLocaleString()})`
                      : likesCount.toLocaleString()}
                  </span>
                </Button>

                {videoId && (
                  <Badge
                    variant="outline"
                    className={`
                      ${pillBase}
                      min-w-[96px]
                      ${STATUS_OPTIONS[videoStatus].className}
                    `}
                  >
                    {STATUS_OPTIONS[videoStatus].label}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize video and script panel"
            title="Kéo để thay đổi kích thước video và phụ đề. Double click để reset."
            onPointerDown={(event) => {
              event.preventDefault();
              setIsResizing(true);
            }}
            onDoubleClick={() => setScriptPanelWidth(400)}
            className="hidden xl:flex w-4 shrink-0 cursor-col-resize touch-none items-stretch justify-center group z-20"
          >
            <div
              className={`
                my-2 w-1 rounded-full transition-all duration-150
                ${isResizing ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'bg-slate-200 group-hover:bg-emerald-400'}
              `}
            />
          </div>


          <div
            className="
              w-full xl:w-[var(--script-panel-width)]
              flex flex-col
              rounded-[1rem]
              border border-indigo-500/40
              bg-[#0f172a]
              shadow-lg shadow-indigo-950/20
              overscroll-contain overflow-hidden shrink-0
              h-[500px] xl:h-[850px]
            "
            style={{ '--script-panel-width': `${scriptPanelWidth}px` } as CSSProperties}
          >
            <div
              className="
                px-5 py-2.5
                border-b border-indigo-500/30
                bg-[#111827]
                flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
              "
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
                  <BookOpen className="w-4 h-4" />
                </div>

                <div className="py-1">
                  <h3 className="font-bold text-slate-100 text-lg tracking-tight">
                    Phụ đề
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {script.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="
                      h-8 rounded-full
                      border-indigo-400/30
                      bg-indigo-500/10
                      text-indigo-200
                      hover:bg-indigo-500/20
                      hover:text-white
                      hover:border-indigo-300/50
                      transition-colors
                    "
                    onClick={() => setShowVocabList(!showVocabList)}
                  >
                    {showVocabList ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                        Ẩn từ vựng
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Hiện từ vựng
                      </>
                    )}
                  </Button>
                )}

                {script.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="
                      h-8 rounded-full
                      border-cyan-400/30
                      bg-cyan-500/10
                      text-cyan-200
                      hover:bg-cyan-500/20
                      hover:text-white
                      hover:border-cyan-300/50
                      transition-colors
                    "
                    onClick={() => setShowFurigana(!showFurigana)}
                  >
                    {showFurigana ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                        Ẩn furigana
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Hiện furigana
                      </>
                    )}
                  </Button>
                )}

                {script.length > 0 && (
                  <Badge
                    variant="outline"
                    className="
                      bg-amber-400/15
                      text-amber-200
                      border-amber-300/30
                      shadow-xs
                      font-semibold
                    "
                  >
                    {script.length} câu
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white/95">
              {script.length > 0 ? (
                <ScriptPanel
                  script={script}
                  currentIndex={currentIndex}
                  currentFurigana={visibleFurigana}
                  onLineClick={(index) => jumpToLine(index)}
                  onWordSelect={handleWordSelect}
                  showVocabList={showVocabList}
                  vocabList={vocabList}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-indigo-50 via-sky-50 to-cyan-50">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 border border-cyan-200 flex items-center justify-center mb-4 shadow-sm shadow-cyan-300/40">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>

                  <p className="text-slate-600 font-medium max-w-xs leading-relaxed">
                    Bấm{' '}
                    <b className="text-indigo-700 bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                      "Tạo Script AI"
                    </b>{' '}
                    để hệ thống tự động bóc băng video này thành bài học chi tiết.
                  </p>
                </div>
              )}
            </div>
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
