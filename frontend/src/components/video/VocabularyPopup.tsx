import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { Star, BookOpen, Loader2, Volume2, Info, X, Sparkles } from 'lucide-react';
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
}

interface VocabularyPopupProps {
  word: string | null;
  position: { x: number; y: number } | null;
  vocabData?: any;
  onClose: () => void;
  onSave?: () => void;
}

// Bảng màu JLPT
const jlptBadgeColors: Record<string, string> = {
  N5: 'bg-green-100 text-green-700 border-green-200',
  N4: 'bg-blue-100 text-blue-700 border-blue-200',
  N3: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  N2: 'bg-orange-100 text-orange-700 border-orange-200',
  N1: 'bg-rose-100 text-rose-700 border-rose-200',
};

// --- Component Chính ---
export default function VocabularyPopup({ word, position, onClose, onSave, vocabData }: VocabularyPopupProps) {
  const [saving, setSaving] = useState(false);
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  
  // Trạng thái vị trí (bỏ opacity và animation)
  const [adjustedPos, setAdjustedPos] = useState({ x: -9999, y: -9999 });

  // 1. Lắng nghe sự kiện Scroll để tự động đóng Popup
  useEffect(() => {
    const handleScroll = (e: Event) => {
      // Nếu lăn chuột "bên trong" khung nội dung của popup thì bỏ qua (không đóng)
      if (popupRef.current && popupRef.current.contains(e.target as Node)) {
        return;
      }
      // Nếu cuộn trang ở bên ngoài thì đóng popup
      onClose();
    };

    // Dùng capture phase (true) để tóm được mọi sự kiện scroll trên trang
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  // 2. Tính toán Tọa độ (Không tràn viền)
  useLayoutEffect(() => {
    if (popupRef.current && position) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Căn giữa popup theo trục X của con trỏ chuột
      let newX = position.x - (rect.width / 2);
      let newY = position.y + 25; // Hiện bên dưới chữ 25px

      // Ép vào viền màn hình nếu tràn
      if (newX < 20) newX = 20;
      if (newX + rect.width > viewportWidth - 20) newX = viewportWidth - rect.width - 20;

      // Nếu tràn viền dưới, lật popup lên TRÊN chữ
      if (newY + rect.height > viewportHeight - 20) {
        newY = position.y - rect.height - 15;
      }

      setAdjustedPos({ x: newX, y: newY });
    }
  }, [position, lookupData]);

  // 3. Logic Tra Từ (Giữ nguyên)
  useEffect(() => {
    if (vocabData && (vocabData.meaning || vocabData.reading || vocabData.pos)) {
      setLookupData({
        word: vocabData.word || word || '',
        reading: vocabData.reading || '',
        meaning_vi: vocabData.meaning || vocabData.meaning_vi || '',
        part_of_speech: vocabData.pos || vocabData.part_of_speech || ''
      });
      setLoading(false);
    } else if (word) {
      lookupWord(word);
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
        meaning_vi: `Chưa có dữ liệu từ điển cho từ này. Vui lòng tạo lại Script AI để bóc tách.`,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!lookupData) return;
    setSaving(true);
    try {
      const newSavedVocab = {
        word: lookupData.word || word,
        reading: lookupData.reading || '',
        meaning_vi: lookupData.meaning_vi || '',
        meaning_en: lookupData.meaning_en || '',
        jlpt_level: lookupData.jlpt_level || 'Unknown',
        example_sentence: lookupData.example_sentence || '',
        example_meaning: lookupData.example_meaning || '',
        part_of_speech: lookupData.part_of_speech || ''
      };

      const token = localStorage.getItem('token') || '';
      const res = await fetch('http://localhost:5000/api/video/save-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'omit',
        body: JSON.stringify(newSavedVocab)
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.message === 'Từ này đã có trong sổ tay') toast.info(data.message);
        else toast.error(data.error || 'Lỗi khi lưu từ vựng!');
      } else {
        toast.success(data.message || 'Đã lưu từ vựng vào Database!');
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

  // 4. Bóc tách Hán Việt (Giữ nguyên)
  let hanViet = '';
  let meaningLines: string[] = [];

  if (lookupData?.meaning_vi) {
    const lines = lookupData.meaning_vi.split('\n').map((l: string) => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines[0] === lines[0].toUpperCase() && !lines[0].match(/^[0-9]/)) {
      hanViet = lines[0];
      meaningLines = lines.slice(1);
    } else {
      meaningLines = lines;
    }
  }

  return (
    <>
      {/* Nền trong suốt bắt sự kiện đóng khi click ra ngoài */}
      <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />
      
      <div
        ref={popupRef}
        // Loại bỏ hoàn toàn animation (transition, scale, transformOrigin)
        className="fixed z-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col w-[320px] max-h-[420px] border border-pink-100"
        style={{ 
          left: adjustedPos.x, 
          top: adjustedPos.y,
          // Ẩn tạm thời trong mili-giây đầu tiên lúc React đang tính toán tọa độ để tránh giật
          visibility: adjustedPos.x === -9999 ? 'hidden' : 'visible' 
        }}
      >
        
        {/* NÚT TẮT */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 text-pink-300 hover:text-pink-600 hover:bg-pink-100/50 rounded-full z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4 bg-[#fdf8fa] h-full">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
            <p className="text-sm font-medium text-pink-400">Đang tra từ điển...</p>
          </div>
        ) : lookupData ? (
          <>
            {/* HEADER: Tone màu Pastel Tím/Hồng nhạt nguyên khối */}
            <div className="p-5 bg-[#fbf3f8] relative shrink-0 border-b border-pink-100/60">
              <div className="flex flex-col mb-1 pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-pink-500 font-bold text-sm tracking-widest">{lookupData.reading}</p>
                  <button onClick={playAudio} className="text-violet-400 hover:text-violet-600 hover:bg-violet-100 p-1 rounded-full active:scale-95">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">{lookupData.word || word}</h3>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {hanViet && (
                  <Badge className="bg-pink-100 hover:bg-pink-200 text-pink-600 border-none font-bold tracking-widest px-2.5 py-0.5 shadow-xs">
                    {hanViet}
                  </Badge>
                )}
                {lookupData.part_of_speech && (
                  <Badge variant="outline" className="bg-white text-violet-600 border-violet-100 px-2.5 py-0.5 font-medium">
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

            {/* BODY: Định nghĩa (Màu nền sáng hơn xíu để dễ đọc chữ) */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-[#fffbfd]">
              {meaningLines.length > 0 ? (
                <ul className="space-y-3">
                  {meaningLines.map((line, idx) => {
                    const match = line.match(/^([0-9]+\.)(.*)/);
                    if (match) {
                      return (
                        <li key={idx} className="text-slate-700 text-[14.5px] leading-relaxed flex gap-2">
                          <span className="font-black text-pink-400 shrink-0 select-none">{match[1]}</span>
                          <span className="font-medium">{match[2]}</span>
                        </li>
                      );
                    }
                    return (
                      <li key={idx} className="text-slate-700 text-[14.5px] leading-relaxed relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-violet-300 before:rounded-full font-medium">
                        {line}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-4 italic">
                  <Sparkles className="w-5 h-5 text-pink-300" />
                  <span className="text-sm">Chưa có định nghĩa chi tiết.</span>
                </div>
              )}
              
              {lookupData.meaning_en && (
                <p className="text-slate-500 text-sm mt-4 pt-3 border-t border-pink-50 font-medium italic">
                  {lookupData.meaning_en}
                </p>
              )}
            </div>

            {/* MỞ RỘNG & NÚT LƯU */}
            <div className="shrink-0 bg-[#fffbfd]">
              {lookupData.example_sentence && (
                <div className="px-5 py-3 border-t border-pink-100 bg-[#fbf3f8]/50">
                  <p className="text-xs font-bold text-violet-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <BookOpen className="w-3 h-3" /> Ví dụ
                  </p>
                  <p className="text-[14px] font-bold text-slate-700 leading-snug">{lookupData.example_sentence}</p>
                  <p className="text-sm text-slate-500 mt-1">{lookupData.example_meaning}</p>
                </div>
              )}

              {lookupData.related_words && lookupData.related_words.length > 0 && (
                <div className="px-5 py-3 border-t border-pink-100">
                  <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Từ liên quan</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lookupData.related_words.slice(0, 5).map((rw, i) => (
                      <Badge key={i} variant="secondary" className="bg-white text-slate-500 border border-slate-100 shadow-xs">
                        {rw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* FOOTER */}
              <div className="p-4 border-t border-pink-100 bg-[#fffbfd]">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  // Màu nút trơn mượt mà (Violet Solid)
                  className="w-full h-11 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4 fill-white/20" />}
                  Lưu vào Sổ tay
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}