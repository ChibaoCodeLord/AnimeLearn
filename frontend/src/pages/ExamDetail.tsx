import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  ClipboardList,
  Clock,
  FileText,
  Headphones,
  Send,
  SkipForward,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ExamLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
type SectionKey = 'vocabulary' | 'reading' | 'listening';

interface ExamMeta {
  id: string;
  title: string;
  level: ExamLevel;
  totalQuestions: number;
  remainingTime: string;
  primarySkill: string;
  part: string;
}

interface SectionTab {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
}

interface QuestionOption {
  key: string;
  text: string;
}

const examDetails: Record<string, ExamMeta> = {
  'jlpt-n2-2023-12': {
    id: 'jlpt-n2-2023-12',
    title: 'Đề thi tháng 12/2023',
    level: 'N2',
    totalQuestions: 54,
    remainingTime: '72:08',
    primarySkill: 'Ngữ pháp & Đọc hiểu',
    part: 'Phần VI',
  },
  'jlpt-n2-2023-07': {
    id: 'jlpt-n2-2023-07',
    title: 'Đề thi tháng 07/2023',
    level: 'N2',
    totalQuestions: 54,
    remainingTime: '68:24',
    primarySkill: 'Ngữ pháp & Đọc hiểu',
    part: 'Phần VI',
  },
  'jlpt-n1-2022-12': {
    id: 'jlpt-n1-2022-12',
    title: 'Đề thi tháng 12/2022',
    level: 'N1',
    totalQuestions: 54,
    remainingTime: '82:15',
    primarySkill: 'Từ vựng & Ngữ pháp',
    part: 'Phần V',
  },
  'jlpt-n3-2023-12': {
    id: 'jlpt-n3-2023-12',
    title: 'Đề thi tháng 12/2023',
    level: 'N3',
    totalQuestions: 54,
    remainingTime: '70:12',
    primarySkill: 'Ngữ pháp & Đọc hiểu',
    part: 'Phần VI',
  },
  'jlpt-n3-2023-07': {
    id: 'jlpt-n3-2023-07',
    title: 'Đề thi tháng 07/2023',
    level: 'N3',
    totalQuestions: 54,
    remainingTime: '69:40',
    primarySkill: 'Ngữ pháp & Đọc hiểu',
    part: 'Phần VI',
  },
  'jlpt-n3-2022-12': {
    id: 'jlpt-n3-2022-12',
    title: 'Đề thi tháng 12/2022',
    level: 'N3',
    totalQuestions: 54,
    remainingTime: '71:05',
    primarySkill: 'Ngữ pháp & Đọc hiểu',
    part: 'Phần VI',
  },
  'jlpt-n4-2022-07': {
    id: 'jlpt-n4-2022-07',
    title: 'Đề thi tháng 07/2022',
    level: 'N4',
    totalQuestions: 54,
    remainingTime: '54:38',
    primarySkill: 'Từ vựng & Ngữ pháp',
    part: 'Phần IV',
  },
  'jlpt-n5-2021-12': {
    id: 'jlpt-n5-2021-12',
    title: 'Đề thi tháng 12/2021',
    level: 'N5',
    totalQuestions: 54,
    remainingTime: '45:16',
    primarySkill: 'Từ vựng & Ngữ pháp',
    part: 'Phần III',
  },
};

const fallbackExam: ExamMeta = {
  id: 'mock-exam',
  title: 'Đề thi tháng 12/2021',
  level: 'N2',
  totalQuestions: 54,
  remainingTime: '72:08',
  primarySkill: 'Ngữ pháp & Đọc hiểu',
  part: 'Phần VI',
};

const sectionTabs: SectionTab[] = [
  { key: 'vocabulary', label: 'Từ vựng & Ngữ pháp', icon: BookOpen },
  { key: 'reading', label: 'Đọc hiểu', icon: ClipboardList },
  { key: 'listening', label: 'Nghe hiểu', icon: Headphones },
];

const questionOptions: QuestionOption[] = [
  { key: 'A', text: 'から' },
  { key: 'B', text: 'けれど' },
  { key: 'C', text: 'ので' },
  { key: 'D', text: 'でも' },
];

const initialAnsweredQuestions = new Set(Array.from({ length: 11 }, (_, index) => index + 1));
const initialMarkedQuestions = new Set([4, 14]);

function levelBadgeClass(level: ExamLevel) {
  const classes: Record<ExamLevel, string> = {
    N1: 'border-blue-300 bg-blue-100 text-blue-700',
    N2: 'border-[#00b894] bg-[#dff8ee] text-[#007a5a]',
    N3: 'border-amber-300 bg-amber-100 text-amber-700',
    N4: 'border-violet-300 bg-violet-100 text-violet-700',
    N5: 'border-rose-300 bg-rose-100 text-rose-700',
  };

  return classes[level];
}

export default function ExamDetail() {
  const { examId } = useParams<{ examId: string }>();
  const exam = examId ? examDetails[examId] ?? fallbackExam : fallbackExam;
  const [activeSection, setActiveSection] = useState<SectionKey>('vocabulary');
  const [currentQuestion, setCurrentQuestion] = useState(12);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(initialAnsweredQuestions);
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(initialMarkedQuestions);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({ 12: 'B' });

  const questionNumbers = useMemo(
    () => Array.from({ length: exam.totalQuestions }, (_, index) => index + 1),
    [exam.totalQuestions]
  );

  const selectedAnswer = selectedAnswers[currentQuestion];
  const markedCount = markedQuestions.size;
  const answeredCount = answeredQuestions.size;
  const progressPercent = Math.round((answeredCount / exam.totalQuestions) * 100);

  const handleAnswerSelect = (answerKey: string) => {
    setSelectedAnswers(current => ({
      ...current,
      [currentQuestion]: answerKey,
    }));
    setAnsweredQuestions(current => new Set(current).add(currentQuestion));
  };

  const handleMarkToggle = () => {
    setMarkedQuestions(current => {
      const next = new Set(current);
      if (next.has(currentQuestion)) {
        next.delete(currentQuestion);
      } else {
        next.add(currentQuestion);
      }
      return next;
    });
  };

  const moveQuestion = (direction: -1 | 1) => {
    setCurrentQuestion(current => Math.min(exam.totalQuestions, Math.max(1, current + direction)));
  };

  return (
    <div className="min-h-full bg-[#f8fafc] px-3 py-4 sm:px-4 lg:px-5 dark:bg-slate-950">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 xl:[zoom:0.92] 2xl:[zoom:0.95]">
        <div className="sticky top-20 z-30 grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-stretch">
          <section className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                to="/ExamLibrary"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-emerald-50 hover:text-[#007a5a] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                aria-label="Quay lại kho đề thi"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <span
                className={cn(
                  'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 text-xl font-black leading-none',
                  levelBadgeClass(exam.level)
                )}
              >
                {exam.level}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">{exam.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-8 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    <FileText className="h-4 w-4" />
                    {exam.primarySkill}
                  </span>
                  <span className="inline-flex h-8 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                    {exam.part}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:flex-nowrap xl:justify-center">
                {sectionTabs.map(tab => {
                  const Icon = tab.icon;
                  const active = activeSection === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveSection(tab.key)}
                      className={cn(
                        'inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-extrabold transition-colors',
                        tab.key === 'vocabulary' ? 'xl:min-w-48' : 'xl:min-w-32',
                        active
                          ? 'border-emerald-200 bg-[#effaf6] text-[#007a5a] shadow-sm'
                          : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
            <div className="flex h-full flex-wrap items-center gap-2 xl:flex-nowrap xl:justify-end">
                <div className="flex items-center gap-2 px-1">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#00b894] bg-white text-[#007a5a] dark:bg-slate-950">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-lg font-black leading-none text-slate-950 dark:text-white">{exam.remainingTime}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">còn lại</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <SkipForward className="h-5 w-5" />
                  Bỏ qua phần
                </button>

                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-transparent bg-[#008a67] px-4 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-[#007a5a]"
                >
                  <Send className="h-5 w-5" />
                  Nộp bài
                </button>
            </div>
          </section>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_350px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex flex-col gap-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f7f1] px-4 py-1.5 text-sm font-extrabold text-[#007a5a]">
                <FileText className="h-4 w-4" />
                Ngữ pháp — Chọn đáp án đúng
              </span>

              <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                <span className="text-slate-600 dark:text-slate-300">
                  Câu {currentQuestion} / {exam.totalQuestions}
                </span>
                <span className="rounded-full bg-[#dff8ee] px-4 py-1.5 text-[#007a5a]">2 điểm</span>
              </div>

              <div className="space-y-4">
                <p className="text-lg font-semibold leading-relaxed text-slate-950 dark:text-white">
                  （　　）に入る最も適切なものを選んでください。
                </p>
                <div className="rounded-2xl bg-[#edf8f4] px-5 py-4 text-lg font-bold leading-relaxed text-slate-950 dark:bg-emerald-500/10 dark:text-white">
                  この映画は内容が難しい（　　）、見る価値はあると思う。
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {questionOptions.map(option => {
                const active = selectedAnswer === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleAnswerSelect(option.key)}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-4 rounded-2xl border px-4 text-left transition-all',
                      active
                        ? 'border-[#008a67] bg-[#f1fbf7] shadow-sm'
                        : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-emerald-500/50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-base font-black',
                        active
                          ? 'border-transparent bg-[#008a67] text-white'
                          : 'border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                      )}
                    >
                      {option.key}
                    </span>
                    <span className="text-lg font-black text-slate-950 dark:text-white">{option.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => moveQuestion(-1)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  disabled={currentQuestion === 1}
                >
                  <ArrowLeft className="h-5 w-5" />
                  Câu trước
                </button>
                <button
                  type="button"
                  onClick={handleMarkToggle}
                  className={cn(
                    'inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold shadow-sm transition-colors',
                    markedQuestions.has(currentQuestion)
                      ? 'border-amber-300 bg-amber-50 text-slate-950 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-100'
                      : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
                  )}
                >
                  <Bookmark className="h-5 w-5" />
                  {markedQuestions.has(currentQuestion) ? 'Đã đánh dấu' : 'Đánh dấu'}
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(1)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#008a67] bg-white px-4 text-sm font-extrabold text-[#007a5a] shadow-sm transition-colors hover:bg-[#effaf6] disabled:opacity-50 dark:bg-slate-950"
                  disabled={currentQuestion === exam.totalQuestions}
                >
                  Câu tiếp
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-base font-black uppercase tracking-wide text-slate-900 dark:text-white">Câu hỏi</h2>
              <div className="grid grid-cols-5 gap-2">
                {questionNumbers.map(number => {
                  const current = number === currentQuestion;
                  const answered = answeredQuestions.has(number);
                  const marked = markedQuestions.has(number);

                  return (
                    <button
                      key={number}
                      type="button"
                      onClick={() => setCurrentQuestion(number)}
                      className={cn(
                        'h-8 rounded-lg border text-xs font-black transition-colors',
                        current && 'border-transparent bg-[#008a67] text-white shadow-sm',
                        !current && marked && 'border-amber-300 bg-amber-50 text-slate-950',
                        !current && !marked && answered && 'border-emerald-200 bg-[#effaf6] text-slate-950',
                        !current && !marked && !answered && 'border-slate-200 bg-white text-slate-950 hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
                      )}
                    >
                      {number}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-[#008a67]" />
                  Đang xem
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded border border-[#00b894] bg-[#effaf6]" />
                  Đã trả lời
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-amber-400" />
                  Đánh dấu
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-slate-300" />
                  Chưa làm
                </span>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-base font-black uppercase tracking-wide text-slate-900 dark:text-white">Tiến độ</h2>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-extrabold">
                    <span className="text-slate-600 dark:text-slate-300">Đã trả lời</span>
                    <span className="text-slate-950 dark:text-white">
                      {answeredCount}/{exam.totalQuestions}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-[#008a67]" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-[80px_1fr_28px] items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Chính xác</span>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full w-3/5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-right font-black text-slate-950 dark:text-white">–</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr_28px] items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Đánh dấu</span>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${Math.max(8, (markedCount / exam.totalQuestions) * 100)}%` }}
                      />
                    </div>
                    <span className="text-right font-black text-slate-950 dark:text-white">{markedCount}</span>
                  </div>
                </div>

              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
