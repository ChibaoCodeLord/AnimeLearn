import type { FlashcardItem } from './types';

export interface ParsedMeaning {
  heading: string;
  items: string[];
}

export const getItemMeaning = (item?: FlashcardItem | null) =>
  item?.meaning_vi || item?.mean || item?.meaning_en || 'Chưa có nghĩa';

export const parseMeaning = (value?: string): ParsedMeaning => {
  const normalized = (value || '').replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return { heading: '', items: [] };
  }

  const firstNumber = normalized.match(/\b1[.)]\s*/);

  if (firstNumber && firstNumber.index !== undefined) {
    const heading = normalized
      .slice(0, firstNumber.index)
      .trim()
      .replace(/[:;,.\-\s]+$/, '');

    const items = Array.from(
      normalized
        .slice(firstNumber.index)
        .matchAll(/(?:^|\s)(\d+)[.)]\s*(.*?)(?=\s+\d+[.)]\s*|$)/g),
    )
      .map((match) => match[2].trim())
      .filter(Boolean);

    return { heading, items: items.length ? items : [normalized] };
  }

  const semicolonParts = normalized
    .split(/[;；]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    heading: '',
    items: semicolonParts.length > 1 ? semicolonParts : [normalized],
  };
};

export const getTone = (item?: FlashcardItem | null) => {
  if (item?.item_type === 'kanji') {
    return {
      name: 'Kanji',
      strip: 'bg-rose-500',
      banner: 'bg-slate-950',
      chip: 'bg-rose-100 text-rose-700 ring-rose-200',
      soft: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-700',
      dot: 'bg-rose-500',
      action: 'bg-rose-600 hover:bg-rose-700',
    };
  }

  return {
    name: 'Từ vựng',
    strip: 'bg-indigo-500',
    banner: 'bg-slate-950',
    chip: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
    soft: 'bg-indigo-50',
    border: 'border-indigo-100',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
    action: 'bg-indigo-600 hover:bg-indigo-700',
  };
};
