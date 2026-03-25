import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Download, Search, Trash2, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

// 1. Định nghĩa Interface cho từ vựng
export interface VocabItem {
  id: string | number;
  word: string;
  reading?: string;
  meaning_vi?: string;
  meaning_en?: string;
  jlpt_level?: string;
  example_sentence?: string;
  example_meaning?: string;
  created_date: string;
  review_count?: number;
}

// 2. Các hàm tiện ích xử lý Storage (Mock Database)
const STORAGE_KEY = 'my_anime_saved_vocab';

const getVocabFromStorage = (): VocabItem[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return [];
};

const saveVocabToStorage = (list: VocabItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const jlptColors: Record<string, string> = {
  N5: 'bg-green-100 text-green-700 border-green-200',
  N4: 'bg-blue-100 text-blue-700 border-blue-200',
  N3: 'bg-purple-100 text-purple-700 border-purple-200',
  N2: 'bg-orange-100 text-orange-700 border-orange-200',
  N1: 'bg-red-100 text-red-700 border-red-200',
  Unknown: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function VocabularyNotebook() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  // 3. Mock Query
  const { data: vocabulary = [], isLoading } = useQuery<VocabItem[]>({
    queryKey: ['vocabulary-notebook'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 600)); // Delay giả lập
      return getVocabFromStorage();
    },
    initialData: [],
  });

  // 4. Mock Mutation xóa
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      await new Promise(r => setTimeout(r, 300));
      const current = getVocabFromStorage();
      const filtered = current.filter(v => v.id !== id);
      saveVocabToStorage(filtered);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary-notebook'] });
      toast.success('Đã xóa từ vựng');
    },
  });

  // Filter vocabulary
  const filteredVocab = vocabulary.filter((v: VocabItem) => {
    const matchSearch = !searchQuery || 
      v.word?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.reading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.meaning_vi?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchLevel = filterLevel === 'all' || v.jlpt_level === filterLevel;
    
    return matchSearch && matchLevel;
  });

  // Export to Anki format (TSV)
  const exportToAnki = () => {
    if (filteredVocab.length === 0) return toast.error("Không có dữ liệu để xuất");
    
    const ankiData = filteredVocab.map((v: VocabItem) => {
      const front = `${v.word || ''}<br><span style="color:gray">${v.reading || ''}</span>`;
      const back = `${v.meaning_vi || ''}<br><span style="color:gray">${v.meaning_en || ''}</span><br><br>${v.example_sentence || ''}<br><span style="color:gray">${v.example_meaning || ''}</span>`;
      return `${front}\t${back}\t${v.jlpt_level || ''}`;
    }).join('\n');

    const blob = new Blob([ankiData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myanime_anki_${moment().format('YYYY-MM-DD')}.txt`;
    a.click();
    toast.success('Đã xuất file Anki!');
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredVocab.length === 0) return toast.error("Không có dữ liệu để xuất");

    const headers = ['Từ', 'Đọc', 'Nghĩa (VI)', 'Nghĩa (EN)', 'JLPT', 'Ví dụ', 'Nghĩa ví dụ', 'Ngày tạo'];
    const rows = filteredVocab.map((v: VocabItem) => [
      v.word || '',
      v.reading || '',
      v.meaning_vi || '',
      v.meaning_en || '',
      v.jlpt_level || '',
      v.example_sentence || '',
      v.example_meaning || '',
      moment(v.created_date).format('DD/MM/YYYY')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocabulary_${moment().format('YYYY-MM-DD')}.csv`;
    a.click();
    toast.success('Đã xuất file CSV!');
  };

  // Tính toán thống kê
  const stats = {
    total: vocabulary.length,
    N5: vocabulary.filter(v => v.jlpt_level === 'N5').length,
    N4: vocabulary.filter(v => v.jlpt_level === 'N4').length,
    N3: vocabulary.filter(v => v.jlpt_level === 'N3').length,
    N2: vocabulary.filter(v => v.jlpt_level === 'N2').length,
    N1: vocabulary.filter(v => v.jlpt_level === 'N1').length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sổ tay từ vựng</h1>
            <p className="text-slate-600 text-sm">Kho lưu trữ từ vựng cá nhân</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToAnki} variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 shrink-0">
            <Download className="w-4 h-4" />
            Anki (TSV)
          </Button>
          <Button onClick={exportToCSV} className="gap-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shrink-0">
            <FileText className="w-4 h-4" />
            Xuất CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">TỔNG CỘNG</p>
        </div>
        {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map(level => (
          <div key={level} className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
            <p className="text-2xl font-bold text-slate-900">{stats[level]}</p>
            <p className="text-xs text-slate-500">{level}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo từ, cách đọc hoặc nghĩa..."
            className="pl-10 bg-white border-slate-200"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
        >
          <option value="all">Tất cả trình độ</option>
          <option value="N5">Trình độ N5</option>
          <option value="N4">Trình độ N4</option>
          <option value="N3">Trình độ N3</option>
          <option value="N2">Trình độ N2</option>
          <option value="N1">Trình độ N1</option>
        </select>
      </div>

      {/* List Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Đang tải dữ liệu từ bộ nhớ...</p>
        </div>
      ) : filteredVocab.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {searchQuery || filterLevel !== 'all' ? 'Không tìm thấy từ này' : 'Sổ tay đang trống'}
          </h3>
          <p className="text-slate-500 max-w-xs mx-auto text-sm">
            {searchQuery || filterLevel !== 'all' ? 'Hãy thử điều chỉnh lại từ khóa hoặc bộ lọc trình độ.' : 'Hãy học qua video và lưu các từ vựng mới để xây dựng từ điển cá nhân.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredVocab.map((v: VocabItem) => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-2xl font-bold text-slate-900">{v.word}</span>
                    <span className="text-lg text-emerald-600 font-medium">{v.reading}</span>
                    {v.jlpt_level && (
                      <Badge className={`${jlptColors[v.jlpt_level] || jlptColors.Unknown} border-xs`}>
                        {v.jlpt_level}
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-700 font-medium">{v.meaning_vi}</p>
                  <p className="text-slate-500 text-sm mb-4">{v.meaning_en}</p>
                  
                  {v.example_sentence && (
                    <div className="pl-4 border-l-3 border-emerald-100 bg-slate-50/50 py-2 pr-2 rounded-r-lg">
                      <p className="text-sm text-slate-800 leading-relaxed">{v.example_sentence}</p>
                      <p className="text-xs text-slate-500 mt-1 italic">{v.example_meaning}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                    <span>LƯU VÀO: {v.created_date ? moment(v.created_date).format('DD/MM/YYYY') : 'GẦN ĐÂY'}</span>
                    {(v.review_count ?? 0) > 0 && <span>ĐÃ ÔN: {v.review_count} LẦN</span>}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(v.id)}
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}