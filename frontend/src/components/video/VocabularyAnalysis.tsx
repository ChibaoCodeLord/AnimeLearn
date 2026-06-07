import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Loader2, BookOpen } from 'lucide-react'; // Thêm BookOpen cho icon tiêu đề
import { toast } from 'sonner';
import { videoApi } from '@/api/video.api';
import { LearningSaveModal } from '@/components/vocabulary-hub/LearningSaveModal';
import type { FlashcardItem } from '@/components/vocabulary-hub/types';

// Định nghĩa cấu trúc của một từ vựng hiển thị
export interface VocabItem {
  word: string;
  reading?: string;
  meaning: string;
  pos?: string; // Thêm pos nếu bạn có truyền loại từ vào
}

interface VocabularyAnalysisProps {
  vocabulary: VocabItem[];
  onWordClick?: (vocab: any) => void; 
}

// --- Các hàm tiện ích xử lý Storage ---

const STORAGE_KEY = 'my_anime_saved_vocab';

const getSavedVocabFromStorage = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  const match = document.cookie.match(new RegExp('(^| )' + STORAGE_KEY + '=([^;]+)'));
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[2]));
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveVocabToStorage = (vocabList: any[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vocabList));

  // Lưu cookie với thời hạn 30 ngày (tính bằng giây)
  const maxAge = 30 * 24 * 60 * 60;
  // Lưu ý: Chuỗi JSON dài có thể vượt quá giới hạn 4KB của Cookie
  document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(vocabList))}; path=/; max-age=${maxAge}`;
};

// --- Component Chính ---

export default function VocabularyAnalysis({ vocabulary, onWordClick }: VocabularyAnalysisProps) {
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveTarget, setSaveTarget] = useState<FlashcardItem | null>(null);

  const vocabToFlashcard = (vocab: VocabItem): FlashcardItem => ({
    id: vocab.word,
    item_type: 'vocab',
    word: vocab.word,
    reading: vocab.reading || '',
    meaning_vi: vocab.meaning || '',
    part_of_speech: vocab.pos || '',
    jlpt_level: 'Unknown',
  });

  const saveWord = async (vocab: VocabItem) => {
    setSaveTarget(vocabToFlashcard(vocab));
    return;

    setSaving((prev) => ({ ...prev, [vocab.word]: true }));

    try {
      // 1. Giả lập gọi API (Mock LLM delay 1 giây)
      const mockResult = await new Promise<any>((resolve) => {
        setTimeout(() => {
          resolve({
            word: vocab.word,
            reading: vocab.reading || 'chưa có cách đọc',
            meaning_vi: vocab.meaning,
            meaning_en: `${vocab.word} (Mocked English Meaning)`,
            jlpt_level: ['N5', 'N4', 'N3', 'N2', 'N1'][Math.floor(Math.random() * 5)], // Random N5-N1
            example_sentence: `これは「${vocab.word}」の例文です。`,
            example_meaning: `Đây là câu ví dụ giả lập cho từ ${vocab.word}.`,
          });
        }, 1000);
      });

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Bạn cần đăng nhập để lưu từ vựng.');
        return;
      }

      const payload = {
        word: mockResult.word,
        reading: mockResult.reading,
        meaning_vi: mockResult.meaning_vi,
        meaning_en: mockResult.meaning_en,
        part_of_speech: vocab.pos || '',
        jlpt_level: mockResult.jlpt_level || 'Unknown',
        example_sentence: mockResult.example_sentence || '',
        example_meaning: mockResult.example_meaning || ''
      };

      const data = await videoApi.saveWord<{ message?: string; vocab?: any }>(payload);

      const savedFromServer = data?.vocab || {};
      const newSavedVocab = {
        id: savedFromServer._id || savedFromServer.id || payload.word,
        word: savedFromServer.word || payload.word,
        reading: savedFromServer.reading || payload.reading,
        meaning_vi: savedFromServer.meaning_vi || payload.meaning_vi,
        meaning_en: savedFromServer.meaning_en || payload.meaning_en,
        part_of_speech: savedFromServer.part_of_speech || payload.part_of_speech,
        jlpt_level: savedFromServer.jlpt_level || payload.jlpt_level,
        example_sentence: savedFromServer.example_sentence || payload.example_sentence,
        example_meaning: savedFromServer.example_meaning || payload.example_meaning,
        next_review_date: new Date().toISOString().split('T')[0],
        review_interval: 1,
        ease_factor: 2.5,
        review_count: 0,
        saved_at: savedFromServer.saved_at || new Date().toISOString()
      };

      const currentSavedList = getSavedVocabFromStorage();
      const existingIndex = currentSavedList.findIndex((item: any) => item.word === newSavedVocab.word);

      if (existingIndex >= 0) {
        currentSavedList[existingIndex] = { ...currentSavedList[existingIndex], ...newSavedVocab };
      } else {
        currentSavedList.push(newSavedVocab);
      }

      saveVocabToStorage(currentSavedList);
      toast.success(data.message || `Đã lưu từ "${vocab.word}" vào Database`);

    } catch (error: any) {
      console.error("Lỗi khi lưu từ vựng:", error);
      const message = error instanceof Error ? error.message : '';
      if (message === 'Từ này đã có trong sổ tay') {
        toast.info(message);
      } else {
        toast.error(`Không thể lưu từ "${vocab.word}"`);
      }
    } finally {
      // Tắt trạng thái loading
      setSaving((prev) => ({ ...prev, [vocab.word]: false }));
    }
  };

  if (!vocabulary || vocabulary.length === 0) return null;

  return (
    <div className="border border-teal-200 pt-3 p-2 bg-to-br from-emerald-50 to-teal-50 rounded-2xl">
      <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-3 flex items-center gap-1.5 px-1">
        <BookOpen className="w-3.5 h-3.5" />
        Từ vựng trong câu
      </p>
      
      <div className="space-y-2.5">
        {vocabulary.map((v, idx) => (
          <div 
            key={idx} 
            onClick={() => onWordClick && onWordClick(v)}
            className="
              group
              relative
              flex items-center justify-between gap-3
              p-3 pl-4
              rounded-xl
              bg-white
              border border-slate-300
              shadow-sm
              cursor-pointer
              transition-all duration-200
              hover:border-emerald-300 hover:shadow-md hover:bg-emerald-50/30
              overflow-hidden
            "
          >
            {/* Vạch trang trí bên trái hiện lên khi Hover */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex-1 min-w-0 pointer-events-none">
              <div className="flex items-baseline gap-2.5 mb-1.5">
                <span className="text-[17px] font-black text-slate-900 tracking-tight">
                  {v.word}
                </span>
                
                <div className="flex items-center gap-2 min-w-0">
                  {v.reading && (
                    <span
                      title={v.reading}
                      className="inline-block max-w-[120px] truncate align-middle text-[14px] font-bold text-emerald-900 border border-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md"
                    >
                      {v.reading}
                    </span>
                  )}
                </div>
                
                {v.pos && (
                  <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wider border border-slate-600 px-1.5 py-0.5 rounded">
                    {v.pos}
                  </span>
                )}
              </div>
              <p className="text-[14px] text-slate-600 font-medium line-clamp-1 pr-2">
                {v.meaning}
              </p>
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation(); // Ngăn chặn click lan ra ngoài làm mở Modal
                saveWord(v);
              }}
              disabled={saving[v.word]}
              className="
                shrink-0
                h-9 px-3
                bg-slate-100 text-slate-600 
                hover:bg-emerald-100 hover:text-emerald-700
                transition-colors border border-transparent hover:border-emerald-200
                gap-1.5
              "
            >
              {saving[v.word] ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BookmarkPlus className="w-3.5 h-3.5" />
              )}
              <span className="text-[13px] font-semibold">Lưu</span>
            </Button>
          </div>
        ))}
      </div>

      <LearningSaveModal
        item={saveTarget}
        onClose={() => setSaveTarget(null)}
      />
    </div>
  );
}
