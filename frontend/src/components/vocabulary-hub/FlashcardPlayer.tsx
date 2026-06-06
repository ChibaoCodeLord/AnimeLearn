import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { calculateNextReview, MASTERED_INTERVAL_DAYS } from './helpers';
import { getFolderToneClasses } from './palette';
import type { FlashcardItem, FolderTone } from './types';

interface FlashcardPlayerProps {
  items: FlashcardItem[];
  isLoading?: boolean;
  readOnly?: boolean;
  tone?: FolderTone;
  onSave?: (item: FlashcardItem) => void;
  onReview?: (item: FlashcardItem, data: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
}

export function FlashcardPlayer({
  items,
  isLoading,
  readOnly,
  tone = 'matcha',
  onSave,
  onReview,
  onDelete,
}: FlashcardPlayerProps) {
  const colors = getFolderToneClasses(tone);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const resetKey = useMemo(() => items.map((item) => item.id).join('|'), [items]);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [resetKey]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-white/60 bg-white/70 p-6 shadow-xl">
        <Skeleton className="mx-auto h-14 w-52" />
        <Skeleton className="mx-auto mt-8 h-6 w-80" />
        <Skeleton className="mx-auto mt-12 h-10 w-64" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-dashed border-slate-300 bg-white/80 p-10 text-center">
        <div className="text-5xl font-black text-slate-300">空</div>
        <h3 className="mt-4 text-xl font-black text-slate-950">Chưa có thẻ trong thư mục này</h3>
        <p className="mt-2 text-sm text-slate-500">Khi có dữ liệu, khu vực flashcard sẽ xuất hiện ở đây.</p>
      </div>
    );
  }

  const safeIndex = Math.min(index, items.length - 1);
  const item = items[safeIndex];
  const isKanji = item.item_type === 'kanji';

  const moveToNext = () => {
    setFlipped(false);
    setIndex((current) => Math.min(current + 1, items.length - 1));
  };

  const handleReview = (quality: number) => {
    const reviewData = calculateNextReview(quality, item.ease_factor, item.review_interval);
    const interval = Number(reviewData.review_interval);

    if (quality === 4 && interval >= MASTERED_INTERVAL_DAYS && onDelete) {
      onDelete(item.id);
      moveToNext();
      return;
    }

    onReview?.(item, {
      ...reviewData,
      review_count: (item.review_count || 0) + 1,
      review_date: new Date().toISOString(),
    });
    moveToNext();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm font-bold text-slate-500">
          {safeIndex + 1} / {items.length}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={colors.chip}>{isKanji ? 'Kanji' : 'Từ vựng'}</Badge>
          {item.jlpt_level && <Badge variant="outline">{item.jlpt_level}</Badge>}
        </div>
      </div>

      <div className="relative" style={{ perspective: '1600px' }}>
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          className="relative h-[360px] w-full rounded-lg outline-none sm:h-[420px]"
          aria-label="Lật flashcard"
        >
          <div
            className="absolute inset-0 rounded-lg transition-transform duration-700 ease-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div
              className={cn(
                'absolute inset-0 overflow-hidden rounded-lg border bg-linear-to-br p-8 text-center shadow-[0_32px_90px_rgba(15,23,42,0.18)]',
                colors.border,
                colors.cover,
              )}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div
                className="absolute inset-0 opacity-35"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(rgba(15,23,42,0.07) 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
              />
              <div className="absolute right-6 top-4 text-8xl font-black text-white/45">{isKanji ? '字' : '語'}</div>

              <div className="relative z-10 flex h-full flex-col items-center justify-center">
                <div className="text-xs font-black uppercase tracking-[0.38em] text-slate-500">Front</div>
                <div className={cn('mt-7 font-black tracking-tight text-slate-950', isKanji ? 'text-8xl sm:text-9xl' : 'text-5xl sm:text-6xl')}>
                  {item.word}
                </div>
                {!isKanji && item.reading && <div className="mt-5 text-2xl font-bold text-teal-800">{item.reading}</div>}
                <div className="mt-8 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-white/80">
                  Tap để lật thẻ
                </div>
              </div>
            </div>

            <div
              className="absolute inset-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-8 text-center shadow-[0_32px_90px_rgba(15,23,42,0.18)]"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg, rgba(15,23,42,0.04) 0 1px, transparent 1px 16px)',
                }}
              />
              <div className="relative z-10 flex h-full flex-col items-center justify-center">
                <div className="text-xs font-black uppercase tracking-[0.38em] text-slate-400">Back</div>
                <div className="mt-5 text-3xl font-black text-slate-950">{item.meaning_vi || item.mean || 'Chưa có nghĩa'}</div>
                {item.meaning_en && <p className="mt-2 text-base text-slate-500">{item.meaning_en}</p>}

                {isKanji ? (
                  <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                    <BackPanel label="Âm On" value={item.on || '-'} />
                    <BackPanel label="Âm Kun" value={item.kun || '-'} />
                    <BackPanel label="Số nét" value={item.stroke_count ? String(item.stroke_count) : '-'} />
                    <BackPanel label="Tần suất" value={item.freq ? String(item.freq) : '-'} />
                  </div>
                ) : (
                  item.example_sentence && (
                    <div className="mt-8 max-w-2xl rounded-lg bg-slate-50 p-4 text-left ring-1 ring-slate-100">
                      <p className="text-lg font-bold text-slate-950">{item.example_sentence}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.example_meaning}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={safeIndex === 0}
            onClick={() => {
              setIndex((current) => Math.max(current - 1, 0));
              setFlipped(false);
            }}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            disabled={safeIndex >= items.length - 1}
            onClick={() => {
              setIndex((current) => Math.min(current + 1, items.length - 1));
              setFlipped(false);
            }}
          >
            Sau
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {readOnly ? (
            <motion.div key="save" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Button className={colors.button} onClick={() => onSave?.(item)}>
                Lưu thẻ này
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="grid grid-cols-4 gap-2"
            >
              <ReviewButton label="Again" tone="rose" onClick={() => handleReview(1)} />
              <ReviewButton label="Hard" tone="amber" onClick={() => handleReview(2)} />
              <ReviewButton label="Good" tone="emerald" onClick={() => handleReview(3)} />
              <ReviewButton label="Easy" tone="sky" onClick={() => handleReview(4)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BackPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 text-left ring-1 ring-slate-100">
      <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
    </div>
  );
}

function ReviewButton({ label, tone, onClick }: { label: string; tone: 'rose' | 'amber' | 'emerald' | 'sky'; onClick: () => void }) {
  const styles = {
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    sky: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
  };

  return (
    <Button variant="outline" className={cn('h-10 font-black', styles[tone])} onClick={onClick}>
      {label}
    </Button>
  );
}
