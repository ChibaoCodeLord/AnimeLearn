import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FlashcardItem } from './types';

interface VocabCardProps {
  item: FlashcardItem;
  readOnly?: boolean;
  onOpenDetails: (item: FlashcardItem) => void;
  onSave?: (item: FlashcardItem) => void;
  onDelete?: (id: string) => void;
}

const getAccent = (item: FlashcardItem) => {
  if (item.item_type === 'kanji') {
    return {
      bar: 'bg-rose-400',
      soft: 'bg-rose-50',
      text: 'text-rose-700',
      icon: 'text-rose-200',
      divider: 'bg-rose-100',
      ring: 'hover:border-rose-200 hover:bg-rose-50/30',
      mark: '字',
      label: 'Kanji',
    };
  }

  return {
    bar: 'bg-indigo-400',
    soft: 'bg-indigo-50',
    text: 'text-indigo-700',
    icon: 'text-indigo-200',
    divider: 'bg-indigo-100',
    ring: 'hover:border-indigo-200 hover:bg-indigo-50/30',
    mark: '語',
    label: 'Vocab',
  };
};

const getMeaning = (item: FlashcardItem): string => {
  if (Array.isArray(item.meaning_vi) && item.meaning_vi.length > 0) {
    return item.meaning_vi.join(' · ');
  }

  if (Array.isArray(item.meaning_vi) && item.meaning_vi.length > 0) {
    return item.meaning_vi.join(' · ');
  }

  if (typeof item.meaning_vi === 'string' && item.meaning_vi.trim()) {
    return item.meaning_vi;
  }

  if (typeof item.mean === 'string' && item.mean.trim()) {
    return item.mean;
  }

  return 'Chưa có nghĩa';
};

export function VocabCard({
  item,
  readOnly,
  onOpenDetails,
  onSave,
  onDelete,
}: VocabCardProps) {
  const isKanji = item.item_type === 'kanji';
  const accent = getAccent(item);
  const meaning = getMeaning(item);

  const wordLength = item.word?.length || 0;

  const wordSize = isKanji
    ? 'text-[clamp(3.5rem,6vw,2.8rem)]'
    : wordLength > 30
      ? 'text-[clamp(1.15rem,3vw,1.65rem)]'
      : wordLength > 16
        ? 'text-[clamp(1.35rem,3.5vw,1.9rem)]'
        : 'text-[clamp(1.7rem,4vw,2.4rem)]';

  const handleOpenDetails = () => {
    onOpenDetails(item);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenDetails(item);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleOpenDetails}
      onKeyDown={handleKeyDown}
      className={cn(
        `
          group
          relative
          flex
          h-full
          min-h-[280px]
          min-w-0
          cursor-pointer
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
          transition-all
          duration-200
          hover:shadow-md
          focus-visible:outline-none
          focus-visible:ring-4
          focus-visible:ring-slate-200
        `,
        accent.ring,
      )}
    >
      {/* Thanh màu phía trên */}
      <div
        className={cn(
          'h-1.5 w-full shrink-0',
          accent.bar,
        )}
      />

      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge
            className={cn(
              'border-0 font-bold ring-1 ring-inset',
              accent.soft,
              accent.text,
            )}
          >
            {accent.label}
          </Badge>

          {item.jlpt_level && (
            <Badge
              variant="outline"
              className="shrink-0 bg-white font-bold text-slate-600"
            >
              {item.jlpt_level}
            </Badge>
          )}
        </div>

        {/* Ký hiệu nằm trong layout, không dùng absolute */}
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 select-none text-3xl font-black leading-none',
            accent.icon,
          )}
        >
          {accent.mark}
        </span>
      </div>

      {/* Nội dung chính */}
      <div className="flex min-h-0 flex-1 flex-col px-4 py-5">
        {/* Từ vựng/Kanji */}
        <div
          className="custom-scrollbar w-full min-w-0 max-w-full shrink-0 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <h2
            className={cn(
              `
                min-w-full
                whitespace-nowrap
                px-2
                py-3
                text-center
                font-black
                text-slate-950
              `,
              wordSize,
            )}
          >
            {item.word}
          </h2>
        </div>

        {/* Cách đọc của từ vựng */}
        {!isKanji && item.reading && (
          <div className="flex min-w-0 items-center justify-center">
            <div
              className="custom-scrollbar min-w-0 max-w-full overflow-x-auto overflow-y-hidden"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <p className="w-max whitespace-nowrap text-xl tracking-wide text-teal-700">
                【{item.reading}】
              </p>
            </div>
          </div>
        )}

        {/* Âm đọc Kanji */}
        {isKanji && (
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div className="min-w-0">
              <div className="text-center text-[12px] font-black uppercase tracking-[0.16em] text-rose-400">
                Âm On
              </div>

              <p className="mt-1 break-words text-center text-sm font-bold leading-5 text-slate-700 [overflow-wrap:anywhere]">
                {item.on || '—'}
              </p>
            </div>

            <div className="min-w-0 border-t border-slate-100 pt-2 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
              <div className="text-center text-[12px] font-black uppercase tracking-[0.16em] text-rose-400">
                Âm Kun
              </div>

              <p className="mt-1 break-words text-center text-sm font-bold leading-5 text-slate-700 [overflow-wrap:anywhere]">
                {item.kun || '—'}
              </p>
            </div>
          </div>
        )}

        {/* Đường phân cách */}
        <div
          className={cn(
            'mx-auto my-4 h-px w-12 shrink-0',
            accent.divider,
          )}
        />

        <div className="custom-scrollbar max-h-20 min-h-0 w-full overflow-y-auto overscroll-contain">
          <p className="break-words px-2 py-3 text-center text-2xl leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
            {meaning}
          </p>
        </div>
      </div>

      {/* Footer cố định */}
      <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
        <div className="flex items-center justify-center">
          {readOnly ? (
            <Button
              type="button"
              size="sm"
              className="bg-slate-900 px-5 font-bold text-white hover:bg-slate-800"
              onClick={(event) => {
                event.stopPropagation();
                onSave?.(item);
              }}
            >
              Lưu thẻ
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="px-5 font-bold"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(item.id);
              }}
            >
              Xóa
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}