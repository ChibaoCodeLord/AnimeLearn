import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PaginationControls } from './PaginationControls';
import type { FlashcardItem, PaginationMeta } from './types';

interface PaginatedListProps {
  items: FlashcardItem[];
  isLoading?: boolean;
  readOnly?: boolean;
  pagination?: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSave?: (item: FlashcardItem) => void;
  onDelete?: (id: string) => void;
}

export function PaginatedList({
  items,
  isLoading,
  readOnly,
  pagination,
  onPageChange,
  onLimitChange,
  onSave,
  onDelete,
}: PaginatedListProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-400">Archive</div>
          <h3 className="mt-1 text-xl font-black text-slate-950">Kho thẻ</h3>
        </div>
        <Badge className="bg-slate-100 text-slate-700">{pagination?.total || 0} mục</Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-slate-100 p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-4 w-72" />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="hidden grid-cols-[1.2fr_1.4fr_0.7fr_120px] gap-4 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400 lg:grid">
            <span>Thẻ</span>
            <span>Nghĩa</span>
            <span>Meta</span>
            <span className="text-right">Hành động</span>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const isKanji = item.item_type === 'kanji';

              return (
                <div key={`${item.item_type}-${item.id}`} className="grid gap-3 px-4 py-4 transition hover:bg-slate-50 lg:grid-cols-[1.2fr_1.4fr_0.7fr_120px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn('font-black text-slate-950', isKanji ? 'text-3xl' : 'text-lg')}>{item.word}</span>
                      {item.reading && <span className="font-bold text-teal-700">{item.reading}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline">{isKanji ? 'Kanji' : 'Vocab'}</Badge>
                      {item.jlpt_level && <Badge className="bg-slate-100 text-slate-700">{item.jlpt_level}</Badge>}
                    </div>
                  </div>

                  <div className="text-sm text-slate-600">
                    <div className="font-semibold text-slate-800">{item.meaning_vi || item.mean || 'Chưa có nghĩa'}</div>
                    {item.meaning_en && <div className="mt-1 text-slate-500">{item.meaning_en}</div>}
                  </div>

                  <div className="text-xs font-semibold text-slate-500">
                    {isKanji
                      ? [`On ${item.on || '-'}`, `Kun ${item.kun || '-'}`, `#${item.freq || '-'}`].join(' · ')
                      : [item.part_of_speech, item.popularity_score ? `Rank ${item.popularity_score}` : ''].filter(Boolean).join(' · ') || '-'}
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    {readOnly ? (
                      <Button className="bg-slate-950 text-white hover:bg-slate-800" onClick={() => onSave?.(item)}>
                        Lưu
                      </Button>
                    ) : (
                      <Button variant="destructive" onClick={() => onDelete?.(item.id)}>
                        Xóa
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center">
          <div className="text-5xl font-black text-slate-300">零</div>
          <p className="mt-3 text-sm font-medium text-slate-500">Không có thẻ nào trong trang này.</p>
        </div>
      )}

      <div className="mt-4">
        <PaginationControls pagination={pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} />
      </div>
    </div>
  );
}
