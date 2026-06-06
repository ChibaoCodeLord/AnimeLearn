import { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from './PaginationControls';
import { VocabCard } from './VocabCard';
import { VocabInfoModal } from './VocabInfoModal';
import type { FlashcardItem, PaginationMeta } from './types';

interface VocabGridProps {
  items: FlashcardItem[];
  isLoading?: boolean;
  readOnly?: boolean;
  pagination?: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSave?: (item: FlashcardItem) => void;
  onDelete?: (id: string) => void;
}

export function VocabGrid({
  items,
  isLoading,
  readOnly,
  pagination,
  onPageChange,
  onLimitChange,
  onSave,
  onDelete,
}: VocabGridProps) {
  const [selectedItem, setSelectedItem] = useState<FlashcardItem | null>(null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Kho thẻ từ vựng</h2>
          <p className="text-sm text-slate-500">Click vào một thẻ để xem chi tiết.</p>
        </div>
        <div className="text-sm font-medium text-slate-500">{pagination?.total || 0} thẻ</div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
              <Skeleton className="mx-auto h-10 w-24" />
              <Skeleton className="mx-auto mt-5 h-4 w-32" />
              <Skeleton className="mx-auto mt-3 h-4 w-40" />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <VocabCard
              key={`${item.item_type}-${item.id}`}
              item={item}
              readOnly={readOnly}
              onOpenDetails={setSelectedItem}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <h3 className="text-base font-semibold text-slate-800">Chưa có thẻ</h3>
          <p className="mt-1 text-sm text-slate-500">Thư mục này chưa có dữ liệu để hiển thị.</p>
        </div>
      )}

      <div className="mt-5">
        <PaginationControls pagination={pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} />
      </div>

      <VocabInfoModal
        item={selectedItem}
        readOnly={readOnly}
        onClose={() => setSelectedItem(null)}
        onSave={onSave}
        onDelete={onDelete}
      />
    </section>
  );
}
