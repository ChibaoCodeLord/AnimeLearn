import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Định nghĩa cấu trúc của một từ vựng hiển thị
export interface VocabItem {
  word: string;
  reading?: string;
  meaning: string;
}

interface VocabularyAnalysisProps {
  vocabulary: VocabItem[];
}

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
  // Lưu cookie với thời hạn 30 ngày (tính bằng giây)
  const maxAge = 30 * 24 * 60 * 60;
  // Lưu ý: Chuỗi JSON dài có thể vượt quá giới hạn 4KB của Cookie
  document.cookie = `my_anime_saved_vocab=${encodeURIComponent(JSON.stringify(vocabList))}; path=/; max-age=${maxAge}`;
};

// --- Component Chính ---

export default function VocabularyAnalysis({ vocabulary }: VocabularyAnalysisProps) {
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

      // 2. Chuẩn bị object từ vựng hoàn chỉnh để lưu
      const newSavedVocab = {
        ...mockResult,
        next_review_date: new Date().toISOString().split('T')[0],
        review_interval: 1,
        ease_factor: 2.5,
        review_count: 0,
        saved_at: new Date().toISOString()
      };

      // 3. Xử lý lưu vào Cookie
      const currentSavedList = getSavedVocabFromCookie();
      
      // Kiểm tra xem từ này đã được lưu trước đó chưa
      const isAlreadySaved = currentSavedList.some((item: any) => item.word === newSavedVocab.word);

      if (isAlreadySaved) {
        toast.info(`Từ "${vocab.word}" đã có trong sổ tay!`);
      } else {
        currentSavedList.push(newSavedVocab);
        saveVocabToCookie(currentSavedList);
        toast.success(`Đã lưu từ "${vocab.word}" vào Cookie`);
      }

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
          <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{v.word}</span>
                <span className="text-sm text-emerald-600">{v.reading}</span>
              </div>
              <p className="text-xs text-slate-600">{v.meaning}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveWord(v)}
              disabled={saving[v.word]}
              // Thay flex-shrink-0 thành shrink-0 cho chuẩn Tailwind mới
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 gap-1 shrink-0"
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