import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import WordList from '@/components/dictionary/WordList';
import WordDetail from '@/components/dictionary/WordDetail';
import type { WordData, KanjiInfo } from '@/components/dictionary/types';
import { dictionaryApi } from '@/api/dictionary.api';
import { kanjiApi } from '@/api/kanji.api';

export default function DictionaryPage() {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [results, setResults] = useState<WordData[]>([]);
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [savedWords, setSavedWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalFound, setTotalFound] = useState(0);

  const [kanjiResults, setKanjiResults] = useState<KanjiInfo[]>([]);
  const [selectedKanji, setSelectedKanji] = useState<KanjiInfo | null>(null);
  const [showKanjiModal, setShowKanjiModal] = useState(false);

    // --- 1. XỬ LÝ NHẬP LIỆU (TỰ DO) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // --- 2. DEBOUNCE LOGIC (Chỉ để chờ người dùng gõ xong mới gọi API) ---
  useEffect(() => {
    const handler = setTimeout(() => {
      const finalQuery = inputValue.trim();

      // Chỉ cập nhật searchQuery nếu giá trị thực sự thay đổi
      if (finalQuery !== searchQuery) {
        setSearchQuery(finalQuery);
        setPage(1);
        setResults([]);
        setKanjiResults([]);
        setSelectedWord(null);
      }
    }, 800); // Đợi 800ms sau khi người dùng dừng gõ

    return () => clearTimeout(handler);
  }, [inputValue, searchQuery]);

  useEffect(() => {
    if (!searchQuery) return;

    const fetchDictAndKanji = async () => {
      setLoading(true);
      try {
        const dataDict = await dictionaryApi.searchDictionary<{
          success?: boolean;
          data: WordData[];
          hasMore: boolean;
          total?: number;
        }>({ q: searchQuery, page, limit: 20 });
        
        if (dataDict.success) {
          setResults(prev => page === 1 ? dataDict.data : [...prev, ...dataDict.data]);
          setHasMore(dataDict.hasMore);
          setTotalFound(dataDict.total || 0);
        }

        if (page === 1) {
          const kanjisInQuery = searchQuery.match(/[\u4e00-\u9faf]/g);
          if (kanjisInQuery) {
            const uniqueKanjis = Array.from(new Set(kanjisInQuery));
            const dataKanji = await kanjiApi.lookupKanji<{ success?: boolean; data: KanjiInfo[] }>(uniqueKanjis);
            if (dataKanji.success) setKanjiResults(dataKanji.data);
          }
        }
      } catch (error) {
        console.error("Lỗi fetch dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDictAndKanji();
  }, [searchQuery, page]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLLIElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1);
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handleWordSelect = async (word: WordData) => {
    setSelectedWord(word);
  };

  const saveWord = (word: WordData) => {
    if (!savedWords.some(saved => saved.word === word.word && saved.reading === word.reading)) {
      setSavedWords([...savedWords, word]);
    }
  };

  const playPronunciation = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    window.speechSynthesis.speak(utterance);
  };

  const openKanjiDetail = async (kanji: string) => {
    try {
      const data = await kanjiApi.lookupKanji<{ success?: boolean; data: KanjiInfo[] }>([kanji]);
      if (data.success && data.data.length > 0) {
        setSelectedKanji(data.data[0]);
        setShowKanjiModal(true);
      }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50 h-[calc(100vh-64px)]">
      
      {/* 40% LEFT PANEL: TÌM KIẾM & DANH SÁCH (Khóa overflow-hidden) */}
      <section className="w-full md:w-[40%] h-full flex flex-col border-r border-slate-200 bg-white shrink-0 z-10 shadow-lg md:shadow-none overflow-hidden">
        
        {/* Khối Header Tìm Kiếm (Cố định ở trên) */}
        <div className="p-4 bg-white border-b border-slate-200 shrink-0">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Tra từ (kanji, kana, romaji, tiếng việt)..."
              className="w-full h-12 pl-12 pr-4 bg-slate-100 border-2 border-transparent focus:bg-white focus:border-violet-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
            />
            {loading && page === 1 && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
              </div>
            )}
          </div>
          
          {searchQuery && !loading && (
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>{totalFound} kết quả</span>
              </p>
            </div>
          )}
        </div>

        {/* Khối chứa WordList (WordList tự xử lý scroll) */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          {searchQuery ? (
            <WordList 
              searchResults={results} 
              selectedWord={selectedWord} 
              onWordSelect={handleWordSelect}
              loading={loading}
              lastElementRef={lastElementRef}
              kanjiResults={kanjiResults}
              onOpenKanji={(k) => {
                setSelectedKanji(k);
                setShowKanjiModal(true);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center opacity-60">
              <BookOpen className="w-16 h-16 mb-4 text-slate-300" />
              <p className="font-medium text-lg">Bắt đầu gõ để tra cứu từ vựng</p>
            </div>
          )}
        </div>
      </section>
      
      {/* 60% RIGHT PANEL: CHI TIẾT TỪ VỰNG (Khóa overflow-hidden) */}
      <section className="w-full md:w-[60%] h-full flex flex-col bg-slate-50 overflow-hidden relative">
        {selectedWord ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full w-full">
            <WordDetail 
              word={selectedWord}
              playPronunciation={playPronunciation}
              onSaveWord={saveWord}
              onOpenKanji={openKanjiDetail}
              isSaved={savedWords.some(saved => saved.word === selectedWord.word && saved.reading === selectedWord.reading)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-600 mb-2">Chưa chọn từ vựng</h3>
            <p className="text-slate-500 max-w-sm">Chọn một từ bên cột danh sách để xem chi tiết Hán tự và Ví dụ.</p>
          </div>
        )}
      </section>

      {/* MODAL KANJI */}
      {showKanjiModal && selectedKanji && (
        <div 
          className="fixed inset-0 z-9999 bg-slate-900/60 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200 "
          onClick={() => setShowKanjiModal(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="w-8"></div>
              <Badge className="bg-rose-100 text-rose-700 border-none font-bold uppercase px-4 py-1 rounded-full text-[10px] tracking-widest">
                Phân tích Hán tự
              </Badge>
              <button 
                onClick={() => setShowKanjiModal(false)} 
                className="w-8 h-8 flex items-center justify-center bg-slate-200 hover:bg-rose-500 hover:text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 bg-white">
              <div className="flex gap-8 items-center bg-linear-to-br from-rose-50 to-orange-50 p-8 rounded-[2rem] border border-rose-100 mb-8 shadow-inner">
                <div className="text-[100px] md:text-[120px] leading-none font-black text-rose-600 drop-shadow-xl select-none">
                  {selectedKanji.kanji}
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-3 uppercase tracking-tighter">
                    {selectedKanji.mean}
                  </h2>
                  <div className="flex gap-2">
                    <Badge className="bg-rose-500 text-white font-bold px-3 py-1 text-sm rounded-lg">N{selectedKanji.level}</Badge>
                    <Badge variant="outline" className="bg-white border-rose-200 font-bold px-3 py-1 text-sm rounded-lg text-slate-600">{selectedKanji.stroke_count} nét</Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">Âm Kun</p>
                  <p className="text-xl font-black text-slate-700">{selectedKanji.kun || '---'}</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-1">Âm On</p>
                  <p className="text-xl font-black text-slate-700">{selectedKanji.on || '---'}</p>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Định nghĩa chi tiết</p>
                {selectedKanji.detail ? (
                  <ul className="space-y-3">
                    {selectedKanji.detail.split(/[,;]/).map((m: string, i: number) => (
                      <li key={i} className="flex gap-3 text-slate-700 items-start">
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{i+1}</span>
                        <span className="text-base font-medium leading-relaxed">{m.trim()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 italic">Không có giải nghĩa chi tiết.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
