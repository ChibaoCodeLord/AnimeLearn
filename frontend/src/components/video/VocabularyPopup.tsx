import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { Star, BookOpen, Loader2, Volume2, X, Sparkles, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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
  kanji_info?: any[]; // Thêm trường này để chứa thông tin Kanji
}

interface VocabularyPopupProps {
  word: string | null;
  position: { x: number; y: number } | null;
  vocabData?: any;
  sentenceContext?: string; // Nhận câu ngữ cảnh từ VideoWorkspace
  onClose: () => void;
  onSave?: () => void;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}

// Bảng màu JLPT
const jlptBadgeColors: Record<string, string> = {
  N5: 'bg-green-100 text-green-700 border-green-200',
  N4: 'bg-blue-100 text-blue-700 border-blue-200',
  N3: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  N2: 'bg-orange-100 text-orange-700 border-orange-200',
  N1: 'bg-rose-100 text-rose-700 border-rose-200',
  Unknown: 'bg-slate-100 text-slate-600 border-slate-200'
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
  onMouseLeave 
}: VocabularyPopupProps) {
  const [saving, setSaving] = useState(false);
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Trạng thái vị trí (bỏ opacity và animation)
  const [adjustedPos, setAdjustedPos] = useState({ x: -9999, y: -9999 });

  // 1. Lắng nghe sự kiện Scroll để tự động đóng Popup
  useEffect(() => {
    const handleScroll = (e: Event) => {
      if (popupRef.current && popupRef.current.contains(e.target as Node)) {
        return;
      }
      onClose();
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // 2. Tính toán Tọa độ (Tuyệt đối không tràn viền)
  useLayoutEffect(() => {
    if (popupRef.current && position) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const PADDING = 20;

      // ---- XỬ LÝ TRỤC X (NGANG) ----
      let newX = position.x - (rect.width / 2);
      
      // Ép viền trái/phải
      if (newX < PADDING) {
        newX = PADDING;
      } else if (newX + rect.width > viewportWidth - PADDING) {
        newX = viewportWidth - rect.width - PADDING;
      }

      // ---- XỬ LÝ TRỤC Y (DỌC) ----
      let newY = position.y + 25; // Mặc định: Hiện bên dưới chữ đang click

      // Nếu hiện bên dưới bị đụng đáy màn hình
      if (newY + rect.height > viewportHeight - PADDING) {
        
        const flipUpY = position.y - rect.height - 15; // Thử lật lên trên chữ

        // Nếu lật lên trên mà lại đụng trần màn hình (Do popup quá dài)
        if (flipUpY < PADDING) {
          // BƯỚC CỨU HỘ: Ép popup nằm trọn vẹn trong màn hình
          newY = Math.max(PADDING, (viewportHeight - rect.height) / 2);
          
          if (newY + rect.height > viewportHeight - PADDING) {
             newY = viewportHeight - rect.height - PADDING;
          }
        } else {
          newY = flipUpY;
        }
      }

      setAdjustedPos({ x: newX, y: newY });
    }
  }, [position, lookupData]);

  // 3. Logic Tra Từ & Cứu hộ Kanji lẻ
  useEffect(() => {
    const fetchExtraKanji = async (charArray: string[]) => {
      try {
        const res = await fetch('http://localhost:5000/api/kanji/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ characters: charArray })
        });
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setLookupData(prev => {
            if (!prev) return null;
            
            // Logic Cứu hộ: Nếu nghĩa đang là N/A hoặc không có, lấy Hán Việt làm nghĩa
            const currentMeaning = prev.meaning_vi?.trim();
            const isMissingMeaning = !currentMeaning || currentMeaning === 'N/A' || currentMeaning === 'Không rõ nghĩa';
            
            return { 
              ...prev, 
              kanji_info: data.data,
              // Nếu không có nghĩa thì ưu tiên lấy chữ Hán Việt đầu tiên làm nghĩa chính
              meaning_vi: isMissingMeaning ? data.data[0].mean : prev.meaning_vi 
            };
          });
        }
      } catch (e) { console.error("Lỗi tra Kanji lẻ:", e); }
    };

    if (vocabData && (vocabData.meaning || vocabData.reading || vocabData.pos)) {
      setLookupData({
        word: vocabData.word || word || '',
        reading: vocabData.reading || '',
        meaning_vi: vocabData.meaning || vocabData.meaning_vi || '',
        part_of_speech: vocabData.pos || vocabData.part_of_speech || '',
        jlpt_level: vocabData.jlpt_level || 'Unknown',
        kanji_info: vocabData.kanji_info || []
      });
      
      // Nếu có vocabData nhưng thiếu thông tin Kanji chi tiết, vẫn đi tìm cứu hộ
      if (!vocabData.kanji_info || vocabData.kanji_info.length === 0) {
        const kanjis = (vocabData.word || word || "").split('').filter((c: string) => c.match(/[\u4e00-\u9faf]/));
        if (kanjis.length > 0) fetchExtraKanji(kanjis);
      }
      setLoading(false);
    } else if (word) {
      lookupWord(word);
      // Tra cứu Kanji cứu hộ đồng thời khi hover từ lẻ
      const kanjis = word.split('').filter((c: string) => c.match(/[\u4e00-\u9faf]/));
      if (kanjis.length > 0) fetchExtraKanji(kanjis);
    }
  }, [word, vocabData]);

  const lookupWord = async (w: string) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/video/translate-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: w })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setLookupData({
        word: data.word || w,
        reading: data.reading || 'chưa rõ',
        meaning_vi: data.meaning_vi || 'Không rõ nghĩa',
        part_of_speech: data.part_of_speech || 'N/A'
      });
    } catch(e) {
      setLookupData({
        word: w,
        reading: 'chưa rõ',
        meaning_vi: `N/A`,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!lookupData) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:5000/api/video/save-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...lookupData, jlpt_level: lookupData.jlpt_level || 'Unknown' })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Đã lưu từ vựng!');
      } else {
        toast.info(data.message || 'Lỗi khi lưu!');
      }
      if (onSave) onSave();
    } catch (error) {
      toast.error('Lỗi kết nối khi lưu!');
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
    const lines = lookupData.meaning_vi.split('\n').map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines[0] === lines[0].toUpperCase() && !lines[0].match(/^[0-9]/)) {
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
        className="fixed z-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col w-[320px] md:w-[340px] max-h-[80vh] border border-pink-100 bg-white"
        style={{ 
          left: adjustedPos.x, 
          top: adjustedPos.y,
          visibility: adjustedPos.x === -9999 ? 'hidden' : 'visible' 
        }}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 text-pink-300 hover:text-pink-600 hover:bg-pink-100/50 rounded-full z-10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4 bg-[#fdf8fa] h-40">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
            <p className="text-sm font-medium text-pink-400">Đang tra từ điển...</p>
          </div>
        ) : lookupData ? (
          <>
            <div className="p-5 bg-[#fbf3f8] relative shrink-0 border-b border-pink-100/60">
              <div className="flex flex-col mb-1 pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-pink-500 font-bold text-sm tracking-widest">{lookupData.reading}</p>
                  <button onClick={playAudio} className="text-violet-400 hover:text-violet-600 hover:bg-violet-100 p-1.5 rounded-full active:scale-95 transition-colors">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{lookupData.word}</h3>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {hanVietHeader && (
                  <Badge className="bg-pink-100 text-pink-600 border-none font-bold tracking-widest px-2.5 py-0.5 shadow-xs">
                    {hanVietHeader}
                  </Badge>
                )}
                {lookupData.part_of_speech && (
                  <Badge variant="outline" className="bg-white text-violet-600 border-violet-100 px-2.5 py-0.5 font-medium shadow-xs">
                    {lookupData.part_of_speech}
                  </Badge>
                )}
                {lookupData.jlpt_level && lookupData.jlpt_level !== 'Unknown' && (
                  <Badge className={`${jlptBadgeColors[lookupData.jlpt_level] || 'bg-slate-100 text-slate-600 border-slate-200'} border px-2.5 py-0.5 font-bold shadow-xs`}>
                    {lookupData.jlpt_level}
                  </Badge>
                )}
              </div>
            </div>

            <div className="overflow-y-auto overscroll-contain custom-scrollbar flex-1 bg-[#fffbfd]">
              <div className="p-5">
                {meaningLines.length > 0 && meaningLines[0] !== 'N/A' ? (
                  <ul className="space-y-3">
                    {meaningLines.map((line, idx) => (
                      <li key={idx} className="text-slate-700 text-[14.5px] leading-relaxed flex gap-2">
                        <span className="font-black text-pink-400 shrink-0 select-none">{idx + 1}.</span>
                        <span className="font-medium">{line.replace(/^[0-9]+\./, '')}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-4 italic">
                    <Sparkles className="w-5 h-5 text-pink-300" />
                    <span className="text-sm">Nghĩa đang được cập nhật qua Kanji...</span>
                  </div>
                )}
              </div>

              {sentenceContext && (
                <div className="px-5 py-3 border-t border-pink-100 bg-violet-50/30">
                  <p className="text-[11px] font-bold text-violet-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <Quote className="w-3 h-3" /> Ngữ cảnh trong video
                  </p>
                  <p className="text-[14px] font-bold text-slate-700 leading-snug">{sentenceContext}</p>
                </div>
              )}

              {lookupData.kanji_info && lookupData.kanji_info.length > 0 && (
                <div className="px-5 py-4 border-t border-dashed border-pink-200 bg-white">
                  <p className="text-[11px] font-bold text-pink-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> Phân tích Hán Tự
                  </p>
                  <div className="space-y-2">
                    {lookupData.kanji_info.map((kanji: any, idx: number) => {
                      const shortDetail = kanji.detail?.split(/[,;]/).slice(0, 3).join(', ').trim();
                      return (
                        <div key={idx} className="flex bg-[#fdf8fa] rounded-xl p-3 items-start border border-pink-50 shadow-sm">
                          <div className="text-3xl text-rose-500 font-black mr-4 w-10 text-center flex-shrink-0">
                            {kanji.kanji}
                          </div>
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-bold text-slate-800 text-[13px] mb-1">
                              {kanji.mean} <span className="font-normal text-slate-400 text-[10px] ml-1">(N{kanji.level})</span>
                            </p>
                            {shortDetail && (
                              <p className="text-slate-500 mb-2 leading-relaxed italic border-l-2 border-pink-100 pl-2 line-clamp-2">
                                {shortDetail}...
                              </p>
                            )}
                            <div className="grid grid-cols-[35px_1fr] gap-x-1 gap-y-0.5 text-[10.5px] mt-1 pt-1 border-t border-pink-50/50">
                              <span className="text-pink-400 font-semibold uppercase">Kun</span>
                              <span className="text-slate-600 break-words">{kanji.kun || '-'}</span>
                              <span className="text-pink-400 font-semibold uppercase">On</span>
                              <span className="text-slate-600 break-words">{kanji.on || '-'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-pink-100 bg-[#fffbfd] shrink-0">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-11 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 fill-white/20" />}
                Lưu vào Sổ tay
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}