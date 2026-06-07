import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FlashcardModal } from './FlashcardModal';
import { VocabGrid } from './VocabGrid';
import type { FlashcardItem, FolderDetailData, HubFolder } from './types';

interface FolderDetailViewProps {
  folder: HubFolder;
  data?: FolderDetailData;
  isLoading?: boolean;
  readOnly?: boolean;
  onBack: () => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSave?: (item: FlashcardItem) => void;
  onReview?: (item: FlashcardItem, data: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
}

export function FolderDetailView({
  folder,
  data,
  isLoading,
  readOnly,
  onBack,
  onPageChange,
  onLimitChange,
  onSave,
  onReview,
  onDelete,
}: FolderDetailViewProps) {
  const [flashcardOpen, setFlashcardOpen] = useState(false);
  const items = data?.items || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      
    <button
      type="button"
      onClick={onBack}
      className="
        group mb-6 inline-flex items-center gap-2 rounded-lg
        border border-slate-200 bg-white px-4 py-2.5
        text-sm font-bold text-slate-600 shadow-sm
        transition-all duration-200
        hover:-translate-x-1 hover:border-emerald-200
        hover:bg-emerald-50 hover:text-emerald-700
        hover:shadow-md
        focus-visible:outline-none focus-visible:ring-4
        focus-visible:ring-emerald-100
      "
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 transition-colors group-hover:bg-emerald-100">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      </span>

      <span>Quay lại trang chủ</span>
    </button>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="space-y-6"
      >
          
      <header className="relative mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          
          {/* Thông tin folder */}
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-3">
              {/* Badge phân loại tinh tế */}
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  readOnly 
                    ? 'bg-slate-100 text-slate-600' 
                    : 'border border-emerald-100 bg-emerald-50 text-emerald-600'
                )}
              >
                {readOnly ? 'System Folder' : 'My Folder'}
              </span>

              {typeof folder.count === 'number' && (
                <span className="text-sm font-medium text-slate-400">
                  {folder.count} thẻ
                </span>
              )}
            </div>

            <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {folder.title}
            </h1>

            {(folder.description || folder.subtitle) && (
              <p className="mt-2 max-w-2xl break-words text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
                {folder.description || folder.subtitle}
              </p>
            )}
          </div>

          {/* Nút học Minimalist */}
          <Button
            type="button"
            disabled={!items.length || isLoading}
            onClick={() => setFlashcardOpen(true)}
            className="
              inline-flex h-11 w-full shrink-0 items-center justify-center gap-2.5 
              rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white 
              transition-colors hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400
              sm:w-auto
            "
          >
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Play className="h-4 w-4" fill="currentColor" />
            )}
            {isLoading ? 'Đang tải...' : 'Học Flashcard'}
          </Button>
        </div>
      </header>

        <VocabGrid
          items={items}
          isLoading={isLoading}
          readOnly={readOnly}
          pagination={data?.pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          onSave={onSave}
          onDelete={onDelete}
        />
      </motion.section>

      <FlashcardModal
        open={flashcardOpen}
        items={items}
        readOnly={readOnly}
        onClose={() => setFlashcardOpen(false)}
        onSave={onSave}
        onReview={onReview}
        onDelete={onDelete}
      />
    </main>
  );
}
