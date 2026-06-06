import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Headphones,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ExamLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
type ExamSectionKind = 'vocabulary' | 'grammar' | 'listening' | 'reading';
type SortMode = 'newest' | 'oldest';

interface ExamSection {
  kind: ExamSectionKind;
  name: string;
  minutes: number;
}

interface ExamPaper {
  id: string;
  level: ExamLevel;
  title: string;
  subtitle: string;
  year: number;
  month: number;
  isNew?: boolean;
  sections: ExamSection[];
}

const filters: Array<ExamLevel | 'all'> = ['all', 'N1', 'N2', 'N3', 'N4', 'N5'];
const totalAvailable = 142;

const sectionIconMap: Record<ExamSectionKind, LucideIcon> = {
  vocabulary: BookOpen,
  grammar: FileText,
  listening: Headphones,
  reading: BookOpen,
};

const levelStyles: Record<ExamLevel, { badge: string }> = {
  N1: {
    badge: 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-100',
  },
  N2: {
    badge: 'border-[#00b894] bg-[#dff8ee] text-[#007a5a] dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-100',
  },
  N3: {
    badge: 'border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-400 dark:bg-amber-500/20 dark:text-amber-100',
  },
  N4: {
    badge: 'border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-400 dark:bg-violet-500/20 dark:text-violet-100',
  },
  N5: {
    badge: 'border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-400 dark:bg-rose-500/20 dark:text-rose-100',
  },
};

const mockExamPapers: ExamPaper[] = [
  {
    id: 'jlpt-n2-2023-12',
    level: 'N2',
    title: 'Đề thi tháng 12/2023',
    subtitle: 'Kỳ thi JLPT chính thức',
    year: 2023,
    month: 12,
    isNew: true,
    sections: [
      { kind: 'vocabulary', name: 'Từ vựng / Chữ Hán', minutes: 30 },
      { kind: 'grammar', name: 'Ngữ pháp / Đọc hiểu', minutes: 75 },
      { kind: 'listening', name: 'Nghe hiểu', minutes: 50 },
    ],
  },
  {
    id: 'jlpt-n2-2023-07',
    level: 'N2',
    title: 'Đề thi tháng 07/2023',
    subtitle: 'Kỳ thi JLPT chính thức',
    year: 2023,
    month: 7,
    sections: [
      { kind: 'vocabulary', name: 'Từ vựng / Chữ Hán', minutes: 30 },
      { kind: 'grammar', name: 'Ngữ pháp / Đọc hiểu', minutes: 75 },
      { kind: 'listening', name: 'Nghe hiểu', minutes: 50 },
    ],
  },
  {
    id: 'jlpt-n1-2022-12',
    level: 'N1',
    title: 'Đề thi tháng 12/2022',
    subtitle: 'Kỳ thi JLPT chính thức',
    year: 2022,
    month: 12,
    sections: [
      { kind: 'reading', name: 'Kiến thức ngôn ngữ / Đọc', minutes: 110 },
      { kind: 'listening', name: 'Nghe hiểu', minutes: 60 },
    ],
  },
  {
    id: 'jlpt-n3-2023-12',
    level: 'N3',
    title: 'Đề thi tháng 12/2023',
    subtitle: 'Kỳ thi JLPT chính thức',
    year: 2023,
    month: 12,
    sections: [
      { kind: 'vocabulary', name: 'Từ vựng / Chữ Hán', minutes: 30 },
      { kind: 'grammar', name: 'Ngữ pháp / Đọc hiểu', minutes: 70 },
      { kind: 'listening', name: 'Nghe hiểu', minutes: 40 },
    ],
  },
  {
    id: 'jlpt-n3-2023-07',
    level: 'N3',
    title: 'Đề thi tháng 07/2023',
    subtitle: 'Kỳ thi JLPT chính thức',
    year: 2023,
    month: 7,
    sections: [
      { kind: 'vocabulary', name: 'Từ vựng / Chữ Hán', minutes: 30 },
      { kind: 'grammar', name: 'Ngữ pháp / Đọc hiểu', minutes: 70 },
      { kind: 'listening', name: 'Nghe hiểu', minutes: 40 },
    ],
  },
  {
    id: 'jlpt-n3-2022-12',
    level: 'N3',
    title: 'Đề thi tháng 12/2022',
    subtitle: 'Kỳ thi JLPT chính thức',
    year: 2022,
    month: 12,
    sections: [
      { kind: 'vocabulary', name: 'Từ vựng / Chữ Hán', minutes: 30 },
      { kind: 'grammar', name: 'Ngữ pháp / Đọc hiểu', minutes: 70 },
      { kind: 'listening', name: 'Nghe hiểu', minutes: 40 },
    ],
  },
  {
    id: 'jlpt-n4-2022-07',
    level: 'N4',
    title: 'Đề thi tháng 07/2022',
    subtitle: 'Kỳ thi JLPT chính thức',
    year: 2022,
    month: 7,
    sections: [
      { kind: 'vocabulary', name: 'Từ vựng / Chữ Hán', minutes: 25 },
      { kind: 'grammar', name: 'Ngữ pháp / Đọc hiểu', minutes: 55 },
      { kind: 'listening', name: 'Nghe hiểu', minutes: 35 },
    ],
  },
  {
    id: 'jlpt-n5-2021-12',
    level: 'N5',
    title: 'Đề thi tháng 12/2021',
    subtitle: 'Kỳ thi JLPT chính thức',
    year: 2021,
    month: 12,
    sections: [
      { kind: 'vocabulary', name: 'Từ vựng / Chữ Hán', minutes: 20 },
      { kind: 'grammar', name: 'Ngữ pháp / Đọc hiểu', minutes: 40 },
      { kind: 'listening', name: 'Nghe hiểu', minutes: 30 },
    ],
  },
];

function getDateKey(paper: ExamPaper) {
  return paper.year * 100 + paper.month;
}

function ExamCard({ paper }: { paper: ExamPaper }) {
  const styles = levelStyles[paper.level];

  return (
    <article className="group relative flex min-h-[306px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {paper.isNew && (
        <span className="absolute right-5 top-0 rounded-b-xl bg-[#20b486] px-5 py-1.5 text-xs font-bold text-white shadow-sm">
          Mới
        </span>
      )}

      <div className="relative z-10 mb-6 flex items-start justify-between gap-4">
        <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-full border-2 text-base font-black leading-none shadow-[0_1px_0_rgba(15,23,42,0.04)]', styles.badge)}>
          {paper.level}
        </span>
        <button
          type="button"
          className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-300"
          aria-label={`Lưu ${paper.title} ${paper.level}`}
        >
          <Bookmark className="h-5 w-5" />
        </button>
      </div>

      <div className="relative z-10">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          {paper.title}
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{paper.subtitle}</p>
      </div>

      <div className="relative z-10 mt-6 space-y-3 border-b border-slate-100 pb-5 dark:border-slate-800">
        {paper.sections.map(section => {
          const Icon = sectionIconMap[section.kind];

          return (
            <div key={`${paper.id}-${section.name}`} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                <Icon className="h-4 w-4 shrink-0 text-slate-700 dark:text-slate-300" />
                <span className="truncate">{section.name}</span>
              </span>
              <span className="shrink-0 font-bold text-slate-950 dark:text-white">{section.minutes} phút</span>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mt-auto pt-6">
        <button
          type="button"
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-transparent bg-[#008a67] px-5 text-base font-extrabold text-white shadow-sm transition-colors hover:bg-[#007a5a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:focus-visible:ring-emerald-500/25"
        >
          Luyện tập
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

export default function ExamLibrary() {
  const [selectedLevel, setSelectedLevel] = useState<ExamLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const filteredPapers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return mockExamPapers
      .filter(paper => {
        const matchesLevel = selectedLevel === 'all' || paper.level === selectedLevel;
        const searchable = [
          paper.title,
          paper.subtitle,
          paper.level,
          paper.year,
          String(paper.month).padStart(2, '0'),
        ]
          .join(' ')
          .toLowerCase();

        return matchesLevel && (!normalizedSearch || searchable.includes(normalizedSearch));
      })
      .sort((a, b) => (sortMode === 'newest' ? getDateKey(b) - getDateKey(a) : getDateKey(a) - getDateKey(b)));
  }, [searchTerm, selectedLevel, sortMode]);

  return (
    <div className="min-h-full bg-[#f8fafc] px-4 py-6 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-8 px-6 py-9 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">
                Kho đề thi <span className="text-[#007a5a] dark:text-emerald-300">JLPT</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium text-slate-600 dark:text-slate-400">
                Luyện tập với đề thi chính thức từ năm 2010 đến nay
              </p>
            </div>

            <div className="self-start lg:self-center">
              <div className="text-right">
                <p className="text-4xl font-black leading-none text-slate-950 dark:text-white">{totalAvailable}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">đề thi có sẵn</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <label className="relative block w-full xl:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Tìm theo năm, tháng (VD: 2023, 07)"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/15"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {filters.map(filter => {
                const active = selectedLevel === filter;
                const label = filter === 'all' ? 'Tất cả' : filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedLevel(filter)}
                    className={cn(
                      'h-11 min-w-20 rounded-full border px-5 text-sm font-bold transition-all',
                      active
                        ? 'border-transparent bg-[#007a5a] text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setSortMode(current => (current === 'newest' ? 'oldest' : 'newest'))}
              className="inline-flex h-12 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortMode === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </section>

        {filteredPapers.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {filteredPapers.map(paper => (
              <ExamCard key={paper.id} paper={paper} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-lg font-bold text-slate-900 dark:text-white">Không tìm thấy đề thi phù hợp</p>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              Hãy thử đổi cấp độ hoặc nhập năm/tháng khác.
            </p>
          </div>
        )}

        <nav className="flex items-center justify-center gap-2 pt-1" aria-label="Phân trang kho đề thi">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          {[1, 2, 3].map(page => (
            <button
              key={page}
              type="button"
              className={cn(
                'inline-flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold transition-colors',
                page === 1
                  ? 'border-transparent bg-emerald-500 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              )}
            >
              {page}
            </button>
          ))}
          <span className="px-2 text-sm font-bold text-slate-500 dark:text-slate-400">...</span>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            15
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-emerald-200 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  );
}
