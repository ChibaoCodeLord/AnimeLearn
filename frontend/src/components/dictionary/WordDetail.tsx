import { useState, useEffect } from 'react';
import { Volume2, Bookmark, BookmarkCheck, AlertCircle, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import ExampleSentence from './ExampleSentence';
import type { WordData, KanjiInfo } from './types';

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
        const res = await fetch('http://localhost:5000/api/kanji/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characters: uniqueKanjis })
        });
        const data = await res.json();
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
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setMessage({ type: 'error', text: 'Vui lòng đăng nhập để lưu từ vựng.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      const wordId = word.id || word._id;
      const response = await axios.post(`/api/saved-words/user/${userId}/word/${wordId}`, {});
      if (response.data.success) {
        onSaveWord(word);
        setMessage({ type: 'success', text: 'Đã lưu từ vựng!' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Đã có trong sổ tay' });
      }
    } catch (error: any) {
      if (error.response?.status === 500 && retry) {
        setMessage({ type: 'error', text: 'Đang thử lại...' });
        setTimeout(() => handleSaveWord(false), 1000);
      } else {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Lưu thất bại.' });
      }
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (!mainJapanese.reading) {
    return (
      <div className="p-6 m-8 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <span className="font-medium">Lỗi: Dữ liệu từ vựng không đầy đủ.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[83vh] bg-white w-full overflow-y-scroll custom-scrollbar overscroll-contain rounded-3xl border border-slate-200 shadow-sm">
      
      {/* Banner Section */}
      <div className="px-10 py-10 md:py-12 bg-slate-900 text-white relative shrink-0 shadow-md z-10">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight mb-2 leading-tight">{word.word}</h2>
            <div className="flex items-center gap-3 mt-4">
              {word.is_common && <Badge className="bg-emerald-500 text-white border-none font-bold px-3 py-1 text-[10px] md:text-xs">Phổ biến</Badge>}
              {word.jlpt && word.jlpt.length > 0 && (
                <Badge variant="outline" className="text-white border-white/30 font-bold px-3 py-1 text-[10px] md:text-xs">JLPT {word.jlpt[0].toUpperCase()}</Badge>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => handleSaveWord(true)}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-full transition-all shrink-0 ${isSaved ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isSaved ? <BookmarkCheck className="w-6 h-6 md:w-7 md:h-7" /> : <Bookmark className="w-6 h-6 md:w-7 md:h-7" />}
          </Button>
        </div>

        {message && (
          <div className={`absolute bottom-4 left-10 flex items-center gap-2 p-3 rounded-xl text-sm font-medium animate-in slide-in-from-bottom-2 ${
            message.type === 'success' ? 'bg-emerald-500 text-white shadow-md' : 'bg-rose-500 text-white shadow-md'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32 bg-slate-50/30">
        
        {/* Reading Box */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 mb-10 shadow-sm">
          <div>
            <h3 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] mb-2">Cách đọc (Reading)</h3>
            <p className="text-3xl md:text-4xl text-slate-800 font-bold tracking-tight">{mainJapanese.reading}</p>
          </div>
          <Button 
            variant="outline" size="icon"
            onClick={() => playPronunciation(mainJapanese.reading)}
            className="w-12 h-12 md:w-14 md:h-14 rounded-full border-slate-200 text-slate-600 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 bg-white transition-all shrink-0 shadow-sm"
          >
            <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
          </Button>
        </div>

        {/* Meaning Section */}
        <div className="mb-12">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            Ý nghĩa (Meaning)
          </h3>
          <div className="space-y-4">
            {Array.isArray(word.meaning) ? (
              <ul className="space-y-4">
                {word.meaning.map((m, i) => (
                  <li key={i} className="flex gap-4 text-slate-700 items-start p-4 bg-white rounded-2xl border border-slate-100 shadow-xs">
                    <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{i+1}</span>
                    <span className="text-lg md:text-xl font-semibold leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <p className="text-lg md:text-xl text-slate-800 font-semibold leading-relaxed">{word.meaning || word.meaning_vi || 'Chưa có dữ liệu định nghĩa'}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 🔥 PHẦN MỚI: Hán tự cấu thành dạng hàng ngang chi tiết */}
        {uniqueKanjis.length > 0 && (
          <div className="mb-12">
            <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Giải phẫu Hán tự
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              {loadingKanji ? (
                <div className="flex items-center gap-3 p-6 text-slate-400 animate-pulse bg-white rounded-3xl border border-slate-100">
                  <Layers className="animate-spin w-5 h-5" />
                  <span>Đang phân tích các chữ Hán...</span>
                </div>
              ) : (
                kanjiDetails.map((k, i) => (
                  <div 
                    key={i}
                    onClick={() => onOpenKanji(k.kanji)}
                    className="group flex flex-col md:flex-row items-center gap-6 p-6 bg-white hover:bg-rose-50/30 border border-slate-200 hover:border-rose-200 rounded-[2rem] transition-all cursor-pointer shadow-xs hover:shadow-md"
                  >
                    {/* Chữ Hán To */}
                    <div className="text-6xl font-black text-slate-800 group-hover:text-rose-600 transition-colors select-none">
                      {k.kanji}
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-black text-slate-800 uppercase tracking-tight">{k.mean}</span>
                        <Badge className="bg-rose-100 text-rose-600 border-none font-bold text-[10px]">N{k.level}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        <p className="text-sm text-slate-500">
                          <span className="font-bold text-rose-400 text-[10px] uppercase mr-2">Onyomi:</span>
                          <span className="font-medium">{k.on || '---'}</span>
                        </p>
                        <p className="text-sm text-slate-500">
                          <span className="font-bold text-rose-400 text-[10px] uppercase mr-2">Kunyomi:</span>
                          <span className="font-medium">{k.kun || '---'}</span>
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-1 sm:col-span-2 mt-1 italic">
                          {k.detail}
                        </p>
                      </div>
                    </div>

                    {/* Icon mũi tên */}
                    <ChevronRight className="hidden md:block w-5 h-5 text-slate-300 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                  </div>
                ))
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