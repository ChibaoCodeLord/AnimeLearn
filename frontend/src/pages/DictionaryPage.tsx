import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X, BookOpen, BookmarkPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import WordList from '@/components/dictionary/WordList';
import WordDetail from '@/components/dictionary/WordDetail';
import type { WordData, KanjiInfo } from '@/components/dictionary/types';
import { dictionaryApi } from '@/api/dictionary.api';
import { kanjiApi } from '@/api/kanji.api';
import { LearningSaveModal } from '@/components/vocabulary-hub/LearningSaveModal';
import type { FlashcardItem } from '@/components/vocabulary-hub/types';

const wordToFlashcard = (word: WordData): FlashcardItem => {
  const mainJapanese = word.japanese?.[0] || { word: word.word, reading: word.reading };
  const meaning = Array.isArray(word.meaning)
    ? word.meaning.filter(Boolean).join('\n')
    : word.meaning || word.meaning_vi || '';

  return {
    id: word._id || word.id || mainJapanese.word || word.word,
    item_type: 'vocab',
    word: mainJapanese.word || word.word,
    reading: mainJapanese.reading || word.reading,
    meaning_vi: meaning,
    part_of_speech: word.pos || (typeof word.partOfSpeech === 'string' ? word.partOfSpeech : ''),
    jlpt_level: word.jlpt?.[0]?.toUpperCase(),
  };
};

const kanjiInfoToFlashcard = (kanji: KanjiInfo): FlashcardItem => {
  const level = kanji.level ? String(kanji.level).replace(/^N/i, '') : '';

  return {
    id: kanji.kanji,
    item_type: 'kanji',
    word: kanji.kanji,
    meaning_vi: kanji.mean,
    mean: kanji.mean,
    on: kanji.on,
    kun: kanji.kun,
    jlpt_level: level ? `N${level}` : undefined,
    stroke_count: Number(kanji.stroke_count) || undefined,
    detail: kanji.detail,
  };
};

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
  const [searchVersion, setSearchVersion] = useState(0);

  const [kanjiResults, setKanjiResults] = useState<KanjiInfo[]>([]);
  const [selectedKanji, setSelectedKanji] = useState<KanjiInfo | null>(null);
  const [showKanjiModal, setShowKanjiModal] = useState(false);
  const [saveTarget, setSaveTarget] = useState<FlashcardItem | null>(null);

    // --- 1. XỬ LÝ NHẬP LIỆU (TỰ DO) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSearchKanji = (kanji: string) => {
    const query = kanji.trim();

    setInputValue(query);
    setSearchQuery(query);

    setPage(1);
    setResults([]);
    setKanjiResults([]);
    setSelectedWord(null);

    setSelectedKanji(null);
    setShowKanjiModal(false);

    setSearchVersion((prev) => prev + 1);
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
  }, [searchQuery, page, searchVersion]);

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
    setSaveTarget(wordToFlashcard(word));
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
  <div className="flex h-[calc(100dvh-64px)] min-h-0 w-full flex-col overflow-hidden bg-slate-50 md:flex-row">
    
    {/* 40% LEFT PANEL */}
    <section className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-lg md:w-[40%] md:shadow-none">
      
      {/* Header tìm kiếm */}
      <div className="shrink-0 border-b border-slate-200 bg-white p-4">
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
            <Search className="h-5 w-5 text-slate-400 transition-colors group-focus-within:text-violet-500" />
          </div>

          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Tra từ (kanji, kana, romaji, tiếng việt)..."
            className="h-12 w-full rounded-xl border-2 border-transparent bg-slate-100 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:outline-none"
          />

          {loading && page === 1 && (
            <div className="absolute inset-y-0 right-4 flex items-center">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            </div>
          )}
        </div>

        {searchQuery && !loading && (
          <div className="mt-3 flex items-center justify-between px-1">
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>{totalFound} kết quả</span>
            </p>
          </div>
        )}
      </div>

      {/* Khu vực danh sách */}
      <div className="min-h-0 flex-1 overflow-hidden bg-slate-50">
        {searchQuery ? (
          <WordList
            searchResults={results}
            selectedWord={selectedWord}
            onWordSelect={handleWordSelect}
            loading={loading}
            lastElementRef={lastElementRef}
            kanjiResults={kanjiResults}
            onOpenKanji={(kanji) => {
              setSelectedKanji(kanji);
              setShowKanjiModal(true);
            }}
          />
        ) : (
          <div className="flex h-full min-h-0 flex-col items-center justify-center p-8 text-center text-slate-400 opacity-60">
            <BookOpen className="mb-4 h-16 w-16 text-slate-300" />
            <p className="text-lg font-medium">
              Bắt đầu gõ để tra cứu từ vựng
            </p>
          </div>
        )}
      </div>
    </section>

    {/* 60% RIGHT PANEL */}
    <section className="relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden bg-slate-50 md:w-[60%]">
      {selectedWord ? (
        <div className="h-full min-h-0 w-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
          <WordDetail
            word={selectedWord}
            playPronunciation={playPronunciation}
            onSaveWord={saveWord}
            onOpenKanji={openKanjiDetail}
            isSaved={savedWords.some(
              (saved) =>
                saved.word === selectedWord.word &&
                saved.reading === selectedWord.reading
            )}
          />
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-hidden p-8 text-center text-slate-400">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm">
            <Search className="h-10 w-10 text-slate-300" />
          </div>

          <h3 className="mb-2 text-2xl font-bold text-slate-600">
            Chưa chọn từ vựng
          </h3>

          <p className="max-w-sm text-slate-500">
            Chọn một từ bên cột danh sách để xem chi tiết Hán tự và ví dụ.
          </p>
        </div>
      )}
    </section>

    {/* MODAL KANJI */}
    {showKanjiModal && selectedKanji && (
      <div
        className="fixed inset-0 z-[50] flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200 md:p-8"
        onClick={() => setShowKanjiModal(false)}
      >
        <div
          className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50 p-4">
            <div className="w-8" />

            <Badge className="rounded-full border-none bg-rose-100 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-700">
              Phân tích Hán tự
            </Badge>

            <button
              type="button"
              onClick={() => setShowKanjiModal(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 transition-colors hover:bg-rose-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white p-6 md:p-10">
            <div className="mb-8 flex items-center gap-8 rounded-[2rem] border border-rose-100 bg-linear-to-br from-rose-50 to-orange-50 p-8 shadow-inner">
              <a
                href={`?q=${encodeURIComponent(selectedKanji.kanji)}`}
                onClick={(event) => {
                  event.preventDefault();
                  handleSearchKanji(selectedKanji.kanji);
                }}
                title={`Tìm kiếm từ có chứa chữ ${selectedKanji.kanji}`}
                className="
                  inline-block shrink-0 cursor-pointer
                  text-[100px] font-black leading-none text-rose-600
                  drop-shadow-xl transition-all duration-200
                  decoration-rose-400 decoration-4 underline-offset-8
                  hover:text-rose-700 hover:underline
                  focus-visible:rounded-xl focus-visible:outline-none
                  focus-visible:ring-4 focus-visible:ring-rose-300
                  md:text-[120px]
                "
              >
                {selectedKanji.kanji}
              </a>

              <div>
                <h2 className="mb-3 text-3xl font-black uppercase tracking-tighter text-slate-800 md:text-4xl">
                  {selectedKanji.mean}
                </h2>

                <div className="flex gap-2">
                  {selectedKanji.level && (
                    <Badge className="rounded-sm bg-rose-500 px-3 py-3 text-xl font-bold text-white">
                      N{selectedKanji.level}
                    </Badge>
                  )}

                  <Badge
                    variant="outline"
                    className="rounded-sm border-rose-200 bg-white px-3 py-3 text-xl  font-bold text-slate-600"
                  >
                    {selectedKanji.stroke_count} nét
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-pink-500">
                  Âm Kun
                </p>
                <p className="text-xl font-black text-slate-700">
                  {selectedKanji.kun || "---"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-sky-500">
                  Âm On
                </p>
                <p className="text-xl font-black text-slate-700">
                  {selectedKanji.on || "---"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Định nghĩa chi tiết
              </p>

              {selectedKanji.detail ? (
                <ul className="space-y-3">
                  {selectedKanji.detail
                    .split(/[,;]/)
                    .map((meaning: string, index: number) => (
                      <li
                        key={`${meaning}-${index}`}
                        className="flex items-start gap-3 text-slate-700"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-black text-rose-600">
                          {index + 1}
                        </span>

                        <span className="text-base font-medium leading-relaxed">
                          {meaning.trim()}
                        </span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="italic text-slate-400">
                  Không có giải nghĩa chi tiết.
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                onClick={() => setSaveTarget(kanjiInfoToFlashcard(selectedKanji))}
                className="rounded-xl bg-rose-600 font-bold text-white hover:bg-rose-700"
              >
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Lưu Kanji
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    <LearningSaveModal
      item={saveTarget}
      onClose={() => setSaveTarget(null)}
      onSaved={(item) => {
        if (item.item_type !== 'vocab' || !selectedWord) return;
        if (savedWords.some((saved) => saved.word === selectedWord.word && saved.reading === selectedWord.reading)) return;
        setSavedWords((current) => [...current, selectedWord]);
      }}
    />
  </div>
);
}
