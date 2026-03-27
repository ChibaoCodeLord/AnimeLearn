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
  vocabData?: any;
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



// --- Component Chính ---
export default function VocabularyPopup({ word, position, onClose, onSave, vocabData }: VocabularyPopupProps) {
  const [saving, setSaving] = useState(false);
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (vocabData) {
      setLookupData({
        word: vocabData.word || word || '',
        reading: vocabData.reading || '',
        meaning_vi: vocabData.meaning || '',
        part_of_speech: vocabData.pos || ''
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
        meaning_vi: `Chưa có dữ liệu từ điển offline cho từ này. Vui lòng tạo lại Script AI để bóc tách bộ từ vựng mới nhất.`,
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        credentials: 'omit',
        body: JSON.stringify(newSavedVocab)
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message === 'Từ này đã có trong sổ tay') {
          toast.info(data.message);
        } else {
          toast.error(data.error || 'Lỗi khi lưu từ vựng!');
        }
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