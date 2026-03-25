import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2, XCircle, ArrowRight, RotateCcw, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// 1. Khai báo Interfaces
export interface ScriptLine {
  japanese: string;
  vietnamese: string;
}

export interface VideoItem {
  id: string;
  title: string;
  jlpt_level?: string;
  script?: ScriptLine[];
}

export interface QuizQuestion {
  type?: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
}

// 2. MOCK DATA & API Giả lập
const mockVideos: VideoItem[] = [
  {
    id: 'v1',
    title: 'Học tiếng Nhật cùng Frieren',
    jlpt_level: 'N4',
    script: [
      { japanese: 'これは私の魔法です', vietnamese: 'Đây là phép thuật của tôi' },
      { japanese: 'とても綺麗ですね', vietnamese: 'Nó rất đẹp nhỉ' },
      { japanese: '人間の寿命は短い', vietnamese: 'Tuổi thọ của con người thật ngắn ngủi' }
    ]
  },
  {
    id: 'v2',
    title: 'Jujutsu Kaisen - Hội thoại chiến đấu',
    jlpt_level: 'N3',
    script: [
      { japanese: '呪術師になるつもりか', vietnamese: 'Định trở thành chú thuật sư sao?' }
    ]
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockApi = {
  getVideos: async (): Promise<VideoItem[]> => {
    await delay(500);
    return mockVideos;
  },
  generateQuiz: async (scriptText: string): Promise<QuizQuestion[]> => {
    await delay(2500); 
    return [
      {
        type: 'multiple_choice',
        question: 'Nghĩa của từ "綺麗" (Kirei) là gì?',
        options: ['Đẹp / Sạch sẽ', 'Xấu xí', 'To lớn', 'Nhỏ bé'],
        correct_answer: 'Đẹp / Sạch sẽ',
        explanation: '綺麗 (Kirei) là một tính từ đuôi na, mang nghĩa là đẹp hoặc sạch sẽ.'
      },
      {
        type: 'fill_blank',
        question: 'Điền từ thích hợp: これは私の___です (Đây là phép thuật của tôi)',
        options: ['魔法 (Mahou)', '剣 (Ken)', '本 (Hon)', '家 (Ie)'],
        correct_answer: '魔法 (Mahou)',
        explanation: '魔法 (Mahou) có nghĩa là phép thuật.'
      },
      {
        type: 'listening',
        question: 'Từ "寿命" (Jumyou) trong câu "人間の寿命は短い" có nghĩa là gì?',
        options: ['Tuổi thọ', 'Sức mạnh', 'Cuộc sống', 'Thời gian'],
        correct_answer: 'Tuổi thọ',
        explanation: '寿命 (Jumyou) ghép từ chữ Thọ và Mệnh, mang nghĩa là tuổi thọ.'
      }
    ];
  }
};

// --- COMPONENT CHÍNH ---

export default function QuizPage() {
  const params = new URLSearchParams(window.location.search);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const videoId = params.get('videoId'); 

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data: videos = [] } = useQuery<VideoItem[]>({
    queryKey: ['videos-for-quiz'],
    queryFn: mockApi.getVideos,
    initialData: [],
  });

  const generateQuiz = async (vid: VideoItem) => {
    setGenerating(true);
    setQuestions([]);
    setCurrentQ(0);
    setScore(0);
    setQuizDone(false);

    const video = vid || videos[0];
    if (!video?.script || video.script.length === 0) {
      toast.error('Video chưa có script');
      setGenerating(false);
      return;
    }

    const scriptText = video.script.map(s => `${s.japanese} - ${s.vietnamese}`).join('\n');

    try {
      const generatedQuestions = await mockApi.generateQuiz(scriptText);
      setQuestions(generatedQuestions || []);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo Quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (option: string) => {
    setSelectedAnswer(option);
    setShowResult(true);
    if (option === questions[currentQ]?.correct_answer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizDone(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizDone(false);
  };

  const q = questions[currentQ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 w-full animate-in fade-in duration-500">
    

      {questions.length === 0 && !generating ? (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-8 md:p-10 text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Tạo Quiz từ Video</h2>
            <p className="text-slate-500 mb-8">Hãy chọn một video bạn đã học để hệ thống AI tự động tạo bài kiểm tra dành riêng cho bạn.</p>

            {videos.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <p className="text-slate-500">Chưa có video nào. Hãy tạo script từ trang chủ trước nhé.</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-lg mx-auto">
                {videos.slice(0, 5).map((v: VideoItem) => (
                  <button
                    key={v.id}
                    onClick={() => generateQuiz(v)}
                    className="w-full text-left p-4 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 hover:shadow-md hover:bg-violet-50/50 transition-all flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                      🎬
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 font-bold truncate">{v.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{v.script?.length || 0} câu thoại</p>
                    </div>
                    {v.jlpt_level && (
                      <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 shrink-0 font-semibold shadow-xs">
                        {v.jlpt_level}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : generating ? (
        <div className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center max-w-2xl mx-auto">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-violet-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <Loader2 className="w-16 h-16 text-violet-500 animate-spin relative z-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Đang khởi tạo bài tập</h3>
          <p className="text-slate-500">AI đang đọc kịch bản và chuẩn bị các câu hỏi hay nhất...</p>
        </div>
      ) : quizDone ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-10 text-center max-w-2xl mx-auto"
        >
          <div className="text-7xl mb-6">{score >= questions.length * 0.7 ? '🎉' : '💪'}</div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Kết quả của bạn</h2>
          <div className="inline-block px-8 py-4 bg-violet-50 rounded-3xl mb-6 border border-violet-100">
            <p className="text-6xl font-black bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {score} <span className="text-3xl text-slate-300">/ {questions.length}</span>
            </p>
          </div>
          <p className="text-slate-600 text-lg mb-10 font-medium">
            {score >= questions.length * 0.7 ? 'Tuyệt vời! Bạn đã nắm vững kiến thức từ video này!' : 'Đừng nản chí! Hãy xem lại kịch bản và thử sức lần nữa nhé!'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={resetQuiz} variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 h-12 px-8 rounded-xl text-base font-semibold">
              <RotateCcw className="w-5 h-5 mr-2" />
              Làm lại bài này
            </Button>
            <Button onClick={() => { setQuestions([]); resetQuiz(); }} className="bg-linear-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 shadow-md h-12 px-8 rounded-xl text-base font-semibold">
              <Sparkles className="w-5 h-5 mr-2" />
              Chọn video khác
            </Button>
          </div>
        </motion.div>
      ) : q ? (
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="flex items-center gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Câu {currentQ + 1} / {questions.length}</span>
            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              />
            </div>
            <Badge className="bg-violet-100 text-violet-700 border-0 font-bold px-3 py-1 shadow-xs">
              {score} Điểm
            </Badge>
          </div>

          {/* Question Box */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-6 md:p-10"
            >
              {q.type && (
                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 mb-6 font-semibold tracking-wide uppercase text-[10px]">
                  {q.type === 'multiple_choice' ? 'Trắc nghiệm' : q.type === 'fill_blank' ? 'Điền từ' : 'Đọc hiểu/Nghe hiểu'}
                </Badge>
              )}
              
              <h3 className="text-2xl font-bold text-slate-900 mb-8 leading-snug">{q.question}</h3>

              <div className="space-y-4">
                {q.options?.map((option: string, i: number) => {
                  const isCorrect = option === q.correct_answer;
                  const isSelected = option === selectedAnswer;

                  return (
                    <button
                      key={i}
                      onClick={() => !showResult && handleAnswer(option)}
                      disabled={showResult}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 outline-hidden focus-visible:ring-4 focus-visible:ring-violet-500/20 ${
                        showResult
                          ? isCorrect
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 shadow-sm'
                            : isSelected
                              ? 'border-rose-400 bg-rose-50/50 text-rose-800'
                              : 'border-slate-100 bg-slate-50 opacity-60 text-slate-500'
                          : 'border-slate-200 hover:border-violet-400 hover:bg-violet-50/30 text-slate-700 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                           showResult && isCorrect ? 'bg-emerald-500 text-white' : 
                           showResult && isSelected ? 'bg-rose-500 text-white' : 
                           'bg-slate-100 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1 text-lg font-medium">{option}</span>
                        
                        {showResult && isCorrect && <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />}
                        {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-rose-500 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {showResult && q.explanation && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: 10 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  className="mt-8 p-6 rounded-2xl bg-violet-50/80 border border-violet-100 shadow-inner"
                >
                  <p className="text-slate-700 leading-relaxed">
                    <span className="text-violet-700 font-bold flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4" />
                      Giải thích: 
                    </span>
                    {q.explanation}
                  </p>
                </motion.div>
              )}

              {/* Next Button */}
              {showResult && (
                <div className="mt-8 flex justify-end">
                  <Button 
                    onClick={nextQuestion} 
                    size="lg"
                    className="bg-slate-900 text-white hover:bg-slate-800 h-14 px-8 rounded-xl text-base font-semibold shadow-md"
                  >
                    {currentQ < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}