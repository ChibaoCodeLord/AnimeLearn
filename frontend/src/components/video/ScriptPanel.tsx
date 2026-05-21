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
  onWordSelect: (word: string, position: { x: number; y: number }) => void;
  showVocabList?: boolean; // Tùy chọn ẩn/hiện danh sách từ vựng
  vocabList?: any[];
}

export default function ScriptPanel({
  script,
  currentIndex,
  onLineClick,
  onWordSelect,
  showVocabList = true, // Mặc định là hiện
  vocabList = [],
}: ScriptPanelProps) {
  const activeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // STATE QUẢN LÝ MODAL TỪ VỰNG Ở GIỮA MÀN HÌNH
  const [centeredVocab, setCenteredVocab] = useState<any | null>(null);

  // HIỆU ỨNG CUỘN ĐỈNH NHẤT QUÁN
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeRef.current;

      // Lấy chính xác vị trí đỉnh của thẻ, trừ đi 16px (bằng đúng padding-top của container)
      const scrollToPosition = element.offsetTop - 16;

      container.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  const handleWordClick = (e: React.MouseEvent<HTMLSpanElement>, word: string) => {
    e.stopPropagation();
    const target = e.target as HTMLSpanElement;
    const rect = target.getBoundingClientRect();
    onWordSelect(word, { x: rect.left, y: rect.bottom });
  };

  const renderJapaneseText = (text: string) => {
    try {
      const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text));

      return segments.map((seg, i) => {
        if (seg.segment.trim() === '') return <span key={i}>{seg.segment}</span>;

        return (
          <span
            key={i}
            className="
              cursor-pointer
              rounded-md
              px-0.5
              underline
              decoration-emerald-300
              decoration-2
              underline-offset-4
              transition-colors
              hover:bg-emerald-100
              hover:text-emerald-700
              hover:decoration-emerald-400
            "
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
            className="
              cursor-pointer
              rounded-md
              px-0.5
              underline
              decoration-emerald-200
              decoration-2
              underline-offset-4
              transition-colors
              hover:bg-emerald-100
              hover:text-emerald-700
              hover:decoration-emerald-400
            "
            onClick={(e) => handleWordClick(e, segment)}
          >
            {segment}
          </span>
        );
      });
    }
  };

  // Hàm phát âm Audio cho Modal trung tâm
  const playAudio = (word: string) => {
    if (!word) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Logic bóc tách Hán Việt cho Modal trung tâm
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
      <div className="h-full flex flex-col items-center justify-center gap-3 bg-white text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-emerald-400" />
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
          bg-white
        "
      >
        <div className="space-y-2 p-3">
          {script.map((line, index) => {
            const isActive = index === currentIndex;

            return (
              <div
                key={index}
                ref={isActive ? activeRef : null}
                onClick={() => onLineClick(index)}
                className={`
                  relative
                  cursor-pointer
                  rounded-2xl
                  border
                  p-2
                  px-3
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white shadow-sm'
                      : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-emerald-500" />
                )}

                <div className="flex items-center justify-between pl-1 mb-1">
                  <div
                    className={`
                      inline-flex items-center gap-1.5 rounded-full border-slate-600 px-2.5 py-1
                      ${
                        isActive
                          ? 'border-emerald-200 bg-white text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }
                    `}
                  >
                    <Clock
                      className={`
                        w-2 h-2
                        ${isActive ? 'text-emerald-500' : 'text-slate-400'}
                      `}
                    />
                    <span className="text-[11px] font-mono font-semibold">
                      {line.timestamp}
                    </span>
                  </div>

                  {isActive && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
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
                        ? 'text-slate-900'
                        : 'text-slate-800'
                    }
                  `}
                >
                  {renderJapaneseText(line.japanese)}
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
                        ? 'text-slate-700'
                        : 'text-slate-500'
                    }
                  `}
                >
                  {line.vietnamese}
                </p>

                {line.english && (
                  <p className="pl-1 mt-1 text-xs leading-relaxed text-slate-400">
                    {line.english}
                  </p>
                )}

                {/* Chỉ hiện danh sách từ vựng khi showVocabList = true */}
                {showVocabList && line.vocabulary && line.vocabulary.length > 0 && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 rounded-2xl bg-white/70"
                  >
                    <VocabularyAnalysis
                      vocabulary={line.vocabulary}
                      onWordClick={(vocabData: any) => {
                        // ✨ LOGIC GHÉP DATA: Tìm Kanji trong kho tổng vocabList
                        const enriched = vocabList.find((v: any) => v.word === vocabData.word);

                        // Ghép thông tin Kanji vào từ vựng trước khi hiện Modal
                        setCenteredVocab(enriched ? { ...vocabData, ...enriched } : vocabData);
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL TỪ VỰNG TRUNG TÂM */}
      {/* ======================================================== */}
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
              border border-slate-200
              bg-white
              shadow-2xl
              animate-in zoom-in-95 duration-200
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút tắt */}
            <button
              onClick={() => setCenteredVocab(null)}
              className="
                absolute top-4 right-4 z-10
                p-2
                rounded-full
                text-slate-400
                bg-white/80
                border border-slate-200
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

            {/* HEADER */}
            <div
              className="
                relative
                shrink-0
                border-b border-emerald-100
                bg-gradient-to-br from-emerald-50 via-teal-50 to-white
                p-7
              "
            >
              <div className="pr-10">
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-emerald-600 font-bold text-base tracking-widest">
                    {centeredVocab.reading || '???'}
                  </p>

                  <button
                    onClick={() => playAudio(centeredVocab.word)}
                    className="
                      inline-flex items-center justify-center
                      w-9 h-9
                      rounded-full
                      bg-white
                      border border-emerald-100
                      text-emerald-600
                      shadow-sm
                      transition-colors
                      hover:bg-emerald-100
                      hover:text-emerald-700
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
                  <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-700 border-none font-bold text-sm tracking-widest px-3 py-1 shadow-xs">
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

            {/* NỘI DUNG CUỘN */}
            <div className="max-h-[55vh] overflow-y-auto overscroll-contain custom-scrollbar bg-white">
              {/* BODY: ĐỊNH NGHĨA */}
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
                              bg-slate-50
                              border border-slate-100
                              px-4 py-3
                              text-slate-700
                              text-base
                              leading-relaxed
                            "
                          >
                            <span className="font-black text-emerald-500 shrink-0 select-none">
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
                            bg-slate-50
                            border border-slate-100
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
                            before:bg-emerald-400
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
                    <Sparkles className="w-8 h-8 text-emerald-300" />
                    <span className="text-base">Chưa có định nghĩa chi tiết cho từ này.</span>
                  </div>
                )}
              </div>

              {/* BẢNG PHÂN TÍCH KANJI CHO TỪ VỰNG */}
              {centeredVocab.kanji_info && centeredVocab.kanji_info.length > 0 && (
                <div className="px-7 py-6 border-t border-dashed border-emerald-200 bg-slate-50/80">
                  <p className="text-[12px] font-bold text-emerald-600 mb-4 uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Phân tích Hán Tự
                  </p>

                  <div className="space-y-3">
                    {centeredVocab.kanji_info.map((kanji: any, idx: number) => {
                      // Rút gọn ý nghĩa Kanji nếu nó dài
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
                            border border-emerald-100
                            bg-white
                            p-4
                            shadow-sm
                          "
                        >
                          {/* Chữ Kanji to */}
                          <div
                            className="
                              mr-5 mt-1
                              w-12
                              flex-shrink-0
                              text-center
                              text-4xl
                              font-black
                              text-emerald-600
                            "
                          >
                            {kanji.kanji}
                          </div>

                          {/* Chi tiết Kanji */}
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
                                  border-emerald-200
                                  pl-2.5
                                  line-clamp-2
                                "
                              >
                                {shortDetail}
                                {hasMore ? '...' : ''}
                              </p>
                            )}

                            <div className="grid grid-cols-[40px_1fr] gap-x-2 gap-y-1.5 text-[12px] mt-2 pt-2 border-t border-emerald-100">
                              <span className="text-emerald-500 font-bold uppercase">Kun</span>
                              <span className="text-slate-600 break-words font-medium">
                                {kanji.kun || '-'}
                              </span>

                              <span className="text-emerald-500 font-bold uppercase">On</span>
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