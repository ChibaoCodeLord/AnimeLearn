import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { Star, BookOpen, Loader2, Volume2, X, Sparkles, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ApiError } from '@/api/client';
import { kanjiApi } from '@/api/kanji.api';
import { videoApi } from '@/api/video.api';

// 1. Khai báo các Interface
export interface LookupData {
  word: string;
  reading?: string;
  meaning_vi?: string;
  meaning_en?: string;
  jlpt_level?: string;
  example_sentence?: string;
  example_meaning?: string;
  related_words?: string[];
  part_of_speech?: string;
  kanji_info?: any[];
}

interface VocabularyPopupProps {
  word: string | null;
  position: PopupAnchorPosition | null;
  vocabData?: any;
  sentenceContext?: string;
  onClose: () => void;
  onSave?: () => void;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}

type PopupAnchorPosition = {
  x: number;
  y: number;
  anchorTop?: number;
  anchorBottom?: number;
  anchorLeft?: number;
  anchorRight?: number;
};

// Bảng màu JLPT
const jlptBadgeColors: Record<string, string> = {
  N5: 'bg-green-100 text-green-700 border-green-200',
  N4: 'bg-blue-100 text-blue-700 border-blue-200',
  N3: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  N2: 'bg-orange-100 text-orange-700 border-orange-200',
  N1: 'bg-rose-100 text-rose-700 border-rose-200',
  Unknown: 'bg-slate-100 text-slate-600 border-slate-200',
};

// --- Component Chính ---
export default function VocabularyPopup({
  word,
  position,
  onClose,
  onSave,
  vocabData,
  sentenceContext,
  onMouseEnter,
  onMouseLeave,
}: VocabularyPopupProps) {
  const [saving, setSaving] = useState(false);
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const [adjustedPos, setAdjustedPos] = useState({ x: -9999, y: -9999 });

  
  // Click ra ngoài hoặc nhấn Esc thì tự đóng popup
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      const target = event.target as Node;

      if (!popupRef.current) return;

      if (popupRef.current.contains(target)) return;

      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    if (popupRef.current && position) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const PADDING = 12;
      const GAP = 8;

      const anchorX = position.x;
      const anchorTop = position.anchorTop ?? position.y;
      const anchorBottom = position.anchorBottom ?? position.y;

      // X: canh giữa popup theo từ được click, nhưng không cho tràn màn hình
      let newX = anchorX - rect.width / 2;

      if (newX < PADDING) {
        newX = PADDING;
      } else if (newX + rect.width > viewportWidth - PADDING) {
        newX = viewportWidth - rect.width - PADDING;
      }

      // Y: ưu tiên mở dưới từ, nếu chạm đáy thì mở lên trên
      const spaceBelow = viewportHeight - anchorBottom - PADDING;
      const spaceAbove = anchorTop - PADDING;

      const canOpenBelow = spaceBelow >= rect.height + GAP;
      const canOpenAbove = spaceAbove >= rect.height + GAP;

      let newY: number;

      if (canOpenBelow) {
        // Mở ngay dưới cạnh dưới của từ
        newY = anchorBottom + GAP;
      } else if (canOpenAbove) {
        // Mở ngay trên cạnh trên của từ
        newY = anchorTop - rect.height - GAP;
      } else {
        // Nếu cả trên và dưới đều không đủ, đặt popup vào vùng còn lại nhiều hơn
        if (spaceBelow >= spaceAbove) {
          newY = anchorBottom + GAP;
        } else {
          newY = anchorTop - rect.height - GAP;
        }

        // Clamp để không tràn khỏi màn hình
        newY = Math.max(PADDING, Math.min(newY, viewportHeight - rect.height - PADDING));
      }

      setAdjustedPos({ x: newX, y: newY });
    }
  }, [position, lookupData, loading]);

  // 3. Logic Tra Từ & Cứu hộ Kanji lẻ
  useEffect(() => {
    const fetchExtraKanji = async (charArray: string[]) => {
      try {
        const data = await kanjiApi.lookupKanji<{ success?: boolean; data: any[] }>(charArray);

        if (data.success && data.data.length > 0) {
          setLookupData((prev) => {
            if (!prev) return null;

            const currentMeaning = prev.meaning_vi?.trim();
            const isMissingMeaning =
              !currentMeaning ||
              currentMeaning === 'N/A' ||
              currentMeaning === 'Không rõ nghĩa';

            return {
              ...prev,
              kanji_info: data.data,
              meaning_vi: isMissingMeaning ? data.data[0].mean : prev.meaning_vi,
            };
          });
        }
      } catch (e) {
        console.error('Lỗi tra Kanji lẻ:', e);
      }
    };

    if (vocabData && (vocabData.meaning || vocabData.reading || vocabData.pos)) {
      setLookupData({
        word: vocabData.word || word || '',
        reading: vocabData.reading || '',
        meaning_vi: vocabData.meaning || vocabData.meaning_vi || '',
        part_of_speech: vocabData.pos || vocabData.part_of_speech || '',
        jlpt_level: vocabData.jlpt_level || 'Unknown',
        kanji_info: vocabData.kanji_info || [],
      });

      if (!vocabData.kanji_info || vocabData.kanji_info.length === 0) {
        const kanjis = (vocabData.word || word || '')
          .split('')
          .filter((c: string) => c.match(/[\u4e00-\u9faf]/));

        if (kanjis.length > 0) fetchExtraKanji(kanjis);
      }

      setLoading(false);
    } else if (word) {
      lookupWord(word);

      const kanjis = word
        .split('')
        .filter((c: string) => c.match(/[\u4e00-\u9faf]/));

      if (kanjis.length > 0) fetchExtraKanji(kanjis);
    }
  }, [word, vocabData]);

  const lookupWord = async (w: string) => {
    setLoading(true);

    try {
      const data = await videoApi.translateWord<any>(w);

      setLookupData({
        word: data.word || w,
        reading: data.reading || 'chưa rõ',
        meaning_vi: data.meaning_vi || 'Không rõ nghĩa',
        part_of_speech: data.part_of_speech || 'N/A',
      });
    } catch (e) {
      setLookupData({
        word: w,
        reading: 'chưa rõ',
        meaning_vi: 'N/A',
      });
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!lookupData) return;

    setSaving(true);

    try {
      const data = await videoApi.saveWord<{ message?: string }>({
        ...lookupData,
        jlpt_level: lookupData.jlpt_level || 'Unknown',
      });

      toast.success(data.message || 'Đã lưu từ vựng!');

      if (onSave) onSave();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.info(error.message || 'Lỗi khi lưu!');
      } else {
        toast.error('Lỗi kết nối khi lưu!');
      }
    } finally {
      setSaving(false);
    }
  };

  const playAudio = () => {
    if (!lookupData?.word && !word) return;

    const utterance = new SpeechSynthesisUtterance(lookupData?.word || word!);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  if (!word) return null;

  // 4. Bóc tách Hán Việt Header
  let hanVietHeader = '';
  let meaningLines: string[] = [];

  if (lookupData?.meaning_vi) {
    const lines = lookupData.meaning_vi
      .split('\n')
      .map((l: string) => l.trim())
      .filter(Boolean);

    if (
      lines.length > 0 &&
      lines[0] === lines[0].toUpperCase() &&
      !lines[0].match(/^[0-9]/)
    ) {
      hanVietHeader = lines[0];
      meaningLines = lines.slice(1);
    } else {
      meaningLines = lines;
    }
  }

  return (
    <>
      <div
        ref={popupRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="
          fixed z-9999
          flex flex-col
          w-[290px] md:w-[315px]
          max-h-[62vh] md:max-h-[50vh]
          overflow-hidden overscroll-contain
          rounded-2xl
          border border-pink-100
          bg-white
          dark:border-pink-900/60
          dark:bg-slate-950
          shadow-xl 
        "
        style={{
          left: adjustedPos.x,
          top: adjustedPos.y,
          visibility: adjustedPos.x === -9999 ? 'hidden' : 'visible',
        }}
      >
        <button
          onClick={onClose}
          className="
            absolute top-2.5 right-2.5 z-10
            p-1.5
            rounded-full
            text-pink-300
            hover:text-pink-600
            hover:bg-pink-100/60
            transition-colors 
          "
          aria-label="Đóng popup từ vựng"
        >
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="h-32 bg-[#fdf8fa] p-8 flex flex-col items-center justify-center gap-3 dark:bg-slate-950">
            <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
            <p className="text-xs font-medium text-pink-400">
              Đang tra từ điển...
            </p>
          </div>
        ) : lookupData ? (
          <>
            {/* Header compact */}
            <div className="relative shrink-0 border-b border-pink-100/60 bg-[#fbf3f8] px-4 py-3.5 dark:border-pink-900/60 dark:bg-slate-900">
              <div className="pr-8">
                <div className="mb-1 flex items-center gap-2">
                  <p className="truncate text-xs font-bold tracking-widest text-pink-500">
                    {lookupData.reading}
                  </p>

                  <button
                    onClick={playAudio}
                    className="
                      p-1
                      rounded-full
                      text-violet-400
                      hover:text-violet-600
                      hover:bg-violet-100
                      dark:hover:bg-violet-500/20
                      active:scale-95
                      transition-colors
                    "
                    aria-label="Phát âm"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-2xl font-black tracking-tight leading-tight text-slate-800 break-words">
                  {lookupData.word}
                </h3>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {hanVietHeader && (
                  <Badge className="bg-pink-100 text-pink-600 border-none font-bold tracking-widest px-2 py-0.5 text-[10px] shadow-xs">
                    {hanVietHeader}
                  </Badge>
                )}

                {lookupData.part_of_speech && (
                  <Badge
                    variant="outline"
                    className="bg-white text-violet-600 border-violet-100 px-2 py-0.5 text-[10px] font-medium shadow-xs dark:border-violet-800 dark:bg-violet-950/35 dark:text-violet-200"
                  >
                    {lookupData.part_of_speech}
                  </Badge>
                )}

                {lookupData.jlpt_level && lookupData.jlpt_level !== 'Unknown' && (
                  <Badge
                    className={`
                      ${jlptBadgeColors[lookupData.jlpt_level] || 'bg-slate-100 text-slate-600 border-slate-200'}
                      border px-2 py-0.5 text-[10px] font-bold shadow-xs
                    `}
                  >
                    {lookupData.jlpt_level}
                  </Badge>
                )}
              </div>
            </div>

            {/* Body scroll compact */}
            <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar bg-[#fffbfd] dark:bg-slate-950">
              <div className="px-4 py-3">
                {meaningLines.length > 0 && meaningLines[0] !== 'N/A' ? (
                  <ul className="space-y-2">
                    {meaningLines.map((line, idx) => (
                      <li
                        key={idx}
                        className="flex gap-2 text-[13px] leading-relaxed text-slate-700"
                      >
                        <span className="shrink-0 select-none font-black text-pink-400">
                          {idx + 1}.
                        </span>
                        <span className="font-medium">
                          {line.replace(/^[0-9]+\./, '')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-3 text-slate-400 italic">
                    <Sparkles className="w-4 h-4 text-pink-300" />
                    <span className="text-xs">
                      Nghĩa đang được cập nhật qua Kanji...
                    </span>
                  </div>
                )}
              </div>

              {sentenceContext && (
                <div className="border-t border-pink-100 bg-violet-50/30 px-4 py-2.5 dark:border-violet-900/60 dark:bg-violet-950/30">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-500">
                    <Quote className="w-3 h-3" />
                    Ngữ cảnh trong video
                  </p>
                  <p className="text-[12.5px] font-semibold leading-snug text-slate-700">
                    {sentenceContext}
                  </p>
                </div>
              )}

              {lookupData.kanji_info && lookupData.kanji_info.length > 0 && (
                <div className="border-t border-dashed border-pink-200 bg-white px-4 py-3 dark:border-pink-900/70 dark:bg-slate-950">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-pink-400">
                    <BookOpen className="w-3 h-3" />
                    Phân tích Hán Tự
                  </p>

                  <div className="space-y-2">
                    {lookupData.kanji_info.map((kanji: any, idx: number) => {
                      const shortDetail = kanji.detail
                        ?.split(/[,;]/)
                        .slice(0, 3)
                        .join(', ')
                        .trim();

                      return (
                        <div
                          key={idx}
                          className="
                            flex items-start
                            rounded-xl
                            border border-pink-50
                            bg-[#fdf8fa]
                            dark:border-pink-900/60
                            dark:bg-slate-900
                            p-2.5
                            shadow-sm
                          "
                        >
                          <div className="mr-3 w-9 flex-shrink-0 text-center text-2xl font-black text-rose-500">
                            {kanji.kanji}
                          </div>

                          <div className="min-w-0 flex-1 text-xs">
                            <p className="mb-1 text-[12px] font-bold text-slate-800">
                              {kanji.mean}
                              <span className="ml-1 text-[9.5px] font-normal text-slate-400">
                                (N{kanji.level})
                              </span>
                            </p>

                            {shortDetail && (
                              <p className="mb-1.5 line-clamp-2 border-l-2 border-pink-100 pl-2 text-[11px] leading-relaxed text-slate-500 italic">
                                {shortDetail}...
                              </p>
                            )}

                            <div className="mt-1 grid grid-cols-[32px_1fr] gap-x-1 gap-y-0.5 border-t border-pink-50/50 pt-1 text-[10px]">
                              <span className="font-semibold uppercase text-pink-400">
                                Kun
                              </span>
                              <span className="break-words text-slate-600">
                                {kanji.kun || '-'}
                              </span>

                              <span className="font-semibold uppercase text-pink-400">
                                On
                              </span>
                              <span className="break-words text-slate-600">
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

            {/* Footer compact */}
            <div className="shrink-0 border-t border-pink-100 bg-[#fffbfd] p-3 dark:border-pink-900/60 dark:bg-slate-950">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="
                  w-full h-9
                  rounded-xl
                  bg-violet-500
                  hover:bg-violet-600
                  text-white
                  text-xs
                  font-bold
                  shadow-sm
                  transition-colors
                  flex items-center justify-center gap-2
                "
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Star className="w-3.5 h-3.5 fill-white/20" />
                )}
                Lưu vào Sổ tay
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
