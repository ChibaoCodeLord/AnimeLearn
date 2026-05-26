import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, BookOpen, Sparkles, CheckCircle2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import FlashCard, { type FlashcardWord } from '../components/vocabulary/Flashcard';
import VocabList, { type VocabItem } from '../components/vocabulary/VocalList';
import { vocabularyApi } from '@/api/vocabulary.api';

// --- Các hàm tiện ích xử lý API ---

const getExportDateStamp = () => new Date().toISOString().slice(0, 10);

const downloadTextFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const escapeCsvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const escapeAnkiField = (value: string) => value.replace(/\t/g, ' ').replace(/\r?\n/g, '<br>');

const fetchVocabulary = async () => {
  return vocabularyApi.getVocabulary<VocabItem[]>();
};

// --- Component Chính ---

export default function Vocabulary() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('flashcards');

  // 1. Query lấy danh sách từ vựng
  const { data: vocabulary = [], isLoading } = useQuery<VocabItem[]>({
    queryKey: ['vocabulary'],
    queryFn: fetchVocabulary,
    initialData: [],
  });

  // 2. Mutation xóa từ vựng
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => vocabularyApi.deleteWord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      toast.success('Đã xóa từ vựng khỏi sổ tay');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Xóa từ vựng thất bại');
    }
  });

  // 3. Mutation cập nhật (sau khi review Flashcard)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      vocabularyApi.updateWord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Cập nhật thất bại');
    }
  });

  // Lọc các từ đến hạn ôn tập (next_review_date <= hôm nay)
  const dueWords = vocabulary.filter((v: any) => {
    if (!v.next_review_date) return true;
    return new Date(v.next_review_date) <= new Date();
  });


  const exportToAnki = () => {
    if (vocabulary.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    const ankiData = vocabulary
      .map((v: VocabItem) => {
        const front = escapeAnkiField([v.word, v.reading].filter(Boolean).join(' · '));
        const back = escapeAnkiField(
          [v.meaning_vi, v.meaning_en, v.example_sentence, v.example_meaning]
            .filter(Boolean)
            .join('<br><br>')
        );
        return `${front}\t${back}`;
      })
      .join('\n');

    downloadTextFile(ankiData, `vocabulary_anki_${getExportDateStamp()}.tsv`, 'text/tab-separated-values;charset=utf-8');
    toast.success('Đã xuất file Anki!');
  };

  const exportToCSV = () => {
    if (vocabulary.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }

    const headers = ['Từ', 'Đọc', 'Nghĩa (VI)', 'Nghĩa (EN)', 'JLPT', 'Ví dụ', 'Nghĩa ví dụ'];
    const rows = vocabulary.map((v: VocabItem) => [
      v.word || '',
      v.reading || '',
      v.meaning_vi || '',
      v.meaning_en || '',
      v.jlpt_level || '',
      v.example_sentence || '',
      v.example_meaning || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n');

    downloadTextFile(`\uFEFF${csvContent}`, `vocabulary_${getExportDateStamp()}.csv`, 'text/csv;charset=utf-8');
    toast.success('Đã xuất file CSV!');
  };
  

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
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2 sm:px-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Danh sách từ vựng</h3>
                <p className="text-sm text-slate-500"></p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0"
                  onClick={exportToAnki}
                  disabled={isLoading || vocabulary.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Anki (TSV)
                </Button>
                <Button
                  type="button"
                  className="gap-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shrink-0"
                  onClick={exportToCSV}
                  disabled={isLoading || vocabulary.length === 0}
                >
                  <FileText className="w-4 h-4" />
                  Xuất CSV
                </Button>
              </div>
            </div>

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
