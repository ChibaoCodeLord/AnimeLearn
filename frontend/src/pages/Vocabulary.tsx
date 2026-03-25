import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import FlashCard, { type FlashcardWord } from '../components/vocabulary/Flashcard';
import VocabList, { type VocabItem } from '../components/vocabulary/VocalList';

// --- Các hàm tiện ích xử lý Storage (Mock Database) ---

const STORAGE_KEY = 'my_anime_saved_vocab';

const getVocabFromStorage = (): VocabItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  
  const match = document.cookie.match(new RegExp('(^| )' + STORAGE_KEY + '=([^;]+)'));
  if (match) return JSON.parse(decodeURIComponent(match[2]));
  
  return [];
};

const saveVocabToStorage = (list: VocabItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(list))}; path=/; max-age=2592000`;
};

// --- Component Chính ---

export default function Vocabulary() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('flashcards');

  // 1. Query lấy danh sách từ vựng
  const { data: vocabulary = [], isLoading } = useQuery<VocabItem[]>({
    queryKey: ['vocabulary'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 600)); // Giả lập delay cho mượt
      return getVocabFromStorage();
    },
    initialData: [],
  });

  // 2. Mutation xóa từ vựng
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      await new Promise(r => setTimeout(r, 300));
      const current = getVocabFromStorage();
      const filtered = current.filter(v => v.id !== id);
      saveVocabToStorage(filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      toast.success('Đã xóa từ vựng khỏi sổ tay');
    },
  });

  // 3. Mutation cập nhật (sau khi review Flashcard)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
      await new Promise(r => setTimeout(r, 200));
      const current = getVocabFromStorage();
      const index = current.findIndex(v => v.id === id);
      if (index !== -1) {
        current[index] = { ...current[index], ...data };
        saveVocabToStorage(current);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
  });

  // Lọc các từ đến hạn ôn tập (next_review_date <= hôm nay)
  const dueWords = vocabulary.filter((v: any) => {
    if (!v.next_review_date) return true;
    return new Date(v.next_review_date) <= new Date();
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sổ tay của tôi</h1>
              <p className="text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Không gian ôn tập và quản lý từ vựng cá nhân
              </p>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-xs border border-slate-100 shrink-0">
          <div className="flex flex-col px-4 py-1 border-r border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Đã lưu</span>
            <span className="text-lg font-bold text-slate-700 leading-none">{vocabulary.length} <span className="text-xs font-medium text-slate-500">từ</span></span>
          </div>
          <div className="flex flex-col px-4 py-1">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Cần ôn tập</span>
            <span className="text-lg font-bold text-emerald-600 leading-none">{dueWords.length} <span className="text-xs font-medium text-emerald-400">từ</span></span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Custom Tabs List */}
        <TabsList className="bg-slate-100/80 p-5 rounded-2xl mb-8 border border-slate-200/60 shadow-inner inline-flex h-auto">
          <TabsTrigger 
            value="flashcards" 
          className="rounded-xl px-6 py-3 font-semibold text-slate-600 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
          >
            Luyện Flashcard
          </TabsTrigger>
          <TabsTrigger 
            value="list" 
            className="rounded-xl px-6 py-3 font-semibold text-slate-600 data-[state=active]:bg-linear-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
          >
            Danh sách từ vựng
          </TabsTrigger>
        </TabsList>

        {/* Tab Ôn tập Flashcard */}
        <TabsContent value="flashcards" className="focus-visible:outline-hidden mt-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-slate-400 font-medium animate-pulse">Đang chuẩn bị thẻ học...</p>
            </div>
          ) : dueWords.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden">
              {/* Decorative Background Blur */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Mục tiêu hôm nay đã hoàn thành!</h3>
                <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                  Thật tuyệt vời! Bạn đã ôn tập hết tất cả từ vựng cần thiết cho hôm nay. Hãy học thêm video mới để thu thập thêm từ vựng nhé.
                </p>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <FlashCard 
                words={dueWords as FlashcardWord[]} 
                onReview={(payload) => updateMutation.mutate(payload)} 
              />
            </div>
          )}
        </TabsContent>

        {/* Tab Danh sách quản lý */}
        <TabsContent value="list" className="focus-visible:outline-hidden mt-0">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xs p-2 sm:p-6 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <VocabList
              vocabulary={vocabulary}
              isLoading={isLoading}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}