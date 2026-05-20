import { useState, useEffect, useRef } from 'react';
import YouTubeOrigin from 'react-youtube';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2, XCircle, ArrowRight, RotateCcw, BrainCircuit, PlayCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const YouTube = (YouTubeOrigin as any).default || YouTubeOrigin;

// Hàm tiện ích chuyển đổi "01:30" thành giây
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

// --- Interfaces ---
type QuestionType = 'fill_in_blank' | 'vocabulary' | 'translation' | 'grammar_particle' | 'kanji_reading';

export interface QuizQuestion {
  timestamp: string;
  type: QuestionType;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizData {
  id: string;
  videoId: string;
  questions: QuizQuestion[];
}

interface QuizPageProps {
  videoId?: string | null;
  script?: any[];
  ytId?: string | null; // Thêm ytId để chạy video
  onJumpToTime?: (index: number) => void;
}

const API_BASE = 'http://localhost:5000/api';

// --- COMPONENT CHÍNH ---
export default function QuizPage({ videoId = null, script = [], ytId }: QuizPageProps) {
  const queryClient = useQueryClient();
  const playerRef = useRef<any>(null);

  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  // Fetch Quiz
  const { data: existingQuiz, isLoading: isFetchingQuiz } = useQuery<QuizData | null>({
    queryKey: ['video-quiz', videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const res = await fetch(`${API_BASE}/quiz/${videoId}`, {
        headers: {
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
        }
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Lỗi tải quiz');
      return res.json();
    },
    enabled: !!videoId,
  });

  // Mutation AI tạo Quiz và chấm điểm JLPT
  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      if (!videoId) throw new Error('Thiếu mã video');
      if (!script || script.length === 0) throw new Error('Video chưa có kịch bản (script) để tạo quiz.');

      const res = await fetch(`${API_BASE}/quiz/${videoId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
        },
        body: JSON.stringify({ script })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi AI tạo quiz');
      
      // Backend lúc này sẽ trả về object: { message, quiz, jlptLevel }
      return data; 
    },
    onSuccess: (data) => {
      // Hiển thị luôn Level AI vừa chấm được lên Toast
      toast.success(`🎉 AI đã tạo bài tập và đánh giá trình độ: ${data.jlptLevel || 'Thành công'}!`);
      
      // 1. Load lại ngay lập tức dữ liệu bài Quiz
      queryClient.invalidateQueries({ queryKey: ['video-quiz', videoId] });
      
      // 2. Load lại danh sách video để cập nhật Badge JLPT ở các nơi khác
      queryClient.invalidateQueries({ queryKey: ['community-videos'] });
      queryClient.invalidateQueries({ queryKey: ['video-detail', videoId] });

      /* 💡 MẸO NHỎ: 
         Vì trong file VideoWorkspace.tsx bạn đang dùng useEffect() gọi fetch() thuần 
         để lấy thông tin Video (chứ không dùng useQuery), nên invalidateQueries ở trên 
         có thể không tự động cập nhật cái chữ "Unknown" trên Badge.
         
         Nếu bạn thấy Badge JLPT chưa tự đổi số, hãy mở comment dòng dưới đây để reload nhẹ trang:
      */
      // setTimeout(() => window.location.reload(), 1500);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Không thể tạo quiz lúc này');
    }
  });

  // Tự động tua video khi chuyển câu hỏi
  useEffect(() => {
    if (existingQuiz && existingQuiz.questions[currentQ]) {
      const q = existingQuiz.questions[currentQ];
      if (playerRef.current && q.timestamp) {
        const timeSec = parseTimestampToSeconds(q.timestamp);
        playerRef.current.seekTo(timeSec, true);
        playerRef.current.pauseVideo(); // Pause để người dùng tự bấm Play nếu muốn xem context
      }
    }
  }, [currentQ, existingQuiz]);

  // --- Handlers ---
  const handleStartQuiz = () => {
    setIsTakingQuiz(true);
    setCurrentQ(0);
    setScore(0);
    setSelectedOption(null);
    setShowResult(false);
    setQuizDone(false);
  };

  const handleAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    setShowResult(true);
    if (existingQuiz && optionIndex === existingQuiz.questions[currentQ].correctAnswerIndex) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (!existingQuiz) return;
    if (currentQ < existingQuiz.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setQuizDone(true);
    }
  };

  // Cập nhật hàm getQuestionTypeLabel (Khoảng dòng 130)
  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'fill_in_blank': return 'Điền từ';
      case 'vocabulary': return 'Từ vựng';
      case 'translation': return 'Dịch thuật';
      case 'grammar_particle': return 'Ngữ pháp & Trợ từ'; // Mới
      case 'kanji_reading': return 'Đọc Kanji'; // Mới
      default: return 'Trắc nghiệm';
    }
  };

  // --- RENDERS ---
  if (!videoId) {
    return <div className="h-full flex items-center justify-center p-8 text-slate-500">Vui lòng lưu video và kịch bản vào sổ tay trước khi tạo Quiz.</div>;
  }

  if (isFetchingQuiz) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-4" />
        <p>Đang kiểm tra dữ liệu bài tập...</p>
      </div>
    );
  }

  // TRẠNG THÁI 1: CHƯA CÓ QUIZ
  if (!existingQuiz && !isTakingQuiz && !generateQuizMutation.isPending) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 w-full animate-in fade-in duration-500">
        <div className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-violet-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <BrainCircuit className="w-10 h-10 text-violet-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Tạo Quiz AI từ Kịch Bản</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Hệ thống sẽ dùng <b>AI</b> đọc kịch bản video và tự động trích xuất các bài tập điền từ, từ vựng, và dịch thuật cho mỗi 30 giây của video.
          </p>
          <Button 
            onClick={() => generateQuizMutation.mutate()}
            disabled={!script || script.length === 0}
            className="bg-violet-600 hover:opacity-90 text-white rounded-xl px-8 py-6 text-lg h-auto shadow-md w-full sm:w-auto"
          >
            <Sparkles className="w-5 h-5 mr-2" /> Tạo Quiz Ngay Bằng AI
          </Button>
          {(!script || script.length === 0) && (
            <p className="text-rose-500 text-sm mt-4 font-medium">Cần tạo Script AI bên Tab "Luyện Shadowing" trước khi tạo Quiz.</p>
          )}
        </div>
      </div>
    );
  }

  // TRẠNG THÁI 2: ĐANG TẠO (LOADING)
  if (generateQuizMutation.isPending) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 w-full animate-in fade-in duration-500">
        <div className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-violet-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <Loader2 className="w-16 h-16 text-violet-500 animate-spin relative z-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Đang thiết kế bài tập</h3>
          <p className="text-slate-500 text-center max-w-sm">AI đang đọc hiểu ngữ cảnh và trộn các câu hỏi hay nhất dành cho bạn...</p>
        </div>
      </div>
    );
  }

  // TRẠNG THÁI 3: ĐÃ CÓ QUIZ NHƯNG CHƯA BẮT ĐẦU LÀM
  if (existingQuiz && !isTakingQuiz && !quizDone) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 w-full animate-in fade-in duration-500">
        <div className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Quiz Đã Sẵn Sàng!</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            AI đã tạo xong bộ <b>{existingQuiz.questions.length} câu hỏi</b> từ video này. Hãy thử kiểm tra trí nhớ của bạn nhé!
          </p>
          <Button onClick={handleStartQuiz} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-6 text-lg h-auto shadow-md">
            <PlayCircle className="w-5 h-5 mr-2" /> Bắt đầu làm bài
          </Button>
        </div>
      </div>
    );
  }

  const q = existingQuiz?.questions[currentQ];

  // TRẠNG THÁI 4: KẾT QUẢ CUỐI CÙNG
  if (quizDone && existingQuiz) {
    const percent = Math.round((score / existingQuiz.questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 w-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-10 text-center"
        >
          <div className="text-7xl mb-6">{percent >= 70 ? '🎉' : '💪'}</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Kết quả của bạn</h2>
          <div className="inline-block px-8 py-4 bg-violet-50 rounded-3xl mb-6 border border-violet-100">
            <p className="text-6xl font-black bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {score} <span className="text-3xl text-slate-400">/ {existingQuiz.questions.length}</span>
            </p>
          </div>
          <p className="text-slate-600 text-lg mb-10 font-medium">
            {percent >= 70 ? 'Tuyệt vời! Bạn đã nắm vững kiến thức từ video này!' : 'Đừng nản chí! Hãy ôn tập kịch bản và thử sức lần nữa nhé!'}
          </p>
          <Button onClick={handleStartQuiz} variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 h-12 px-8 rounded-xl text-base font-semibold">
            <RotateCcw className="w-5 h-5 mr-2" /> Làm lại bài này
          </Button>
        </motion.div>
      </div>
    );
  }

  // TRẠNG THÁI 5: ĐANG LÀM BÀI
  if (q) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 w-full">
        {/* Progress Bar */}
        <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Câu {currentQ + 1} / {existingQuiz.questions.length}</span>
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentQ + 1) / existingQuiz.questions.length) * 100}%` }}
            />
          </div>
          <Badge className="bg-violet-100 text-violet-700 border-0 font-bold px-3 py-1 shadow-xs">
            {score} Điểm
          </Badge>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col"
          >
            {/* Header: Type Badge & Context Video Layout */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              
              {/* Cửa sổ Video Context (Bên trái nếu màn hình rộng, hoặc ở trên) */}
              {ytId && (
                <div className="w-full md:w-5/12 aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-inner shrink-0 relative">
                  <YouTube
                    videoId={ytId}
                    className="w-full h-full absolute inset-0"
                    iframeClassName="w-full h-full border-0"
                    opts={{ playerVars: { autoplay: 0, controls: 1, rel: 0 } }}
                    onReady={(e: any) => {
                      playerRef.current = e.target;
                      if (q.timestamp) {
                        e.target.seekTo(parseTimestampToSeconds(q.timestamp), true);
                      }
                    }}
                  />
                </div>
              )}

              {/* Phần câu hỏi */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200 font-semibold tracking-wide uppercase text-[10px]">
                    {getQuestionTypeLabel(q.type)}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-500 border-0 font-mono text-[10px] tracking-wider flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> {q.timestamp}
                  </Badge>
                </div>
                <h3 
                  className="text-xl font-bold text-slate-800 mb-4"
                  dangerouslySetInnerHTML={{ __html: q.questionText }}
                />
              </div>
            </div>

            {/* Các đáp án trắc nghiệm */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((option: string, i: number) => {
                const isCorrect = i === q.correctAnswerIndex;
                const isSelected = i === selectedOption;

                return (
                  <button
                    key={i}
                    onClick={() => !showResult && handleAnswer(i)}
                    disabled={showResult}
                    className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-200 outline-hidden focus-visible:ring-4 focus-visible:ring-violet-500/20 ${
                      showResult
                        ? isCorrect
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 shadow-sm'
                          : isSelected
                            ? 'border-rose-400 bg-rose-50/50 text-rose-800'
                            : 'border-slate-100 bg-slate-50 opacity-60 text-slate-500'
                        : 'border-slate-200 hover:border-violet-400 hover:bg-violet-50/30 text-slate-700 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                         showResult && isCorrect ? 'bg-emerald-500 text-white' : 
                         showResult && isSelected ? 'bg-rose-500 text-white' : 
                         'bg-slate-100 text-slate-500'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1 text-base font-medium">{option}</span>
                      
                      {showResult && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-rose-500 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Hộp Giải Thích */}
            {showResult && q.explanation && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: 10 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                className="mt-6 p-5 rounded-2xl bg-violet-50/80 border border-violet-100 shadow-inner"
              >
                <p className="text-slate-700 leading-relaxed text-sm md:text-base">
                  <span className="text-violet-700 font-bold flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4" /> Giải thích: 
                  </span>
                  {q.explanation}
                </p>
              </motion.div>
            )}

            {/* Nút Next */}
            {showResult && (
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={nextQuestion} 
                  size="lg"
                  className="bg-slate-900 text-white hover:bg-slate-800 h-12 md:h-14 px-8 rounded-xl text-sm md:text-base font-semibold shadow-md"
                >
                  {currentQ < existingQuiz.questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return null;
}