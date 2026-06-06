import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  calculateNextReview,
  MASTERED_INTERVAL_DAYS,
} from './helpers';
import {
  getItemMeaning,
  getTone,
  parseMeaning,
} from './display';
import type { FlashcardItem } from './types';

interface FlashcardModalProps {
  open: boolean;
  items: FlashcardItem[];
  readOnly?: boolean;
  onClose: () => void;
  onSave?: (item: FlashcardItem) => void;
  onReview?: (
    item: FlashcardItem,
    data: Record<string, unknown>,
  ) => void;
  onDelete?: (id: string) => void;
}

export function FlashcardModal({
  open,
  items,
  readOnly,
  onClose,
  onSave,
  onReview,
  onDelete,
}: FlashcardModalProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showReading, setShowReading] = useState(true);

  const resetKey = useMemo(
    () => items.map((item) => item.id).join('|'),
    [items],
  );

  useEffect(() => {
    if (!open) return;

    setIndex(0);
    setFlipped(false);
    setShowReading(true);
  }, [open, resetKey]);

  if (!open) return null;

  const item =
    items[Math.min(index, Math.max(items.length - 1, 0))];

  const isKanji = item?.item_type === 'kanji';
  const tone = getTone(item);

  const primaryMeaning = parseMeaning(
    getItemMeaning(item),
  );

  const englishMeaning = parseMeaning(
    item?.meaning_en,
  );

  const canToggleReading = items.some(
    (entry) =>
      entry.item_type === 'vocab' &&
      entry.reading,
  );

  const shouldShowReading =
    isKanji || showReading;

  const wordLength =
    item?.word?.length || 0;

  const wordSize = isKanji
    ? 'text-[clamp(4.8rem,18vw,9.5rem)]'
    : wordLength > 34
      ? 'text-[clamp(1.25rem,4vw,2.6rem)]'
      : wordLength > 18
        ? 'text-[clamp(1.65rem,5vw,3.4rem)]'
        : 'text-[clamp(2.5rem,9vw,5.4rem)]';

  const goPrev = () => {
    setFlipped(false);

    setIndex((current) =>
      Math.max(current - 1, 0),
    );
  };

  const goNext = () => {
    setFlipped(false);

    setIndex((current) =>
      Math.min(
        current + 1,
        items.length - 1,
      ),
    );
  };

  const handleReview = (
    quality: number,
  ) => {
    if (!item) return;

    const reviewData =
      calculateNextReview(
        quality,
        item.ease_factor,
        item.review_interval,
      );

    if (
      quality === 4 &&
      Number(
        reviewData.review_interval,
      ) >= MASTERED_INTERVAL_DAYS &&
      onDelete
    ) {
      onDelete(item.id);
      goNext();
      return;
    }

    onReview?.(item, {
      ...reviewData,
      review_count:
        (item.review_count || 0) + 1,
      review_date:
        new Date().toISOString(),
    });

    goNext();
  };

  return (
    <div className="fixed inset-0 z-50 h-dvh overflow-hidden bg-slate-950/90 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-5">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col overflow-hidden">
        {/* Header */}
        <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white shadow-xl">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              Flashcard trang hiện tại
            </div>

            <div className="mt-1 truncate text-lg font-bold">
              {items.length
                ? `${index + 1} / ${items.length}`
                : 'Không có thẻ'}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {canToggleReading && (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setShowReading(
                    (value) => !value,
                  )
                }
                aria-pressed={showReading}
                className="rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                {showReading ? (
                  <Eye className="mr-2 h-4 w-4" />
                ) : (
                  <EyeOff className="mr-2 h-4 w-4" />
                )}

                {showReading
                  ? 'Tắt cách đọc'
                  : 'Bật cách đọc'}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white text-slate-950 hover:bg-slate-100"
              aria-label="Đóng flashcard"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {item ? (
          <main className="flex min-h-0 w-full flex-1 flex-col items-center gap-4 overflow-hidden">
            {/* Khu vực flashcard */}
            <div
              className="min-h-0 w-full max-w-4xl flex-1 overflow-hidden"
              style={{
                perspective: '1800px',
              }}
            >
              {/* Vùng nhận sự kiện lật card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  setFlipped(
                    (value) => !value,
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault();

                    setFlipped(
                      (value) => !value,
                    );
                  }
                }}
                className="relative h-full min-h-0 w-full cursor-pointer overflow-hidden rounded-[2rem] outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                aria-label="Lật flashcard"
              >
                {/* Wrapper xoay cả hai mặt */}
                <div
                  className="absolute inset-0 h-full min-h-0 w-full rounded-[2rem] transition-transform duration-700 ease-out"
                  style={{
                    transformStyle:
                      'preserve-3d',
                    transform: flipped
                      ? 'rotateY(180deg)'
                      : 'rotateY(0deg)',
                  }}
                >
                  {/* ==================== */}
                  {/* MẶT TRƯỚC */}
                  {/* ==================== */}

                  <CardFace
                    side="front"
                    className={cn(
                      'bg-white',
                      tone.border,
                    )}
                  >
                    {/* Thanh màu phía trên */}
                    <div
                      className={cn(
                        'h-2 shrink-0',
                        tone.strip,
                      )}
                    />

                    {/* Header card cố định */}
                    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4">
                      <Badge
                        className={cn(
                          'border-0 ring-1',
                          tone.chip,
                        )}
                      >
                        {tone.name}
                      </Badge>

                      {item.jlpt_level && (
                        <Badge
                          variant="outline"
                          className="shrink-0"
                        >
                          {item.jlpt_level}
                        </Badge>
                      )}
                    </div>

                    {/* Vùng cuộn dọc duy nhất của mặt trước */}
                    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
                      <div className="flex min-h-full w-full min-w-0 flex-col items-center justify-center px-5 py-8 sm:px-8">
                        {/* Từ/Kanji - cuộn ngang nếu quá dài */}
                        <div className="pb-8">
                          <h2
                            className={cn(
                              `
                                mx-auto
                                w-max
                                min-w-full
                                whitespace-nowrap
                                px-4
                                text-center
                                font-black
                                tracking-tight
                                text-slate-950
                              `,
                              wordSize,
                            )}
                          >
                            {item.word}
                          </h2>
                        </div>

                        {/* Cách đọc */}
                        {!isKanji && item.reading && (
                          <div className="mt-7 flex w-full min-w-0 justify-center">
                            {shouldShowReading ? (
                              <div className="flex max-w-full items-center gap-4">
                                {/* Nội dung */}
                                <p className="min-w-0 break-words text-[clamp(1.25rem,3vw,1.9rem)]  font-black leading-snug tracking-wide text-slate-800 [overflow-wrap:anywhere]">
                                  【{item.reading}】
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 text-slate-400">
                                <span className="text-xl font-black text-slate-300">
                                  読
                                </span>

                                <span className="text-medium font-bold tracking-wide">
                                  Cách đọc đang được ẩn
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hướng dẫn lật */}
                        <div className="mt-15 flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-slate-500">
                          <RotateCcw className="h-4 w-4 shrink-0" />

                          <span>
                            Bấm vào thẻ để lật
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardFace>

                  {/* ==================== */}
                  {/* MẶT SAU */}
                  {/* ==================== */}

                  <CardFace
                    side="back"
                    className="bg-white"
                  >
                    {/* Thanh màu phía trên */}
                    <div
                      className={cn(
                        'h-2 shrink-0',
                        tone.strip,
                      )}
                    />

                    {/* Nội dung mặt sau cuộn dọc */}
                    <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain bg-slate-50/80 px-5 py-5 sm:px-7">
                      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
                        <Badge
                          className={cn(
                            'border-0 ring-1',
                            tone.chip,
                          )}
                        >
                          Mặt sau
                        </Badge>

                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Nghĩa và ghi chú
                        </span>
                      </div>

                      <div className="space-y-4">
                        {!isKanji && primaryMeaning.heading && (
                          <HanVietBlock value={primaryMeaning.heading} />
                        )}

                        <MeaningBlock
                          title="Ý nghĩa"
                          items={
                            primaryMeaning.items
                          }
                          tone={tone.text}
                        />

                        {englishMeaning.items
                          .length > 0 && (
                          <MeaningBlock
                            title="English"
                            items={
                              englishMeaning.items
                            }
                            tone="text-sky-700"
                          />
                        )}

                        {isKanji ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <InfoBox
                              label="Âm On"
                              value={
                                item.on || '-'
                              }
                            />

                            <InfoBox
                              label="Âm Kun"
                              value={
                                item.kun || '-'
                              }
                            />

                            <InfoBox
                              label="Số nét"
                              value={
                                item.stroke_count
                                  ? String(
                                      item.stroke_count,
                                    )
                                  : '-'
                              }
                            />

                            <InfoBox
                              label="Tần suất"
                              value={
                                item.freq
                                  ? String(
                                      item.freq,
                                    )
                                  : '-'
                              }
                            />
                          </div>
                        ) : (
                          item.example_sentence && (
                            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                              <h3 className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                                Ví dụ
                              </h3>

                              <p className="break-words text-base font-bold leading-7 text-slate-900 [overflow-wrap:anywhere]">
                                {
                                  item.example_sentence
                                }
                              </p>

                              {item.example_meaning && (
                                <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-600 [overflow-wrap:anywhere]">
                                  {
                                    item.example_meaning
                                  }
                                </p>
                              )}
                            </section>
                          )
                        )}

                        {item.detail && (
                          <section className="rounded-2xl border border-slate-200 bg-white p-4">
                            <h3 className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                              Chi tiết
                            </h3>

                            <p className="whitespace-pre-wrap break-words text-sm font-medium leading-7 text-slate-700 [overflow-wrap:anywhere]">
                              {item.detail}
                            </p>
                          </section>
                        )}
                      </div>
                    </div>
                  </CardFace>
                </div>
              </div>
            </div>

            {/* Footer điều hướng */}
            <footer className="flex w-full max-w-4xl shrink-0 flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button
                  variant="outline"
                  disabled={index === 0}
                  onClick={goPrev}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Trước
                </Button>

                <Button
                  variant="outline"
                  disabled={
                    index >=
                    items.length - 1
                  }
                  onClick={goNext}
                >
                  Sau
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {readOnly ? (
                  <motion.div
                    key="save"
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                    }}
                  >
                    <Button
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                      onClick={() =>
                        onSave?.(item)
                      }
                    >
                      <BookmarkPlus className="mr-2 h-4 w-4" />

                      Lưu thẻ này
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="review"
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -8,
                    }}
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                  >
                    <ReviewButton
                      label="Again"
                      tone="rose"
                      onClick={() =>
                        handleReview(1)
                      }
                    />

                    <ReviewButton
                      label="Hard"
                      tone="amber"
                      onClick={() =>
                        handleReview(2)
                      }
                    />

                    <ReviewButton
                      label="Good"
                      tone="emerald"
                      onClick={() =>
                        handleReview(3)
                      }
                    />

                    <ReviewButton
                      label="Easy"
                      tone="sky"
                      onClick={() =>
                        handleReview(4)
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </footer>
          </main>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-white p-8 text-center text-slate-600">
            Trang này không có thẻ để học.
          </div>
        )}
      </div>
    </div>
  );
}

function CardFace({
  side,
  children,
  className,
}: {
  side: 'front' | 'back';
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        `
          absolute
          inset-0
          flex
          h-full
          min-h-0
          w-full
          flex-col
          overflow-hidden
          rounded-[2rem]
          border
          shadow-2xl
        `,
        className,
      )}
      style={{
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility:
          'hidden',
        transform:
          side === 'back'
            ? 'rotateY(180deg)'
            : 'rotateY(0deg)',
      }}
    >
      {children}
    </div>
  );
}

function HanVietBlock({ value }: { value: string }) {
  return (
    <section className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
      <h3 className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
        Hán Việt
      </h3>

      <div className="custom-scrollbar max-h-28 overflow-y-auto overscroll-contain pr-1">
        <p className="break-words text-[clamp(1.2rem,3.5vw,2rem)] font-black uppercase leading-tight tracking-wide text-slate-950 [overflow-wrap:anywhere]">
          {value}
        </p>
      </div>
    </section>
  );
}

function MeaningBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {title}
      </h3>

      {items.length ? (
        <ol className="space-y-2">
          {items.map(
            (meaning, index) => (
              <li
                key={`${meaning}-${index}`}
                className="flex min-w-0 gap-3 rounded-xl bg-slate-50 p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                  {index + 1}
                </span>

                <p
                  className={cn(
                    `
                      min-w-0
                      flex-1
                      break-words
                      text-base
                      font-bold
                      leading-7
                      text-slate-900
                      [overflow-wrap:anywhere]
                    `,
                    tone,
                  )}
                >
                  {meaning}
                </p>
              </li>
            ),
          )}
        </ol>
      ) : (
        <p className="text-sm font-medium text-slate-500">
          Chưa có dữ liệu.
        </p>
      )}
    </section>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>

      <div className="mt-2 break-words text-base font-bold leading-6 text-slate-900 [overflow-wrap:anywhere]">
        {value}
      </div>
    </div>
  );
}

function ReviewButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone:
    | 'rose'
    | 'amber'
    | 'emerald'
    | 'sky';
  onClick: () => void;
}) {
  const styles = {
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    amber:
      'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    emerald:
      'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    sky: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
  };

  return (
    <Button
      variant="outline"
      className={cn(
        'bg-white font-bold',
        styles[tone],
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
