import type { DictionaryLibraryItem, FlashcardItem, KanjiLibraryItem, SavedLearningItem } from './types';

export const MASTERED_INTERVAL_DAYS = 13;

export const getItemId = (item: { _id?: string; id?: string }) => item._id || item.id || '';

export const getFolderName = (folderId: SavedLearningItem['folderId']) => {
  if (!folderId || typeof folderId === 'string') return '';
  return folderId.name;
};

export const savedToFlashcard = (item: SavedLearningItem): FlashcardItem => ({
  id: getItemId(item),
  item_type: item.item_type || 'vocab',
  word: item.word,
  reading: item.reading,
  meaning_vi: item.meaning_vi || item.mean,
  meaning_en: item.meaning_en,
  part_of_speech: item.part_of_speech,
  jlpt_level: item.jlpt_level,
  popularity_score: item.popularity_score,
  on: item.on,
  kun: item.kun,
  mean: item.mean,
  stroke_count: item.stroke_count,
  freq: item.freq,
  detail: item.detail,
  example_sentence: item.example_sentence,
  example_meaning: item.example_meaning,
  next_review_date: item.next_review_date,
  review_interval: item.review_interval,
  ease_factor: item.ease_factor,
  review_count: item.review_count,
  folderName: getFolderName(item.folderId),
});

export const dictionaryToFlashcard = (item: DictionaryLibraryItem): FlashcardItem => ({
  id: item._id,
  item_type: 'vocab',
  word: item.word,
  reading: item.reading,
  meaning_vi: item.meanings?.[0] || '',
  part_of_speech: item.pos,
  popularity_score: item.popularity_score,
});

export const kanjiToFlashcard = (item: KanjiLibraryItem): FlashcardItem => ({
  id: item._id,
  item_type: 'kanji',
  word: item.kanji,
  meaning_vi: item.mean,
  mean: item.mean,
  on: item.on,
  kun: item.kun,
  jlpt_level: item.level ? `N${item.level}` : undefined,
  stroke_count: item.stroke_count,
  freq: item.freq,
  detail: item.detail,
});

export const calculateNextReview = (quality: number, easeFactor = 2.5, interval = 1) => {
  let newEase = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEase = Math.max(1.3, newEase);

  let newInterval = 1;
  if (quality < 2) newInterval = 1;
  if (quality === 2) newInterval = Math.max(1, Math.round(interval * 1.2));
  if (quality === 3) newInterval = Math.max(1, Math.round(interval * newEase));
  if (quality === 4) newInterval = Math.max(1, Math.round(interval * newEase * 1.3));

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newInterval);

  return {
    ease_factor: newEase,
    review_interval: newInterval,
    next_review_date: nextDate.toISOString(),
  };
};
