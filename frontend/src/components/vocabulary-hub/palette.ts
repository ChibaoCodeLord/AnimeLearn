import type { FolderTone } from './types';

export const FOLDER_TONES: Array<{ id: FolderTone; label: string }> = [
  { id: 'sakura', label: 'Sakura' },
  { id: 'matcha', label: 'Matcha' },
  { id: 'sora', label: 'Sora' },
  { id: 'sumire', label: 'Sumire' },
  { id: 'mikan', label: 'Mikan' },
  { id: 'slate', label: 'Ink' },
];

export const FOLDER_TONE_CLASSES: Record<FolderTone, {
  shell: string;
  cover: string;
  tab: string;
  glow: string;
  text: string;
  chip: string;
  border: string;
  button: string;
  swatch: string;
}> = {
  sakura: {
    shell: 'bg-rose-50',
    cover: 'from-rose-200 via-pink-100 to-white',
    tab: 'bg-rose-200',
    glow: 'hover:shadow-[0_24px_70px_rgba(251,113,133,0.28)]',
    text: 'text-rose-950',
    chip: 'bg-rose-100 text-rose-800',
    border: 'border-rose-200',
    button: 'bg-rose-500 text-white hover:bg-rose-600',
    swatch: 'bg-rose-300',
  },
  matcha: {
    shell: 'bg-emerald-50',
    cover: 'from-emerald-200 via-lime-100 to-white',
    tab: 'bg-emerald-200',
    glow: 'hover:shadow-[0_24px_70px_rgba(16,185,129,0.26)]',
    text: 'text-emerald-950',
    chip: 'bg-emerald-100 text-emerald-800',
    border: 'border-emerald-200',
    button: 'bg-emerald-600 text-white hover:bg-emerald-700',
    swatch: 'bg-emerald-300',
  },
  sora: {
    shell: 'bg-sky-50',
    cover: 'from-sky-200 via-cyan-100 to-white',
    tab: 'bg-sky-200',
    glow: 'hover:shadow-[0_24px_70px_rgba(14,165,233,0.25)]',
    text: 'text-sky-950',
    chip: 'bg-sky-100 text-sky-800',
    border: 'border-sky-200',
    button: 'bg-sky-500 text-white hover:bg-sky-600',
    swatch: 'bg-sky-300',
  },
  sumire: {
    shell: 'bg-indigo-50',
    cover: 'from-indigo-200 via-violet-100 to-white',
    tab: 'bg-indigo-200',
    glow: 'hover:shadow-[0_24px_70px_rgba(99,102,241,0.28)]',
    text: 'text-indigo-950',
    chip: 'bg-indigo-100 text-indigo-800',
    border: 'border-indigo-200',
    button: 'bg-indigo-500 text-white hover:bg-indigo-600',
    swatch: 'bg-indigo-300',
  },
  mikan: {
    shell: 'bg-amber-50',
    cover: 'from-amber-200 via-orange-100 to-white',
    tab: 'bg-amber-200',
    glow: 'hover:shadow-[0_24px_70px_rgba(245,158,11,0.28)]',
    text: 'text-amber-950',
    chip: 'bg-amber-100 text-amber-800',
    border: 'border-amber-200',
    button: 'bg-amber-500 text-white hover:bg-amber-600',
    swatch: 'bg-amber-300',
  },
  slate: {
    shell: 'bg-slate-50',
    cover: 'from-slate-300 via-slate-100 to-white',
    tab: 'bg-slate-300',
    glow: 'hover:shadow-[0_24px_70px_rgba(71,85,105,0.22)]',
    text: 'text-slate-950',
    chip: 'bg-slate-100 text-slate-700',
    border: 'border-slate-200',
    button: 'bg-slate-900 text-white hover:bg-slate-800',
    swatch: 'bg-slate-400',
  },
};

export const getFolderTone = (tone?: string): FolderTone =>
  FOLDER_TONE_CLASSES[tone as FolderTone] ? (tone as FolderTone) : 'matcha';

export const getFolderToneClasses = (tone?: string) => FOLDER_TONE_CLASSES[getFolderTone(tone)];
