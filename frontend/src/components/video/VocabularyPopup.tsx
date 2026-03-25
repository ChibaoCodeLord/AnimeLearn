import React, { useState } from 'react';
import { Star, BookOpen, Loader2 } from 'lucide-react';
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
  onClose: () => void;
  onSave?: () => void;
}

const jlptBadgeColors: Record<string, string> = {
  N5: 'bg-green-500/20 text-green-400 border-green-500/30',
  N4: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  N3: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  N2: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  N1: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// --- Các hàm tiện ích xử lý Cookie ---
const getSavedVocabFromCookie = () => {
  const match = document.cookie.match(new RegExp('(^| )my_anime_saved_vocab=([^;]+)'));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveVocabToCookie = (vocabList: any[]) => {
  const maxAge = 30 * 24 * 60 * 60;
  document.cookie = `my_anime_saved_vocab=${encodeURIComponent(JSON.stringify(vocabList))}; path=/; max-age=${maxAge}`;
};

// --- Component Chính ---
export default function VocabularyPopup({ word, position, onClose, onSave }: VocabularyPopupProps) {
  const [saving, setSaving] = useState(false);
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (word) {
      lookupWord(word);
    }
  }, [word]);

  const lookupWord = async (w: string) => {
    setLoading(true);
    
    // Giả lập API tra từ (Mock data) thay vì dùng base44
    const result = await new Promise<LookupData>((resolve) => {
      setTimeout(() => {
        resolve({
          word: w,
          reading: w === '私' ? 'わたし' : 'chưa rõ cách đọc',
          meaning_vi: `Nghĩa tiếng Việt giả lập cho từ ${w}`,
          meaning_en: `English meaning for ${w}`,
          jlpt_level: ['N5', 'N4', 'N3', 'N2', 'N1'][Math.floor(Math.random() * 5)],
          example_sentence: `これは「${w}」の例文です。`,
          example_meaning: `Đây là câu ví dụ cho từ ${w}.`,
          related_words: [`Từ liên quan 1`, `Từ liên quan 2`],
          part_of_speech: 'Danh từ'
        });
      }, 1000); // Delay 1 giây
    });

    setLookupData(result);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!lookupData) return;
    setSaving(true);
    
    try {
      // Xử lý lưu vào Cookie thay vì base44
      const currentSavedList = getSavedVocabFromCookie();
      
      const newSavedVocab = {
        word: lookupData.word || word,
        reading: lookupData.reading || '',
        meaning_vi: lookupData.meaning_vi || '',
        meaning_en: lookupData.meaning_en || '',
        jlpt_level: lookupData.jlpt_level || 'Unknown',
        example_sentence: lookupData.example_sentence || '',
        example_meaning: lookupData.example_meaning || '',
        next_review_date: new Date().toISOString().split('T')[0],
        review_interval: 1,
        ease_factor: 2.5,
        review_count: 0,
        saved_at: new Date().toISOString()
      };

      const isAlreadySaved = currentSavedList.some((item: any) => item.word === newSavedVocab.word);

      if (isAlreadySaved) {
        toast.info('Từ này đã có trong sổ tay!');
      } else {
        currentSavedList.push(newSavedVocab);
        saveVocabToCookie(currentSavedList);
        toast.success('Đã lưu từ vựng vào Cookie!');
      }

      if (onSave) onSave();
    } catch (error) {
      toast.error('Lỗi khi lưu từ vựng!');
    } finally {
      setSaving(false);
    }
  };

  if (!word) return null;

  return (
    <div
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ left: Math.min(position?.x || 100, window.innerWidth - 340), top: (position?.y || 100) + 10 }}
    >
      <div className="w-80 rounded-2xl bg-[#12122a] border border-[#2a2a4a] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Close area */}
        <div className="fixed inset-0 -z-10" onClick={onClose} />
        
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-[#ff6b9d] animate-spin" />
            <p className="text-sm text-gray-400">Đang tra từ...</p>
          </div>
        ) : lookupData ? (
          <>
            <div className="p-4 bg-linear-to-r from-[#ff6b9d]/10 to-[#c084fc]/10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">{lookupData.word || word}</h3>
                  <p className="text-[#ff6b9d] text-lg">{lookupData.reading}</p>
                </div>
                {lookupData.jlpt_level && lookupData.jlpt_level !== 'Unknown' && (
                  <Badge className={`${jlptBadgeColors[lookupData.jlpt_level] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'} border text-xs`}>
                    {lookupData.jlpt_level}
                  </Badge>
                )}
              </div>
              <p className="text-gray-300 mt-2">{lookupData.meaning_vi}</p>
              <p className="text-gray-500 text-sm">{lookupData.meaning_en}</p>
              {lookupData.part_of_speech && (
                <Badge variant="outline" className="mt-2 text-xs border-[#2a2a4a] text-gray-400">
                  {lookupData.part_of_speech}
                </Badge>
              )}
            </div>

            {lookupData.example_sentence && (
              <div className="px-4 py-3 border-t border-[#1e1e3a]">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Ví dụ
                </p>
                <p className="text-sm text-white">{lookupData.example_sentence}</p>
                <p className="text-xs text-gray-400 mt-1">{lookupData.example_meaning}</p>
              </div>
            )}

            {lookupData.related_words && lookupData.related_words.length > 0 && (
              <div className="px-4 py-3 border-t border-[#1e1e3a]">
                <p className="text-xs text-gray-500 mb-2">Từ liên quan</p>
                <div className="flex flex-wrap gap-1">
                  {lookupData.related_words.slice(0, 5).map((rw, i) => (
                    <Badge key={i} variant="outline" className="border-[#2a2a4a] text-gray-300 text-xs">
                      {rw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 border-t border-[#1e1e3a]">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-linear-to-r from-[#ff6b9d] to-[#c084fc] text-white gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                Lưu từ vựng
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}