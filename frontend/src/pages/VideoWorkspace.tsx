import { useState, useEffect, useRef } from 'react';
import YouTubeOrigin from 'react-youtube';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const YouTube = (YouTubeOrigin as any).default || YouTubeOrigin;
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // <-- Thêm import Tabs
import { Loader2, Sparkles, Share2, Youtube, FileText, Mic, Brain } from 'lucide-react'; // <-- Thêm icon Mic, Brain
import { toast } from 'sonner';
import ScriptPanel, { type ScriptLine } from '../components/video/ScriptPanel';
import SubtitleOverlay from '../components/video/SubtitleOverlay';
import PlayerControls from '../components/video/PlayerControls';
import VocabularyPopup from '../components/video/VocabularyPopup';
import VideoRagChatWidget from '../components/video/VideoRagChatWidget';
import QuizPage from './QuizPage'; // <-- Import trang QuizPage

// 1. Định nghĩa Interfaces

type VideoStatus = 'approved' | 'rejected' | 'pending';

interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role?: 'user' | 'admin';
}

const API_BASE = 'http://localhost:5000/api';

const STATUS_OPTIONS: Record<VideoStatus, { label: string; className: string }> = {
  approved: {
    label: 'Đã chấp nhận',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  },
  rejected: {
    label: 'Chưa chấp nhận',
    className: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  },
  pending: {
    label: 'Đang xem xét',
    className: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
  },
};


function extractYouTubeId(url: string | null) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

function parseTimestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Không thể tải thông tin người dùng');
  }

  return response.json();
}

export default function VideoWorkspace() {
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get('id');
  const youtubeUrl = params.get('url');

  const [script, setScript] = useState<ScriptLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [loopCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedVocabData, setSelectedVocabData] = useState<any | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [currentYoutubeUrl, setCurrentYoutubeUrl] = useState(youtubeUrl || '');
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('pending');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  const playerRef = useRef<any>(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const isAdmin = currentUser?.role === 'admin';
  const showReviewBar = Boolean(videoId) && isAdmin;

  const updateStatusMutation = useMutation({
    mutationFn: (status: VideoStatus) => {
      if (!videoId) {
        throw new Error('Thiếu mã video');
      }

      return fetch(`${API_BASE}/admin/videos/${videoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      }).then(async response => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error || 'Không thể cập nhật trạng thái');
        }
        return data;
      });
    },
    onSuccess: (_data, status) => {
      setVideoStatus(status);
      toast.success(`Đã cập nhật trạng thái: ${STATUS_OPTIONS[status].label}`);
      queryClient.invalidateQueries({ queryKey: ['community-videos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-videos'] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || 'Không thể cập nhật trạng thái video');
    },
  });

  // 2. Tải video từ Database
  useEffect(() => {
    if (videoId) {
      setIsCheckingAccess(true);
      fetch(`http://localhost:5000/api/video/detail/${videoId}`, {
        credentials: 'include',
      })
        .then(async res => {
          const video = await res.json().catch(() => null);

          if (!res.ok) {
            const statusMessage =
              res.status === 401
                ? 'Bạn cần đăng nhập để xem video này'
                : res.status === 403
                  ? 'Video chưa được duyệt nên chỉ admin hoặc người tạo mới được xem'
                  : video?.error || 'Không thể tải video này';

            throw new Error(statusMessage);
          }

          if (video && !video.error) {
            setScript(video.script || []);
            setVideoTitle(video.title || '');
            setCurrentYoutubeUrl(video.youtube_url || '');
            setVideoStatus(video.status || 'pending');
            setLoadError(null);
          }
        })
        .catch(err => {
          console.error(err);
          setLoadError(err instanceof Error ? err.message : 'Lỗi khi tải kịch bản từ máy chủ');
        })
        .finally(() => {
          setIsCheckingAccess(false);
        });
    }
  }, [videoId]);

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
          <p className="mt-3 text-xs text-slate-500">
            Nếu đây là video chưa duyệt, chỉ admin mới được xem.
          </p>
        </div>
      </div>
    );
  }

  const ytId = extractYouTubeId(currentYoutubeUrl);

  // --- Real-time Sync Logic ---
  useEffect(() => {
    let interval: number;
    if (isPlaying && playerRef.current && script.length > 0) {
      interval = window.setInterval(async () => {
        try {
          // getCurrentTime() của youtube api
          const currentTime = await playerRef.current.getCurrentTime();

          let foundIndex = -1;
          for (let i = 0; i < script.length; i++) {
            const timeSec = parseTimestampToSeconds(script[i].timestamp);
            if (currentTime >= timeSec - 0.5) { // bù xê dịch nhẹ
              foundIndex = i;
            } else {
              break;
            }
          }

          if (foundIndex !== -1 && foundIndex !== currentIndex) {
            setCurrentIndex(foundIndex);
          }
        } catch (e) { }
      }, 500); // Check mỗi nửa giây cho nhẹ UI
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, script, currentIndex]);

  const jumpToLine = (index: number) => {
    setCurrentIndex(index);
    if (playerRef.current && script[index]) {
      const timeSec = parseTimestampToSeconds(script[index].timestamp);
      playerRef.current.seekTo(timeSec, true);
      playerRef.current.playVideo();
    }
  };

  // 3. Gọi Node API tích hợp Python chạy Model
  const generateScript = async () => {
    if (!currentYoutubeUrl) {
      toast.error('Vui lòng nhập link YouTube hợp lệ');
      return;
    }
    setGenerating(true);
    toast.info('Hệ thống đang tải và phân tích audio, quá trình này có thể mất vài phút. Vui lòng không đóng trang...');

    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('http://localhost:5000/api/video/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: currentYoutubeUrl }),
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error('Đã có lỗi xảy ra từ máy chủ khi phân tích video.');
      }

      const result = await response.json();

      setScript(result.script);
      setVideoTitle(result.title);

      // Lưu lên Mongoose

      const saveRes = await fetch('http://localhost:5000/api/video/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'omit',
        body: JSON.stringify({
          title: result.title,
          youtube_url: currentYoutubeUrl,
          jlpt_level: result.jlpt_level,
          script: result.script
        })
      });

      const saveData = await saveRes.json();

      if (saveRes.ok && saveData.videoId) {
        window.history.replaceState(null, '', `?id=${saveData.videoId}`);
        queryClient.invalidateQueries({ queryKey: ['community-videos'] });
        toast.success('Bóc băng và lưu trữ Database thành công!');
      } else {
        toast.error(saveData.error || saveData.message || 'Lỗi khi lưu Database');
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi phân tích video.');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const currentLine = script[currentIndex] || null;

  const handleWordSelect = (word: string, pos: { x: number; y: number }) => {
    // Dò xem từ người dùng bấm trùng với từ vựng đã lấy ra từ cơ sở dữ liệu (MeCab) hay không
    const vocabMatch = currentLine?.vocabulary?.find((v: any) => v.word === word || word.includes(v.word) || v.word.includes(word));

    setSelectedWord(word);
    setSelectedVocabData(vocabMatch || null);
    setPopupPos(pos);
  };


  return (
    <div className={`min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col p-4 md:p-6 lg:p-8 w-full mx-auto animate-in fade-in duration-500 ${showReviewBar ? 'pb-28' : ''}`}>

      <Tabs defaultValue="shadowing" className="w-full flex flex-col flex-1">

        {/* 🌟 THANH ĐIỀU HƯỚNG TABS (Nằm giữa, trên cùng) */}
        <div className="flex justify-center mb-6 lg:mb-8 shrink-0">
          <TabsList className="bg-white border border-slate-200 shadow-sm p-1.5 rounded-2xl h-auto">
            <TabsTrigger
              value="shadowing"
              className="rounded-xl px-6 py-2.5 font-semibold text-slate-600 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Luyện Shadowing
            </TabsTrigger>
            <TabsTrigger
              value="quiz"
              className="rounded-xl px-6 py-2.5 font-semibold text-slate-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 data-[state=active]:shadow-sm transition-all flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              Làm Quiz
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ========================================================== */}
        {/* TAB 1: KHU VỰC VIDEO WORKSPACE (SHADOWING)                   */}
        {/* ========================================================== */}
        <TabsContent value="shadowing" className="flex-1 flex flex-col xl:flex-row gap-6 lg:gap-8 m-0 p-0 outline-hidden">

          {/* CỘT TRÁI: Khu vực Video & Điều khiển */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">

            {/* Khung chứa Video */}
            <div className="bg-white p-3 md:p-4 rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
              <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-inner relative group aspect-video">
                {ytId ? (
                  <YouTube
                    videoId={ytId}
                    className="w-full h-full border-0 absolute inset-0"
                    iframeClassName="w-full h-full"
                    opts={{
                      playerVars: {
                        autoplay: 0,
                        controls: 1,
                        playsinline: 1,
                        enablejsapi: 1,
                        rel: 0
                      },
                    }}
                    onReady={(event: any) => {
                      playerRef.current = event.target;
                    }}
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

            {/* Thanh Công cụ (Action Bar) */}
            <div className="bg-white rounded-[1.5rem] border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={generateScript}
                  disabled={generating || !ytId}
                  className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-sm rounded-xl px-5"
                >
                  {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {generating ? 'Đang phân tích AI...' : 'Tạo Script AI'}
                </Button>
                <Button
                  variant="outline"
                  className="text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl px-5"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Đã copy link bài học!');
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
                </Button>
              </div>

              <div className="flex-1 min-w-50 text-left sm:text-right w-full sm:w-auto">
                {videoTitle ? (
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <h2 className="text-slate-800 font-bold truncate text-lg" title={videoTitle}>{videoTitle}</h2>
                    {videoId && (
                      <Badge variant="outline" className={`font-semibold ${STATUS_OPTIONS[videoStatus].className}`}>
                        {STATUS_OPTIONS[videoStatus].label}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 text-sm italic">Video Workspace</span>
                )}
              </div>
            </div>

            {/* Khối Phụ đề & Trình điều khiển */}
            <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-40 relative">
              <div className="flex-1 p-0 relative z-10">
                <SubtitleOverlay currentLine={currentLine} onWordSelect={handleWordSelect} />
              </div>

              <div className="bg-slate-50/80 border-t border-slate-100 p-2 relative z-20 backdrop-blur-sm">
                <PlayerControls
                  isPlaying={isPlaying}
                  isLooping={isLooping}
                  loopCount={loopCount}
                  onTogglePlay={() => {
                    if (playerRef.current) {
                      if (isPlaying) playerRef.current.pauseVideo();
                      else playerRef.current.playVideo();
                    } else {
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  onToggleLoop={() => setIsLooping(!isLooping)}
                  onPrevLine={() => jumpToLine(Math.max(0, currentIndex - 1))}
                  onNextLine={() => jumpToLine(Math.min(script.length - 1, currentIndex + 1))}
                />
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Khối Kịch Bản (Script Panel) */}
          <div className="w-full xl:w-100 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden shrink-0 h-[500px] xl:h-[850px]">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg tracking-tight">Kịch bản học tập</h3>
              </div>
              {script.length > 0 && (
                <Badge variant="outline" className="bg-white text-slate-500 border-slate-200 shadow-xs font-semibold">
                  {script.length} câu
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
              {script.length > 0 ? (
                <ScriptPanel
                  script={script}
                  currentIndex={currentIndex}
                  onLineClick={(index) => jumpToLine(index)}
                  onWordSelect={handleWordSelect}
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

        {/* ========================================================== */}
        {/* TAB 2: TRANG QUIZPAGE                                      */}
        {/* ========================================================== */}
        <TabsContent value="quiz" className="flex-1 m-0 p-0 outline-hidden">
          {/* Nhúng component QuizPage vào đây */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full">
            <QuizPage />
          </div>
        </TabsContent>

      </Tabs>

      {/* 🌟 Popup Từ vựng (Nổi lên khi click vào chữ) */}
      {selectedWord && (
        <VocabularyPopup
          word={selectedWord}
          position={popupPos}
          vocabData={selectedVocabData}
          onClose={() => { setSelectedWord(null); setSelectedVocabData(null); }}
          onSave={() => { setSelectedWord(null); setSelectedVocabData(null); }}
        />
      )}

      <VideoRagChatWidget
        videoId={videoId}
        bottomOffsetClassName={showReviewBar ? 'bottom-24 md:bottom-28' : 'bottom-4 md:bottom-6'}
      />

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

                  return (
                    <Button
                      key={status}
                      type="button"
                      variant="outline"
                      disabled={updateStatusMutation.isPending}
                      onClick={() => updateStatusMutation.mutate(status)}
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