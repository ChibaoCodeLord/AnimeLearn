import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // <-- Thêm import Tabs
import { Loader2, Sparkles, Share2, Youtube, FileText, Mic, Brain } from 'lucide-react'; // <-- Thêm icon Mic, Brain
import { toast } from 'sonner';
import ScriptPanel, { type ScriptLine } from '../components/video/ScriptPanel';
import SubtitleOverlay from '../components/video/SubtitleOverlay';
import PlayerControls from '../components/video/PlayerControls';
import VocabularyPopup from '../components/video/VocabularyPopup';
import QuizPage from './QuizPage'; // <-- Import trang QuizPage

// 1. Định nghĩa Interfaces
interface VideoData {
  id: string;
  title: string;
  youtube_url: string;
  script: ScriptLine[];
  jlpt_level: string;
}

function extractYouTubeId(url: string | null) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
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
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [currentYoutubeUrl, setCurrentYoutubeUrl] = useState(youtubeUrl || '');

  const queryClient = useQueryClient();

  // 2. Tải video từ LocalStorage
  useEffect(() => {
    if (videoId) {
      const savedVideos = JSON.parse(localStorage.getItem('my_anime_videos') || '[]');
      const video = savedVideos.find((v: VideoData) => v.id === videoId);
      if (video) {
        setScript(video.script || []);
        setVideoTitle(video.title || '');
        setCurrentYoutubeUrl(video.youtube_url || '');
      }
    }
  }, [videoId]);

  const ytId = extractYouTubeId(currentYoutubeUrl);

  // 3. Giả lập AI tạo kịch bản
  const generateScript = async () => {
    if (!currentYoutubeUrl) {
      toast.error('Vui lòng nhập link YouTube hợp lệ');
      return;
    }
    setGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 2s

      const mockResult = {
        title: "Hội thoại Giao tiếp - Anime Đời Thường",
        jlpt_level: "N4",
        script: [
          { timestamp: "00:05", japanese: "おはようございます、先輩。", vietnamese: "Chào buổi sáng, tiền bối.", vocabulary: [{ word: "先輩", reading: "せんぱい", meaning: "Tiền bối / Đàn anh" }] },
          { timestamp: "00:10", japanese: "今日の会議の資料は準備できましたか？", vietnamese: "Tài liệu cho cuộc họp hôm nay đã chuẩn bị xong chưa?", vocabulary: [{ word: "会議", reading: "かいぎ", meaning: "Cuộc họp" }, { word: "準備", reading: "じゅんび", meaning: "Chuẩn bị" }] },
          { timestamp: "00:15", japanese: "はい、机の上に置いてあります。", vietnamese: "Vâng, tôi đã để trên bàn rồi ạ.", vocabulary: [{ word: "机", reading: "つくえ", meaning: "Cái bàn" }, { word: "置く", reading: "おく", meaning: "Đặt, để" }] },
        ]
      };

      setScript(mockResult.script);
      setVideoTitle(mockResult.title);

      const newVideo: VideoData = {
        id: videoId || `vid_${Date.now()}`,
        title: mockResult.title,
        youtube_url: currentYoutubeUrl,
        script: mockResult.script,
        jlpt_level: mockResult.jlpt_level
      };

      const savedVideos = JSON.parse(localStorage.getItem('my_anime_videos') || '[]');
      localStorage.setItem('my_anime_videos', JSON.stringify([...savedVideos, newVideo]));
      
      queryClient.invalidateQueries({ queryKey: ['community-videos'] });
      toast.success('Đã tạo kịch bản AI thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi phân tích video.');
    } finally {
      setGenerating(false);
    }
  };

  const handleWordSelect = (word: string, pos: { x: number; y: number }) => {
    setSelectedWord(word);
    setPopupPos(pos);
  };

  const currentLine = script[currentIndex] || null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col p-4 md:p-6 lg:p-8 w-full mx-auto animate-in fade-in duration-500">
      
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
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=0`}
                    className="w-full h-full border-0 absolute inset-0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
                  <h2 className="text-slate-800 font-bold truncate text-lg" title={videoTitle}>{videoTitle}</h2>
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
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  onToggleLoop={() => setIsLooping(!isLooping)}
                  onPrevLine={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  onNextLine={() => setCurrentIndex(Math.min(script.length - 1, currentIndex + 1))}
                />
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Khối Kịch Bản (Script Panel) */}
          <div className="w-full xl:w-100 flex flex-col bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden shrink-0 h-150 xl:h-auto">
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
                  onLineClick={(index) => setCurrentIndex(index)}
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
          onClose={() => setSelectedWord(null)}
          onSave={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}