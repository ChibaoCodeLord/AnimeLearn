import { useRef, useEffect, useState } from 'react';
import { Clock, X, Volume2, Sparkles, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import VocabularyAnalysis from './VocabularyAnalysis';

// 1. Định nghĩa cấu trúc của một dòng phụ đề
export interface ScriptLine {
  timestamp: string;
  japanese: string;
  vietnamese: string;
  english?: string;
  vocabulary?: any[];
}

// 2. Định nghĩa Props của component
interface ScriptPanelProps {
  script: ScriptLine[];
  currentIndex: number;
  onLineClick: (index: number) => void;
  currentFurigana: string;
  onWordSelect: (word: string, position: {
    x: number;
    y: number;
    anchorTop?: number;
    anchorBottom?: number;
    anchorLeft?: number;
    anchorRight?: number;
  }) => void;
  showVocabList?: boolean;
  vocabList?: any[];
}

export default function ScriptPanel({
  script,
  currentIndex,
  onLineClick,
  currentFurigana,
  onWordSelect,
  showVocabList = true,
  vocabList = [],
}: ScriptPanelProps) {
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [centeredVocab, setCenteredVocab] = useState<any | null>(null);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeRef.current;

      const scrollToPosition = element.offsetTop - 10;

      container.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>, word: string) => {
    e.stopPropagation();
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();

    onWordSelect(word, {
      x: rect.left + rect.width / 2,
      y: rect.bottom,
      anchorTop: rect.top,
      anchorBottom: rect.bottom,
      anchorLeft: rect.left,
      anchorRight: rect.right,
    });
  };

  const extractKanjiFromRuby = (htmlString: string) => {
    return htmlString
      .replace(/<r[pt]>[\s\S]*?<\/r[pt]>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  };

  const wordClassName = `
    inline-block
    my-1.5
    leading-loose
    cursor-pointer
    rounded-md
    px-0.5
    underline
    decoration-teal-400
    decoration-2
    underline-offset-4
    transition-colors
    hover:bg-amber-100
    hover:text-amber-700
    hover:decoration-amber-400
    dark:hover:bg-amber-400/15
    dark:hover:text-amber-200
    dark:hover:decoration-amber-300
  `;

  const rubyWordClassName = `
    inline-block
    my-1.5
    leading-loose
    cursor-pointer
    rounded-md
    px-0.5
    underline
    decoration-teal-400
    decoration-2
    underline-offset-4
    transition-colors
    hover:bg-amber-100
    hover:text-amber-700
    hover:decoration-amber-400
    dark:hover:bg-amber-400/15
    dark:hover:text-amber-200
    dark:hover:decoration-amber-300

    [&_ruby]:mx-[1px]
    [&_rt]:text-[0.65em]
    [&_rt]:font-bold
    [&_rt]:text-teal-600
    [&_rt]:pb-[2px]
    [&_rt]:tracking-normal
    [&_rt]:pointer-events-none
    [&_rt]:select-none
  `;

  const renderJapaneseText = (text: string, isCurrentLineFurigana?: boolean) => {
    if (isCurrentLineFurigana && currentFurigana) {
      const parts = currentFurigana.split(/(<ruby>[\s\S]*?<\/ruby>)/);

      return parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith('<ruby>')) {
          const word = extractKanjiFromRuby(part);

          return (
            <span
              key={`ruby-${index}`}
              className={rubyWordClassName}
              onClick={(e) => handleWordClick(e, word)}
              dangerouslySetInnerHTML={{ __html: part }}
            />
          );
        }

        try {
          const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
          const segments = Array.from(segmenter.segment(part));

          return segments.map((seg, i) => {
            if (seg.segment.trim() === '') {
              return <span key={`text-${index}-${i}`}>{seg.segment}</span>;
            }

            return (
              <span
                key={`text-${index}-${i}`}
                className={wordClassName}
                onClick={(e) => handleWordClick(e, seg.segment)}
              >
                {seg.segment}
              </span>
            );
          });
        } catch (e) {
          const segments = part.split(/(\s+)/);

          return segments.map((segment, i) => {
            if (segment.trim() === '') {
              return <span key={`text-${index}-${i}`}>{segment}</span>;
            }

            return (
              <span
                key={`text-${index}-${i}`}
                className={wordClassName}
                onClick={(e) => handleWordClick(e, segment)}
              >
                {segment}
              </span>
            );
          });
        }
      });
    }

    try {
      const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));

      return segments.map((seg, i) => {
        if (seg.segment.trim() === '') return <span key={i}>{seg.segment}</span>;

        return (
          <span
            key={i}
            className={wordClassName}
            onClick={(e) => handleWordClick(e, seg.segment)}
          >
            {seg.segment}
          </span>
        );
      });
    } catch (e) {
      const segments = text.split(/(\s+)/);

      return segments.map((segment, i) => {
        if (segment.trim() === '') return <span key={i}>{segment}</span>;

        return (
          <span
            key={i}
            className={wordClassName}
            onClick={(e) => handleWordClick(e, segment)}
          >
            {segment}
          </span>
        );
      });
    }
  };

  const playAudio = (word: string) => {
    if (!word) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  let hanViet = '';
  let meaningLines: string[] = [];

  if (centeredVocab?.meaning) {
    const lines = centeredVocab.meaning
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean);

    if (lines.length > 0 && lines[0] === lines[0].toUpperCase() && !lines[0].match(/^[0-9]/)) {
      hanViet = lines[0];
      meaningLines = lines.slice(1);
    } else {
      meaningLines = lines;
    }
  }

  if (!script || script.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-white via-emerald-50 to-sky-50 text-center px-6 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950">
        <div className="w-16 h-16 rounded-2xl bg-white border border-teal-100 shadow-sm flex items-center justify-center dark:border-teal-800 dark:bg-slate-900">
          <Sparkles className="w-8 h-8 text-teal-400" />
        </div>
        <p className="text-sm font-medium text-slate-500">
          Chưa có kịch bản. Nhấn "Tạo Script AI" để bắt đầu.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="
          h-full
          overflow-y-auto
          custom-scrollbar
          relative
          bg-gradient-to-b
        "
      >
        <div className="space-y-2.5 p-3 md:pb-200 xl:pb-200">
          {script.map((line, index) => {
            const isActive = index === currentIndex;

            return (
              <div
                key={index}
                ref={isActive ? activeRef : null}
                onClick={() => onLineClick(index)}
                className={`
                  relative
                  min-w-0
                  cursor-pointer
                  rounded-2xl
                  border
                  p-2.5
                  px-3
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? 'border-teal-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 shadow-md shadow-teal-100/70 dark:border-teal-500/70 dark:from-slate-900 dark:via-teal-950 dark:to-slate-900 dark:shadow-teal-950/40'
                      : 'border-slate-400 bg-white/90 hover:border-slate-800 hover:bg-slate-100/80 hover:shadow-sm transition-colors duration-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-teal-600 dark:hover:bg-slate-800/90'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                )}

                <div className="flex items-center justify-between gap-2 pl-1 mb-1">
                  <div
                    className={`
                      inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1
                      ${
                        isActive
                          ? 'border-teal-200 bg-white/90 text-teal-700 shadow-xs dark:border-teal-700 dark:bg-teal-950/45 dark:text-teal-200'
                          : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }
                    `}
                  >
                    <Clock
                      className={`
                        w-3 h-3
                        ${isActive ? 'text-teal-500' : 'text-slate-400'}
                      `}
                    />
                    <span className="text-[11px] font-mono font-semibold">
                      {line.timestamp}
                    </span>
                  </div>

                  {isActive && (
                    <span className="text-[11px] font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-1 rounded-full shadow-xs">
                      Đang phát
                    </span>
                  )}
                </div>

                <p
                  className={`
                    pl-1
                    text-lg
                    leading-relaxed
                    font-semibold
                    tracking-wide
                    wrap-anywhere
                    ${
                      isActive
                        ? 'text-slate-900 dark:text-slate-50'
                        : 'text-slate-800 dark:text-slate-200'
                    }
                  `}
                >
                  {renderJapaneseText(line.japanese, isActive)}
                </p>

                <p
                  className={`
                    pl-1 mt-1.5
                    text-base
                    leading-relaxed
                    font-medium
                    wrap-anywhere
                    ${
                      isActive
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }
                  `}
                >
                  {line.vietnamese}
                </p>

                {line.english && (
                  <p className="pl-1 mt-1 text-xs leading-relaxed text-slate-400 wrap-anywhere">
                    {line.english}
                  </p>
                )}

                {line.vocabulary && line.vocabulary.length > 0 && (
                  <div
                    className={`
                      grid
                      transition-all
                      duration-300
                      ease-out
                      ${
                        showVocabList
                          ? 'grid-rows-[1fr] opacity-100 mt-3'
                          : 'grid-rows-[0fr] opacity-0 mt-0'
                      }
                    `}
                  >
                    <div className="overflow-hidden">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="
                          rounded-2xl
                          border border-teal-100/70
                          bg-gradient-to-br from-white via-emerald-50/40 to-amber-50/30
                          dark:border-teal-800/70
                          dark:from-slate-900
                          dark:via-emerald-950/50
                          dark:to-slate-900
                          transition-all
                          duration-300
                          ease-out
                        "
                      >
                        <VocabularyAnalysis
                          vocabulary={line.vocabulary}
                          onWordClick={(vocabData: any) => {
                            const enriched = vocabList.find((v: any) => v.word === vocabData.word);
                            setCenteredVocab(enriched ? { ...vocabData, ...enriched } : vocabData);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {centeredVocab && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            p-4
            bg-slate-950/45
            backdrop-blur-sm
            transition-all
          "
          onClick={() => setCenteredVocab(null)}
        >
          <div
            className="
              relative
              w-full max-w-lg
              overflow-hidden
              rounded-3xl
              border border-teal-100
              bg-white
              dark:border-teal-800
              dark:bg-slate-950
              shadow-2xl
              animate-in zoom-in-95 duration-200
              overscroll-contain
            "
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCenteredVocab(null)}
              className="
                absolute top-4 right-4 z-10
                p-2
                rounded-full
                text-slate-400
                bg-white/80
                border border-slate-200
                dark:bg-slate-900/90
                dark:border-slate-700
                dark:text-slate-300
                shadow-sm
                transition-colors
                hover:text-rose-500
                hover:bg-rose-50
                hover:border-rose-100
              "
              aria-label="Đóng modal từ vựng"
            >
              <X className="w-5 h-5" />
            </button>

            <div
              className="
                relative
                shrink-0
                border-b border-teal-100
                bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50
                dark:border-teal-800
                dark:from-slate-900
                dark:via-teal-950
                dark:to-slate-900
                p-7
              "
            >
              <div className="pr-10">
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-teal-700 font-bold text-base tracking-widest">
                    {centeredVocab.reading || '???'}
                  </p>

                  <button
                    onClick={() => playAudio(centeredVocab.word)}
                    className="
                      inline-flex items-center justify-center
                      w-9 h-9
                      rounded-full
                      bg-white
                      border border-teal-100
                      text-teal-600
                      dark:bg-slate-900
                      dark:border-teal-800
                      dark:text-teal-300
                      shadow-sm
                      transition-colors
                      hover:bg-teal-100
                      hover:text-teal-700
                      active:scale-95
                    "
                    aria-label="Phát âm từ vựng"
                  >
                    <Volume2 className="w-4.5 h-4.5" />
                  </button>
                </div>

                <h3 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
                  {centeredVocab.word}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                {hanViet && (
                  <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-700 border-none font-bold text-sm tracking-widest px-3 py-1 shadow-xs">
                    {hanViet}
                  </Badge>
                )}

                {centeredVocab.pos && (
                  <Badge
                    variant="outline"
                    className="bg-white text-teal-700 border-teal-200 text-sm px-3 py-1 font-semibold"
                  >
                    {centeredVocab.pos}
                  </Badge>
                )}
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto overscroll-contain custom-scrollbar bg-white dark:bg-slate-950">
              <div className="p-7 pb-6">
                {meaningLines.length > 0 ? (
                  <ul className="space-y-3.5">
                    {meaningLines.map((line, idx) => {
                      const match = line.match(/^([0-9]+\.)(.*)/);

                      if (match) {
                        return (
                          <li
                            key={idx}
                            className="
                              flex gap-3
                              rounded-2xl
                              bg-gradient-to-r from-slate-50 to-teal-50/40
                              border border-teal-100/70
                              dark:from-slate-900
                              dark:to-teal-950/40
                              dark:border-teal-800/70
                              px-4 py-3
                              text-slate-700
                              text-base
                              leading-relaxed
                            "
                          >
                            <span className="font-black text-teal-500 shrink-0 select-none">
                              {match[1]}
                            </span>
                            <span className="font-medium">{match[2]}</span>
                          </li>
                        );
                      }

                      return (
                        <li
                          key={idx}
                          className="
                            relative
                            rounded-2xl
                            bg-gradient-to-r from-slate-50 to-emerald-50/40
                            border border-teal-100/70
                            dark:from-slate-900
                            dark:to-emerald-950/40
                            dark:border-teal-800/70
                            px-4 py-3 pl-7
                            text-slate-700
                            text-base
                            leading-relaxed
                            font-medium
                            before:absolute
                            before:left-4
                            before:top-5
                            before:w-2
                            before:h-2
                            before:bg-teal-400
                            before:rounded-full
                          "
                        >
                          {line}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-6 italic">
                    <Sparkles className="w-8 h-8 text-teal-300" />
                    <span className="text-base">Chưa có định nghĩa chi tiết cho từ này.</span>
                  </div>
                )}
              </div>

              {centeredVocab.kanji_info && centeredVocab.kanji_info.length > 0 && (
                <div className="px-7 py-6 border-t border-dashed border-teal-200 bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:border-teal-800 dark:from-slate-900 dark:to-emerald-950/45">
                  <p className="text-[12px] font-bold text-teal-700 mb-4 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Phân tích Hán Tự
                  </p>

                  <div className="space-y-3">
                    {centeredVocab.kanji_info.map((kanji: any, idx: number) => {
                      const shortDetail = kanji.detail
                        ? kanji.detail.split(/[,;]/).slice(0, 3).join(', ').trim()
                        : '';

                      const hasMore = kanji.detail && kanji.detail.split(/[,;]/).length > 3;

                      return (
                        <div
                          key={idx}
                          className="
                            flex items-start
                            rounded-2xl
                            border border-teal-100
                            bg-white
                            dark:border-teal-800
                            dark:bg-slate-900
                            p-4
                            shadow-sm
                          "
                        >
                          <div
                            className="
                              mr-5 mt-1
                              w-12
                              flex-shrink-0
                              text-center
                              text-4xl
                              font-black
                              text-teal-600
                            "
                          >
                            {kanji.kanji}
                          </div>

                          <div className="flex-1 min-w-0 text-sm">
                            <p className="font-bold text-slate-800 text-[15px] mb-1">
                              {kanji.mean}
                              <span className="font-normal text-slate-400 text-xs ml-1">
                                (N{kanji.level} • {kanji.stroke_count} nét)
                              </span>
                            </p>

                            {shortDetail && (
                              <p
                                className="
                                  text-slate-500
                                  text-xs
                                  mb-2.5
                                  leading-relaxed
                                  italic
                                  border-l-2
                                  border-amber-200
                                  pl-2.5
                                  line-clamp-2
                                "
                              >
                                {shortDetail}
                                {hasMore ? '...' : ''}
                              </p>
                            )}

                            <div className="grid grid-cols-[40px_1fr] gap-x-2 gap-y-1.5 text-[12px] mt-2 pt-2 border-t border-teal-100">
                              <span className="text-teal-600 font-bold uppercase">Kun</span>
                              <span className="text-slate-600 break-words font-medium">
                                {kanji.kun || '-'}
                              </span>

                              <span className="text-teal-600 font-bold uppercase">On</span>
                              <span className="text-slate-600 break-words font-medium">
                                {kanji.on || '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
