import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// 1. Khai báo cấu trúc dữ liệu cho một từ vựng
export interface VocabItem {
  id: string | number;
  word: string;
  reading?: string;
  jlpt_level?: string;
  meaning_vi?: string;
  meaning_en?: string;
  example_sentence?: string;
  example_meaning?: string;
}

// 2. Khai báo Props cho component
interface VocabListProps {
  vocabulary: VocabItem[];
  isLoading?: boolean;
  onDelete: (id: string | number) => void;
}

// 3. Khai báo Record<string, string> để truy xuất an toàn
const jlptColors: Record<string, string> = {
  N5: 'bg-green-500/20 text-green-400',
  N4: 'bg-blue-500/20 text-blue-400',
  N3: 'bg-purple-500/20 text-purple-400',
  N2: 'bg-orange-500/20 text-orange-400',
  N1: 'bg-red-500/20 text-red-400',
  Unknown: 'bg-gray-500/20 text-gray-400',
};

export default function VocabList({ vocabulary, isLoading, onDelete }: VocabListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-xl bg-[#12122a] border border-[#1e1e3a] p-4 animate-pulse">
            <Skeleton className="h-6 w-20 bg-[#1e1e3a]" />
            <Skeleton className="h-4 w-40 bg-[#1e1e3a] mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!vocabulary || vocabulary.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-white mb-2">Chưa có từ vựng</h3>
        <p className="text-gray-400">Hãy tra từ trong video để lưu từ vựng</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vocabulary.map(v => (
        <div key={v.id} className="rounded-xl bg-[#12122a] border border-[#1e1e3a] p-4 hover:border-[#2a2a4a] transition-all group">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white">{v.word}</span>
                <span className="text-[#ff6b9d]">{v.reading}</span>
                {v.jlpt_level && (
                  <Badge className={`${jlptColors[v.jlpt_level] || jlptColors.Unknown} border-0 text-xs`}>
                    {v.jlpt_level}
                  </Badge>
                )}
              </div>
              <p className="text-gray-300 mt-1">{v.meaning_vi}</p>
              <p className="text-gray-500 text-sm">{v.meaning_en}</p>
              {v.example_sentence && (
                <div className="mt-2 pl-3 border-l-2 border-[#1e1e3a]">
                  <p className="text-sm text-white">{v.example_sentence}</p>
                  <p className="text-xs text-gray-500">{v.example_meaning}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(v.id)}
              className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}