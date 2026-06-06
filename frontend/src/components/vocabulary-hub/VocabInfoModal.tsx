import { BookmarkPlus, Hash, Languages, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getItemMeaning, getTone, parseMeaning } from './display';
import type { FlashcardItem } from './types';

interface VocabInfoModalProps {
  item: FlashcardItem | null;
  readOnly?: boolean;
  onClose: () => void;
  onSave?: (item: FlashcardItem) => void;
  onDelete?: (id: string) => void;
}

export function VocabInfoModal({ item, readOnly, onClose, onSave, onDelete }: VocabInfoModalProps) {
  if (!item) return null;

  const isKanji = item.item_type === 'kanji';
  const tone = getTone(item);
  const primaryMeaning = parseMeaning(getItemMeaning(item));
  const englishMeaning = parseMeaning(item.meaning_en);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-3 py-4 backdrop-blur-sm sm:px-5"
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl  overscroll-contain"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={cn('h-1.5 shrink-0', tone.strip)} />

        <header className="shrink-0 bg-slate-950 px-5 py-5 text-white sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('border-0 ring-1', tone.chip)}>{tone.name}</Badge>
                {item.jlpt_level && <Badge className="border-white/20 bg-white/10 text-white">{item.jlpt_level}</Badge>}
                {item.popularity_score && <Badge className="border-white/20 bg-white/10 text-white">Rank {item.popularity_score}</Badge>}
                {item.freq && <Badge className="border-white/20 bg-white/10 text-white">Freq {item.freq}</Badge>}
              </div>

              <div className="mt-4 pr-2">
                <h2 className="custom-scrollbar whitespace-nowrap overflow-x-auto overflow-y-hidden pb-4 text-[clamp(2.4rem,8vw,5.8rem)] font-black leading-none tracking-tight">
                  {item.word}
                </h2>
              </div>

              {item.reading && (
                <p className="mt-3 break-words text-[clamp(1rem,3vw,1.6rem)] font-semibold leading-tight text-teal-200 [overflow-wrap:anywhere]">
                  {item.reading}
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-10 w-10 shrink-0 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50/70 px-5 py-5 sm:px-7">
          {primaryMeaning.heading && (
            <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Hán Việt / Ghi chú đầu mục</div>
              <p className="mt-2 break-words text-2xl font-black uppercase tracking-wide text-slate-900 [overflow-wrap:anywhere]">
                {primaryMeaning.heading}
              </p>
            </section>
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
            <div className="space-y-4">
              <MeaningSection title="Ý nghĩa" items={primaryMeaning.items} tone={tone.text} />

              {englishMeaning.items.length > 0 && (
                <MeaningSection title="English" items={englishMeaning.items} tone="text-sky-700" subtle />
              )}

              {item.example_sentence && (
                <InfoSection title="Ví dụ" accent="emerald">
                  <p className="break-words text-lg font-bold leading-8 text-slate-900 [overflow-wrap:anywhere]">
                    {item.example_sentence}
                  </p>
                  {item.example_meaning && (
                    <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-600 [overflow-wrap:anywhere]">
                      {item.example_meaning}
                    </p>
                  )}
                </InfoSection>
              )}

              {item.detail && (
                <InfoSection title="Chi tiết" accent="slate">
                  <p className="whitespace-pre-wrap break-words text-sm font-medium leading-7 text-slate-700 [overflow-wrap:anywhere]">
                    {item.detail}
                  </p>
                </InfoSection>
              )}
            </div>

            <aside className="space-y-4">
              {!isKanji && item.part_of_speech && (
                <InfoSection title="Từ loại" accent="indigo">
                  <Badge className="border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
                    {item.part_of_speech}
                  </Badge>
                </InfoSection>
              )}

              {isKanji ? (
                <>
                  <InfoSection title="Âm đọc" accent="rose">
                    <div className="grid gap-3">
                      <FactRow label="Onyomi" value={item.on || '-'} icon={<Languages className="h-4 w-4" />} />
                      <FactRow label="Kunyomi" value={item.kun || '-'} icon={<Languages className="h-4 w-4" />} />
                    </div>
                  </InfoSection>

                  <InfoSection title="Thông số" accent="amber">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                      <FactRow label="Số nét" value={item.stroke_count ? String(item.stroke_count) : '-'} icon={<Hash className="h-4 w-4" />} />
                      <FactRow label="Tần suất" value={item.freq ? String(item.freq) : '-'} icon={<Hash className="h-4 w-4" />} />
                    </div>
                  </InfoSection>
                </>
              ) : (
                <InfoSection title="Thông tin học" accent="teal">
                  <div className="grid gap-3">
                    <FactRow label="Độ phổ biến" value={item.popularity_score ? `Rank ${item.popularity_score}` : '-'} />
                    <FactRow label="JLPT" value={item.jlpt_level || '-'} />
                    <FactRow label="Lần ôn" value={item.review_count ? String(item.review_count) : '0'} />
                  </div>
                </InfoSection>
              )}
            </aside>
          </div>
        </main>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
          {readOnly ? (
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => onSave?.(item)}>
              <BookmarkPlus className="mr-2 h-4 w-4" />
              Lưu thẻ này
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => onDelete?.(item.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa thẻ
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

function MeaningSection({ title, items, tone, subtle }: { title: string; items: string[]; tone: string; subtle?: boolean }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{title}</h3>

      {items.length ? (
        <ol className="space-y-3">
          {items.map((meaning, index) => (
            <li key={`${meaning}-${index}`} className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
              <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black', subtle ? 'bg-sky-100 text-sky-700' : 'bg-slate-900 text-white')}>
                {index + 1}
              </span>
              <p className={cn('min-w-0 flex-1 break-words text-base font-semibold leading-7 text-slate-800 [overflow-wrap:anywhere]', tone)}>
                {meaning.includes(':') ? (
                  <>
                    <span className="font-black text-slate-950">{meaning.slice(0, meaning.indexOf(':')).trim()}</span>
                    <span className="mx-2 text-slate-300">-</span>
                    <span>{meaning.slice(meaning.indexOf(':') + 1).trim()}</span>
                  </>
                ) : (
                  meaning
                )}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-500">
          Chưa có dữ liệu.
        </p>
      )}
    </section>
  );
}

function InfoSection({ title, accent, children }: { title: string; accent: 'rose' | 'emerald' | 'indigo' | 'amber' | 'teal' | 'slate'; children: ReactNode }) {
  const accents = {
    rose: 'border-rose-100 bg-rose-50/50 text-rose-700',
    emerald: 'border-emerald-100 bg-emerald-50/60 text-emerald-700',
    indigo: 'border-indigo-100 bg-indigo-50/60 text-indigo-700',
    amber: 'border-amber-100 bg-amber-50/60 text-amber-700',
    teal: 'border-teal-100 bg-teal-50/60 text-teal-700',
    slate: 'border-slate-200 bg-white text-slate-600',
  };

  return (
    <section className={cn('rounded-2xl border p-4 shadow-sm', accents[accent])}>
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em]">{title}</h3>
      {children}
    </section>
  );
}

function FactRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/70 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-1 break-words text-base font-bold leading-6 text-slate-900 [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}
