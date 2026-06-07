import { useState, useEffect } from 'react';
import { Volume2, Bookmark, BookmarkCheck, AlertCircle, CheckCircle2, ChevronRight, Layers, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ExampleSentence from './ExampleSentence';
import type { WordData, KanjiInfo } from './types';
import { ApiError } from '@/api/client';
import { dictionaryApi } from '@/api/dictionary.api';
import { kanjiApi } from '@/api/kanji.api';

interface WordDetailProps {
  word: WordData;
  playPronunciation: (text: string) => void;
  onSaveWord: (word: WordData) => void;
  onOpenKanji: (kanji: string) => void;
  isSaved: boolean;
}

export default function WordDetail({ word, playPronunciation, onSaveWord, onOpenKanji, isSaved }: WordDetailProps) {
  const mainJapanese = word.japanese?.[0] || { word: word.word, reading: word.reading };
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  // State để lưu thông tin chi tiết của các Kanji cấu thành
  const [kanjiDetails, setKanjiDetails] = useState<KanjiInfo[]>([]);
  const [loadingKanji, setLoadingKanji] = useState(false);

  // 1. Tìm các chữ Kanji độc nhất trong từ
  const constituentKanjis = word.word.match(/[\u4e00-\u9faf]/g);
  const uniqueKanjis = constituentKanjis ? Array.from(new Set(constituentKanjis)) : [];

  // 2. Tự động fetch thông tin Kanji khi từ thay đổi
  useEffect(() => {
    const fetchKanjiInfo = async () => {
      if (uniqueKanjis.length === 0) {
        setKanjiDetails([]);
        return;
      }

      setLoadingKanji(true);
      try {
        const data = await kanjiApi.lookupKanji<{ success?: boolean; data: KanjiInfo[] }>(uniqueKanjis);
        if (data.success) {
          setKanjiDetails(data.data);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin Kanji cấu thành:", error);
      } finally {
        setLoadingKanji(false);
      }
    };

    fetchKanjiInfo();
  }, [word.word]);

  const handleSaveWord = async (retry = true) => {
    onSaveWord(word);
    return;

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setMessage({ type: 'error', text: 'Vui lòng đăng nhập để lưu từ vựng.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const wordId = word.id || word._id;
      const response = await dictionaryApi.saveWordForUser<{ success?: boolean; message?: string }>(String(userId), String(wordId || ''));
      if (response.success) {
        onSaveWord(word);
        setMessage({ type: 'success', text: 'Đã lưu từ vựng!' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Đã có trong sổ tay' });
      }
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 500 && retry) {
        setMessage({ type: 'error', text: 'Đang thử lại...' });
        setTimeout(() => handleSaveWord(false), 1000);
      } else {
        setMessage({ type: 'error', text: error instanceof ApiError ? error.message : 'Lưu thất bại.' });
      }
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const parseMeaning = (
    meaning: string | string[] | undefined,
    meaningVi?: string
  ) => {
    const rawMeaning = Array.isArray(meaning)
      ? meaning.join(' ')
      : meaning || meaningVi || '';

    const normalizedMeaning = rawMeaning.replace(/\s+/g, ' ').trim();

    if (!normalizedMeaning) {
      return {
        hanViet: '',
        meanings: [],
      };
    }

    // Tìm vị trí bắt đầu của ý nghĩa đầu tiên: "1." hoặc "1)"
    const firstMeaningMatch = normalizedMeaning.match(/\b1[.)]\s*/);

    // Không có đánh số thì xem toàn bộ là một ý nghĩa thông thường
    if (!firstMeaningMatch || firstMeaningMatch.index === undefined) {
      return {
        hanViet: '',
        meanings: [normalizedMeaning],
      };
    }

    // Phần đứng trước "1." là âm Hán Việt
    const hanViet = normalizedMeaning
      .slice(0, firstMeaningMatch.index)
      .trim()
      .replace(/[:;,.\-\s]+$/, '');

    const numberedMeaning = normalizedMeaning.slice(
      firstMeaningMatch.index
    );

    // Tách nội dung theo 1., 2., 3....
    const meanings = Array.from(
      numberedMeaning.matchAll(
        /(?:^|\s)(\d+)[.)]\s*(.*?)(?=\s+\d+[.)]\s*|$)/g
      )
    )
      .map((match) => match[2].trim())
      .filter(Boolean);

    return {
      hanViet,
      meanings,
    };
  };

  const parsedMeaning = parseMeaning(word.meaning, word.meaning_vi);

  if (!mainJapanese.reading) {
    return (
      <div className="p-6 m-8 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span className="font-medium">Lỗi: Dữ liệu từ vựng không đầy đủ.</span>
      </div>
    );
  }

  return (
  <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    {/* Banner Section */}
    <div className="relative z-10 shrink-0 bg-slate-900 px-6 py-8 text-white shadow-md md:px-10 md:py-12">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="wrap-break-word mb-2 text-4xl font-black leading-tight tracking-tight md:text-6xl">
            {word.word}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {word.is_common && (
              <Badge className="border-none bg-emerald-500 px-3 py-1 text-[10px] font-bold text-white md:text-xs">
                Phổ biến
              </Badge>
            )}

            {word.jlpt && word.jlpt.length > 0 && (
              <Badge
                variant="outline"
                className="border-white/30 px-3 py-1 text-[10px] font-bold text-white md:text-xs"
              >
                JLPT {word.jlpt[0].toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleSaveWord(true)}
          className={`h-12 w-12 shrink-0 rounded-full transition-all md:h-14 md:w-14 ${
            isSaved
              ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isSaved ? (
            <BookmarkCheck className="h-6 w-6 md:h-7 md:w-7" />
          ) : (
            <Bookmark className="h-6 w-6 md:h-7 md:w-7" />
          )}
        </Button>
      </div>

      {message && (
        <div
          className={`absolute bottom-4 left-6 flex items-center gap-2 rounded-xl p-3 text-sm font-medium shadow-md animate-in slide-in-from-bottom-2 md:left-10 ${
            message.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-rose-500 text-white'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}

          <span>{message.text}</span>
        </div>
      )}
    </div>

    {/* Content Section - vùng duy nhất được scroll */}
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/30 py-3 px-6 pb-32 md:px-8 md:py-3 md:pb-32">
      {/* Âm Hán Việt */}
      {parsedMeaning.hanViet && (
        
        <div className="mb-3 flex items-center gap-3  whitespace-nowrap py-2">
          <span className="text-3xl font-bold uppercase tracking-widest text-slate-800">
            Hán Việt 
          </span>
          <span className="text-slate-800"> •</span>
          <span className="text-3xl font-bold uppercase tracking-wide text-slate-800">
            「{parsedMeaning.hanViet}」
          </span>
        </div>
      )}
      <div className="mb-10 flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 text-[20px] font-black uppercase tracking-[0.1em] text-violet-500">
            Cách đọc
          </h3>
          <p className="wrap-break-word text-3xl font-bold tracking-tight text-slate-800 md:text-4xl">
            {mainJapanese.reading} 
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => playPronunciation(mainJapanese.reading)}
          className="h-12 w-12 shrink-0 rounded-full border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 md:h-14 md:w-14"
        >
          <Volume2 className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </div>

      {/* Meaning Section */}
      <div className="mb-12">
        <h3 className="mb-4 flex items-center gap-2 text-[20px] font-black uppercase tracking-[0.1em] text-slate-600">
          Ý nghĩa (Meaning)
        </h3>
        {/* Các ý nghĩa riêng biệt */}
        {parsedMeaning.meanings.length > 0 ? (
          <ul className="space-y-3">
            {parsedMeaning.meanings.map((meaning, index) => (
              <li
                key={`${meaning}-${index}`}
                className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-slate-700 shadow-xs"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-600">
                  {index + 1}
                </span>

                <span className="min-w-0 flex-1 wrap-break-word text-lg font-semibold leading-relaxed md:text-xl">
                  {meaning.includes(':') ? (
                    <>
                      <span className="font-black text-slate-900">
                        {meaning.slice(0, meaning.indexOf(':')).trim()}
                      </span>

                      <span className="mx-2 text-slate-300">—</span>

                      <span>
                        {meaning.slice(meaning.indexOf(':') + 1).trim()}
                      </span>
                    </>
                  ) : (
                    meaning
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
            <p className="text-lg font-semibold text-slate-500">
              Chưa có dữ liệu định nghĩa
            </p>
          </div>
        )}
      </div>

      {/* Kanji Section */}
      {uniqueKanjis.length > 0 && (
        <div className="mb-12">
          <h3 className="mb-6 flex items-center gap-2 text-[20px] font-black uppercase tracking-[0.2em] text-rose-500">
            <Layers className="h-4 w-4" />
            Giải phẫu Hán tự
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {loadingKanji ? (
              <div className="flex animate-pulse items-center gap-3 rounded-3xl border border-slate-100 bg-white p-6 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Đang phân tích các chữ Hán...</span>
              </div>
            ) : kanjiDetails.length > 0 ? (
              kanjiDetails.map((kanji, index) => (
                <button
                  type="button"
                  key={kanji.kanji || index}
                  onClick={() => onOpenKanji(kanji.kanji)}
                  className="group flex w-full cursor-pointer flex-col items-center gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 text-left shadow-xs transition-all hover:border-rose-200 hover:bg-rose-50/30 hover:shadow-md md:flex-row"
                >
                  {/* Chữ Hán */}
                  <div className="shrink-0 text-6xl font-black text-slate-800 transition-colors group-hover:text-rose-600">
                    {kanji.kanji}
                  </div>

                  {/* Thông tin Kanji */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="wrap-break-word text-xl font-black uppercase tracking-tight text-slate-800">
                        {kanji.mean}
                      </span>
                      {kanji.level && (
                        <Badge className="border-none bg-rose-100 text-[10px] font-bold text-rose-600">
                          {kanji.level ? `N${kanji.level}` : ""}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                      <p className="min-w-0 text-sm text-slate-500">
                        <span className="mr-2 text-[10px] font-bold uppercase text-rose-400">
                          Onyomi:
                        </span>

                        <span className="wrap-break-word font-medium">
                          {kanji.on || '---'}
                        </span>
                      </p>

                      <p className="min-w-0 text-sm text-slate-500">
                        <span className="mr-2 text-[10px] font-bold uppercase text-rose-400">
                          Kunyomi:
                        </span>

                        <span className="wrap-break-word font-medium">
                          {kanji.kun || '---'}
                        </span>
                      </p>

                      {kanji.detail && (
                        <p className="mt-1 line-clamp-2 wrap-break-word text-sm italic text-slate-600 sm:col-span-2">
                          {kanji.detail}
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="hidden h-5 w-5 shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-rose-400 md:block" />
                </button>
              ))
            ) : (
              <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-400">
                Không tìm thấy thông tin chi tiết của các chữ Hán.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Example Section */}
      <ExampleSentence word={word} />
    </div>
  </div>
);
}
