import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Headphones,
  Send,
  SkipForward,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  examApi,
  type ExamLevel,
  type ExamPaper,
  type ExamQuestion,
  type ExamQuestionGroup,
  type ExamSection,
  type ExamSectionType,
} from '@/api/exam.api';
import { cn } from '@/lib/utils';

interface SectionTab {
  key: ExamSectionType;
  label: string;
  icon: LucideIcon;
}

interface FlatQuestion {
  key: string;
  number: number;
  question: ExamQuestion;
  group: ExamQuestionGroup;
  section: ExamSection;
}

const sectionTabs: SectionTab[] = [
  { key: 'vocabulary_grammar', label: 'Từ vựng & Ngữ pháp', icon: BookOpen },
  { key: 'reading', label: 'Đọc hiểu', icon: ClipboardList },
  { key: 'listening', label: 'Nghe hiểu', icon: Headphones },
];

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

function formatTime(minutes: number) {
  const safeMinutes = Math.max(0, Math.floor(minutes || 0));
  return `${String(safeMinutes).padStart(2, '0')}:00`;
}

function flattenSectionQuestions(exam: ExamPaper | undefined, sectionType: ExamSectionType): FlatQuestion[] {
  const section = exam?.sections?.find(item => item.type === sectionType);
  if (!section) return [];

  let questionNumber = 0;
  return [...section.groups]
    .sort((a, b) => a.order - b.order)
    .flatMap(group => [...(group.questions || [])]
      .sort((a, b) => a.order - b.order)
      .map(question => {
        questionNumber += 1;
        return {
          key: question.id || `${section.type}-${group.id || group.mondaiNumber}-${question.order}-${questionNumber}`,
          number: questionNumber,
          question,
          group,
          section,
        };
      }));
}

function flattenExamQuestions(exam: ExamPaper | undefined) {
  return sectionTabs.flatMap(tab => flattenSectionQuestions(exam, tab.key));
}

function findFirstSection(exam: ExamPaper | undefined): ExamSectionType {
  const sectionWithQuestions = sectionTabs.find(tab => flattenSectionQuestions(exam, tab.key).length > 0);
  return sectionWithQuestions?.key || 'vocabulary_grammar';
}

function normalizeAudioSecond(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) return null;
  return numericValue;
}

function buildGroupAudioUrl(group: ExamQuestionGroup) {
  if (!group.audioUrl || group.audioUrl.includes('#t=')) return group.audioUrl || '';

  const start = normalizeAudioSecond(group.audioStartSeconds);
  const end = normalizeAudioSecond(group.audioEndSeconds);
  if (start === null && end === null) return group.audioUrl;

  const safeStart = start ?? 0;
  const fragment = end !== null && end > safeStart
    ? `${safeStart},${end}`
    : `${safeStart}`;
  return `${group.audioUrl}#t=${fragment}`;
}

function SectionMedia({ group, question }: { group: ExamQuestionGroup; question: ExamQuestion }) {
  const imageUrl = question.questionImageUrl || group.attachmentImageUrl;
  const audioUrl = question.audioUrl || buildGroupAudioUrl(group);

  if (!imageUrl && !audioUrl && !group.passageText) return null;

  return (
    <div className="space-y-3">
      {group.passageText && (
        <div className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base font-semibold leading-8 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
          {group.passageText}
        </div>
      )}

      {imageUrl && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
          <img src={imageUrl} alt={group.title || 'Exam attachment'} className="max-h-[520px] w-full object-contain" />
        </div>
      )}

      {audioUrl && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
            <Volume2 className="h-4 w-4" />
            Audio nghe hiểu
          </div>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}
    </div>
  );
}

function ExamLoading() {
  return (
    <div className="min-h-full bg-[#f8fafc] px-3 py-4 sm:px-4 lg:px-5 dark:bg-slate-950">
      <div className="mx-auto max-w-[1480px] space-y-3">
        <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="h-[520px] animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
        </div>
      </div>
    </div>
  );
}

export default function ExamDetail() {
  const { examId } = useParams<{ examId: string }>();
  const [activeSection, setActiveSection] = useState<ExamSectionType>('vocabulary_grammar');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ correct: number; scorable: number; answered: number } | null>(null);

  const examQuery = useQuery({
    queryKey: ['exam-detail', examId],
    queryFn: () => examApi.detail(examId || ''),
    enabled: Boolean(examId),
  });

  const exam = examQuery.data;
  const activeQuestions = useMemo(
    () => flattenSectionQuestions(exam, activeSection),
    [exam, activeSection],
  );
  const allQuestions = useMemo(() => flattenExamQuestions(exam), [exam]);
  const currentItem = activeQuestions[currentQuestionIndex] || activeQuestions[0];
  const currentQuestionKey = currentItem?.key || '';
  const selectedAnswer = currentQuestionKey ? selectedAnswers[currentQuestionKey] : undefined;
  const activeSectionMeta = exam?.sections?.find(section => section.type === activeSection);

  useEffect(() => {
    if (!exam) return;
    setActiveSection(findFirstSection(exam));
    setCurrentQuestionIndex(0);
  }, [exam?.id]);

  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [activeSection]);

  const answeredCount = answeredQuestions.size;
  const markedCount = markedQuestions.size;
  const totalQuestions = allQuestions.length;
  const progressPercent = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleAnswerSelect = (answerIndex: number) => {
    if (!currentQuestionKey) return;
    setSelectedAnswers(current => ({
      ...current,
      [currentQuestionKey]: answerIndex,
    }));
    setAnsweredQuestions(current => new Set(current).add(currentQuestionKey));
  };

  const handleMarkToggle = () => {
    if (!currentQuestionKey) return;
    setMarkedQuestions(current => {
      const next = new Set(current);
      if (next.has(currentQuestionKey)) {
        next.delete(currentQuestionKey);
      } else {
        next.add(currentQuestionKey);
      }
      return next;
    });
  };

  const moveQuestion = (direction: -1 | 1) => {
    setCurrentQuestionIndex(current => Math.min(activeQuestions.length - 1, Math.max(0, current + direction)));
  };

  const skipSection = () => {
    const currentTabIndex = sectionTabs.findIndex(tab => tab.key === activeSection);
    const nextTab = sectionTabs.slice(currentTabIndex + 1).find(tab => flattenSectionQuestions(exam, tab.key).length > 0);
    if (nextTab) {
      setActiveSection(nextTab.key);
    }
  };

  const submitExam = () => {
    const scorableQuestions = allQuestions.filter(item => item.question.correctOptionIndex !== null && item.question.correctOptionIndex !== undefined);
    const correct = scorableQuestions.filter(item => selectedAnswers[item.key] === item.question.correctOptionIndex).length;
    const nextResult = {
      correct,
      scorable: scorableQuestions.length,
      answered: answeredQuestions.size,
    };
    setResult(nextResult);

    if (nextResult.scorable > 0) {
      toast.success(`Kết quả: ${nextResult.correct}/${nextResult.scorable} câu có đáp án`);
    } else {
      toast.info('Đề này chưa có đáp án đúng để chấm điểm.');
    }
  };

  if (examQuery.isLoading) return <ExamLoading />;

  if (examQuery.isError || !exam) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-[#f8fafc] px-4 text-center dark:bg-slate-950">
        <FileText className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
        <h1 className="text-2xl font-black text-slate-950 dark:text-white">Không tìm thấy đề thi</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
          {(examQuery.error as Error | undefined)?.message || 'Đề thi chưa được xuất bản hoặc đã bị xóa.'}
        </p>
        <Link to="/ExamLibrary" className="mt-5 rounded-xl bg-[#008a67] px-5 py-3 text-sm font-bold text-white">
          Quay lại kho đề
        </Link>
      </div>
    );
  }

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
                    levelBadgeClass(exam.level),
                  )}
                >
                  {exam.level}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">{exam.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-8 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                      <FileText className="h-4 w-4" />
                      {exam.subtitle || `${exam.source || 'JLPT'} ${exam.month}/${exam.year}`}
                    </span>
                    <span className="inline-flex h-8 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                      {totalQuestions} câu
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 xl:flex-nowrap xl:justify-center">
                {sectionTabs.map(tab => {
                  const Icon = tab.icon;
                  const active = activeSection === tab.key;
                  const count = flattenSectionQuestions(exam, tab.key).length;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveSection(tab.key)}
                      className={cn(
                        'inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-extrabold transition-colors',
                        tab.key === 'vocabulary_grammar' ? 'xl:min-w-52' : 'xl:min-w-32',
                        active
                          ? 'border-emerald-200 bg-[#effaf6] text-[#007a5a] shadow-sm'
                          : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                      <span className="rounded-full bg-white/70 px-2 text-xs dark:bg-slate-900/70">{count}</span>
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
                  <p className="text-lg font-black leading-none text-slate-950 dark:text-white">
                    {formatTime(activeSectionMeta?.durationMinutes || exam.totalDurationMinutes)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">thời lượng</p>
                </div>
              </div>

              <button
                type="button"
                onClick={skipSection}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <SkipForward className="h-5 w-5" />
                Bỏ qua phần
              </button>

              <button
                type="button"
                onClick={submitExam}
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
            {!currentItem ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <ClipboardList className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-700" />
                <p className="text-lg font-black text-slate-950 dark:text-white">Phần này chưa có câu hỏi</p>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">Admin cần import Mondai trước khi luyện tập.</p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex flex-col gap-4">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e8f7f1] px-4 py-1.5 text-sm font-extrabold text-[#007a5a]">
                    <FileText className="h-4 w-4" />
                    {currentItem.group.title || `Mondai ${currentItem.group.mondaiNumber}`}
                  </span>

                  <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                    <span className="text-slate-600 dark:text-slate-300">
                      Câu {currentItem.number} / {activeQuestions.length}
                    </span>
                    <span className="rounded-full bg-[#dff8ee] px-4 py-1.5 text-[#007a5a]">
                      {currentItem.question.points || 1} điểm
                    </span>
                  </div>

                  {currentItem.group.instruction && (
                    <p className="text-base font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
                      {currentItem.group.instruction}
                    </p>
                  )}

                  <SectionMedia group={currentItem.group} question={currentItem.question} />

                  <div className="space-y-4">
                    <p className="text-lg font-semibold leading-relaxed text-slate-950 dark:text-white">
                      {currentItem.question.questionText}
                    </p>
                    {currentItem.question.stemText && (
                      <div className="rounded-2xl bg-[#edf8f4] px-5 py-4 text-lg font-bold leading-relaxed text-slate-950 dark:bg-emerald-500/10 dark:text-white">
                        {currentItem.question.stemText}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {(currentItem.question.options || []).map((option, optionIndex) => {
                    const active = selectedAnswer === optionIndex;
                    const submitted = Boolean(result);
                    const isCorrect = currentItem.question.correctOptionIndex === optionIndex;
                    const isWrongSelection = submitted && active && currentItem.question.correctOptionIndex !== null && !isCorrect;

                    return (
                      <button
                        key={`${currentQuestionKey}-${option.label}-${optionIndex}`}
                        type="button"
                        onClick={() => handleAnswerSelect(optionIndex)}
                        className={cn(
                          'flex min-h-12 w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all',
                          active
                            ? 'border-[#008a67] bg-[#f1fbf7] shadow-sm'
                            : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-emerald-500/50',
                          submitted && isCorrect && 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
                          isWrongSelection && 'border-rose-300 bg-rose-50 dark:bg-rose-500/10',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-base font-black',
                            active
                              ? 'border-transparent bg-[#008a67] text-white'
                              : 'border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
                            submitted && isCorrect && 'border-transparent bg-emerald-500 text-white',
                            isWrongSelection && 'border-transparent bg-rose-500 text-white',
                          )}
                        >
                          {option.label || String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span className="min-w-0 flex-1 text-lg font-black text-slate-950 dark:text-white">
                          {option.text}
                          {option.imageUrl && (
                            <img src={option.imageUrl} alt={option.label} className="mt-3 max-h-48 rounded-xl border border-slate-200 object-contain dark:border-slate-700" />
                          )}
                        </span>
                        {submitted && isCorrect && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>

                {result && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900/70 dark:bg-emerald-950/30">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-black text-emerald-800 dark:text-emerald-100">
                        <CheckCircle2 className="h-4 w-4" />
                        Đáp án & giải thích
                      </span>
                      {currentItem.question.answerConfidence !== null && currentItem.question.answerConfidence !== undefined && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-slate-950 dark:text-emerald-200">
                          AI confidence: {Math.round(currentItem.question.answerConfidence * 100)}%
                        </span>
                      )}
                    </div>

                    {currentItem.question.correctOptionIndex !== null && currentItem.question.correctOptionIndex !== undefined ? (
                      <p className="text-sm font-bold leading-6 text-slate-900 dark:text-slate-100">
                        Đáp án đúng:{' '}
                        <span className="text-emerald-700 dark:text-emerald-200">
                          {currentItem.question.options[currentItem.question.correctOptionIndex]?.label ||
                            String.fromCharCode(65 + currentItem.question.correctOptionIndex)}
                          {currentItem.question.options[currentItem.question.correctOptionIndex]?.text
                            ? ` - ${currentItem.question.options[currentItem.question.correctOptionIndex]?.text}`
                            : ''}
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm font-bold leading-6 text-slate-900 dark:text-slate-100">
                        Chưa có đáp án chắc chắn cho câu này.
                      </p>
                    )}

                    {currentItem.question.explanation && (
                      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
                        {currentItem.question.explanation}
                      </p>
                    )}

                    {currentItem.question.aiNotes && (
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
                        Ghi chú AI: {currentItem.question.aiNotes}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => moveQuestion(-1)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      disabled={currentQuestionIndex === 0}
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Câu trước
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkToggle}
                      className={cn(
                        'inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold shadow-sm transition-colors',
                        markedQuestions.has(currentQuestionKey)
                          ? 'border-amber-300 bg-amber-50 text-slate-950 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-100'
                          : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
                      )}
                    >
                      <Bookmark className="h-5 w-5" />
                      {markedQuestions.has(currentQuestionKey) ? 'Đã đánh dấu' : 'Đánh dấu'}
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(1)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#008a67] bg-white px-4 text-sm font-extrabold text-[#007a5a] shadow-sm transition-colors hover:bg-[#effaf6] disabled:opacity-50 dark:bg-slate-950"
                      disabled={currentQuestionIndex === activeQuestions.length - 1}
                    >
                      Câu tiếp
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <aside className="space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-base font-black uppercase tracking-wide text-slate-900 dark:text-white">Câu hỏi</h2>
              <div className="grid grid-cols-5 gap-2">
                {activeQuestions.map((item, index) => {
                  const current = index === currentQuestionIndex;
                  const answered = answeredQuestions.has(item.key);
                  const marked = markedQuestions.has(item.key);

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={cn(
                        'h-8 rounded-lg border text-xs font-black transition-colors',
                        current && 'border-transparent bg-[#008a67] text-white shadow-sm',
                        !current && marked && 'border-amber-300 bg-amber-50 text-slate-950',
                        !current && !marked && answered && 'border-emerald-200 bg-[#effaf6] text-slate-950',
                        !current && !marked && !answered && 'border-slate-200 bg-white text-slate-950 hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'
                      )}
                    >
                      {item.number}
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
                      {answeredCount}/{totalQuestions}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-[#008a67]" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-[80px_1fr_42px] items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Chính xác</span>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: result && result.scorable ? `${(result.correct / result.scorable) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-right font-black text-slate-950 dark:text-white">
                      {result ? `${result.correct}/${result.scorable}` : '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr_42px] items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Đánh dấu</span>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${totalQuestions ? Math.max(8, (markedCount / totalQuestions) * 100) : 0}%` }}
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
