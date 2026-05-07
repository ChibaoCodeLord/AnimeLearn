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
    // Khóa khung ngoài cùng
    <div className="flex flex-col h-[70vh] w-full bg-slate-50 overflow-hidden overscroll-contain">
      {/* --- PHẦN MỚI: HIỂN THỊ KANJI Ở ĐẦU DANH SÁCH --- */}
        {kanjiResults.length > 0 && (
            <div className="p-5 border-b border-slate-200 bg-rose-50/30">
            <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> Hán tự liên quan
            </h3>
            <div className="flex flex-wrap gap-2">
                {kanjiResults.map((k, i) => (
                <button 
                    key={i} 
                    onClick={() => onOpenKanji?.(k)}
                    className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-rose-500 text-rose-600 hover:text-white rounded-xl transition-all border border-rose-100 shadow-sm group"
                >
                    <span className="text-xl font-black group-hover:scale-110 transition-transform">{k.kanji}</span>
                    <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-bold uppercase">{k.mean}</span>
                    <span className="text-[8px] opacity-60 font-bold">N{k.level}</span>
                    </div>
                </button>
                ))}
            </div>
            </div>
        )}
      {/* Cho phép cuộn phần ruột */}
      <div className="flex-1 overflow-y-scroll custom-scrollbar">
        <ul className="flex flex-col">
          {searchResults.map((word, index) => {
            const isSelected = selectedWord?.id === word.id || selectedWord?._id === word._id;
            const isLast = searchResults.length === index + 1;

            return (
              <li
                key={word.id || word._id || index}
                ref={isLast ? lastElementRef : null}
                onClick={() => onWordSelect(word)}
                className={`group relative cursor-pointer transition-all duration-200 p-5 border-b border-slate-300 ${
                    isSelected
                    ? 'bg-white border-l-4 border-l-red-400 shadow-sm'
                    : 'bg-transparent border-l-4 border-l-transparent hover:bg-slate-100'
                }`}
                >
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-800">{word.word}</span>
                    <span className="text-rose-500 font-bold text-lg">{word.reading}</span>
                  </div>
                  
                  <p className="text-slate-600 font-medium text-sm line-clamp-2 leading-relaxed">
                    {Array.isArray(word.meaning) ? word.meaning.join(', ') : word.meaning || word.meaning_vi || 'Chưa có định nghĩa'}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {word.is_common && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[10px]">Phổ biến</Badge>
                    )}
                    {word.partOfSpeech && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-[10px]">
                        {typeof word.partOfSpeech === 'string' ? word.partOfSpeech : 
                          word.partOfSpeech === 1 ? 'Danh từ' : word.partOfSpeech === 2 ? 'Động từ' : 'Tính từ'}
                      </Badge>
                    )}
                    {word.pos && !word.partOfSpeech && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 uppercase border-blue-200 font-medium text-[12px]">{word.pos}</Badge>
                    )}
                    {word.jlpt && word.jlpt.length > 0 && (
                      <Badge className="bg-rose-100 text-rose-700 border-none font-bold text-[10px]">JLPT {word.jlpt[0].toUpperCase()}</Badge>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {loading && (
          <div className="py-6 flex justify-center"><Loader2 className="w-6 h-6 text-violet-400 animate-spin" /></div>
        )}
      </div>
    </div>
  );
}