import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Định nghĩa cấu trúc của một từ vựng hiển thị
export interface VocabItem {
  word: string;
  reading?: string;
  meaning: string;
  pos?: string; // Thêm pos nếu bạn có truyền loại từ vào
}

interface VocabularyAnalysisProps {
  vocabulary: VocabItem[];
  // THÊM PROP NÀY ĐỂ KÍCH HOẠT MODAL Ở SCRIPT PANEL
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

  const saveWord = async (vocab: VocabItem) => {
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

      const response = await fetch('http://localhost:5000/api/video/save-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'omit',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.message === 'Từ này đã có trong sổ tay') {
          toast.info(data.message);
        } else {
          toast.error(data.error || 'Lỗi khi lưu từ vựng!');
        }
        return;
      }

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

    } catch (error) {
      console.error("Lỗi khi lưu từ vựng:", error);
      toast.error(`Không thể lưu từ "${vocab.word}"`);
    } finally {
      // Tắt trạng thái loading
      setSaving((prev) => ({ ...prev, [vocab.word]: false }));
    }
  };

  if (!vocabulary || vocabulary.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-slate-500 font-medium">Từ vựng trong câu:</p>
      <div className="space-y-2">
        {vocabulary.map((v, idx) => (
          <div 
            key={idx} 
            // THÊM HIỆU ỨNG CLICK VÀ GỌI HÀM onWordClick Ở ĐÂY
            onClick={() => onWordClick && onWordClick(v)}
            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 cursor-pointer hover:bg-emerald-100/60 transition-colors"
          >
            <div className="flex-1 min-w-0 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{v.word}</span>
                <span className="text-sm text-emerald-600">{v.reading}</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-1">{v.meaning}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation(); // CỰC KỲ QUAN TRỌNG: Ngăn chặn click lan ra ngoài làm mở Modal
                saveWord(v);
              }}
              disabled={saving[v.word]}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-200/50 gap-1 shrink-0"
            >
              {saving[v.word] ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <BookmarkPlus className="w-3 h-3" />
              )}
              <span className="text-xs">Lưu</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}