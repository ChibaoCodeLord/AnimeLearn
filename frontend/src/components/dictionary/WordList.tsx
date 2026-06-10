import { Loader2, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WordData, KanjiInfo } from './types';

interface WordListProps {
  searchResults: WordData[];
  selectedWord: WordData | null;
  onWordSelect: (word: WordData) => void;
  loading?: boolean;
  lastElementRef?: (node: HTMLLIElement | null) => void;
  // --- Thêm 2 props mới ---
  kanjiResults?: KanjiInfo[];
  onOpenKanji?: (kanji: KanjiInfo) => void;
}
export default function WordList({ 
  searchResults, 
  selectedWord, 
  onWordSelect, 
  loading, 
  lastElementRef,
  kanjiResults = [], // Mặc định là mảng rỗng
  onOpenKanji 
}: WordListProps) {
  if (loading && searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
        <span className="font-medium text-sm">Đang tìm kiếm...</span>
      </div>
    );
  }

  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <p className="font-medium">Không có kết quả phù hợp</p>
      </div>
    );
  }

  return (
  <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-slate-50">
    {kanjiResults.length > 0 && (
      <div className="shrink-0 border-b border-slate-200 bg-rose-50/30 p-5">
        <h3 className="mb-4 flex items-center gap-2 text-[15px] font-black uppercase tracking-[0.2em] text-rose-400">
          <Layers className="h-3.5 w-3.5" />
          Hán tự liên quan
        </h3>

        <div className="flex flex-wrap gap-2">
          {kanjiResults.map((kanji, index) => (
            <button
              type="button"
              key={kanji.kanji || index}
              onClick={() => onOpenKanji?.(kanji)}
              className="group flex items-center gap-2 rounded-xl border border-rose-100 bg-white px-3 py-2 text-rose-600 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
            >
              <span className="text-2xl font-black transition-transform group-hover:scale-110">
                {kanji.kanji}
              </span>

              <div className="flex flex-col items-start leading-none">
                <span className="text-[13px] font-bold uppercase">
                  {kanji.mean}
                </span>

                <span className="text-[13px] font-bold opacity-70">
                  {kanji.level ? `N${kanji.level}` : ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )}

    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <ul className="flex flex-col">
        {searchResults.map((word, index) => {
          const currentWord =
            word.word || word.japanese?.[0]?.word || '';

          const selectedWordText =
            selectedWord?.word || selectedWord?.japanese?.[0]?.word || '';

          const isSelected =
            selectedWord?.id === word.id ||
            selectedWord?._id === word._id ||
            selectedWordText === currentWord;

          const isLast = searchResults.length === index + 1;

          return (
            <li
              key={
                word.id ||
                word._id ||
                word.word ||
                word.japanese?.[0]?.word ||
                index
              }
              ref={isLast ? lastElementRef : null}
              onClick={() => onWordSelect(word)}
              className={`group relative cursor-pointer border-b border-slate-300 p-5 transition-all duration-200 ${
                isSelected
                  ? "border-l-4 border-l-red-400 bg-white shadow-sm"
                  : "border-l-4 border-l-transparent bg-transparent hover:bg-slate-100"
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/5" />

              <div className="relative flex flex-col gap-1.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">
                    {word.word || word.japanese?.[0]?.word || '---'}
                  </span>

                  <span className="text-lg font-bold text-rose-500">
                    {word.reading || word.japanese?.[0]?.reading || ''}
                  </span>
                </div>

                <p className="line-clamp-2 text-sm font-medium leading-relaxed text-slate-600">
                  {Array.isArray(word.meaning)
                    ? word.meaning.join(", ")
                    : word.meaning ||
                      word.meaning_vi ||
                      "Chưa có định nghĩa"}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {word.is_common && (
                    <Badge className="border-none bg-emerald-100 text-[10px] font-bold text-emerald-700">
                      Phổ biến
                    </Badge>
                  )}

                  {word.partOfSpeech && (
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-[10px] font-medium text-blue-700"
                    >
                      {typeof word.partOfSpeech === "string"
                        ? word.partOfSpeech
                        : word.partOfSpeech === 1
                          ? "Danh từ"
                          : word.partOfSpeech === 2
                            ? "Động từ"
                            : "Tính từ"}
                    </Badge>
                  )}

                  {word.pos && !word.partOfSpeech && (
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-[12px] font-medium uppercase text-blue-700"
                    >
                      {word.pos}
                    </Badge>
                  )}

                  {word.jlpt && word.jlpt.length > 0 && (
                    <Badge className="border-none bg-rose-100 text-[10px] font-bold text-rose-700">
                      JLPT {word.jlpt[0].toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        </div>
      )}
    </div>
  </div>
);
}