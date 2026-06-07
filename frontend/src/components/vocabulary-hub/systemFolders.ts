import type { HubFolder } from './types';

export const VOCAB_RANGES = ['1-2000', '2000-4000', '4000-6000', '6000-8000', '8000-10000'];
export const KANJI_FREQ_RANGES = ['1-500', '500-1000', '1000-1500', '1500-2000'];
export const JLPT_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const vocabularySystemFolders: HubFolder[] = VOCAB_RANGES.map((range, index) => ({
  id: `system-vocab-${range}`,
  kind: 'system-vocab',
  title: `Top ${range} Từ vựng`,
  subtitle: 'Kotoba ranking',
  marker: ['語', '言', '読', '話', '文'][index] || '語',
  color: ['sakura', 'matcha', 'sora', 'sumire', 'mikan'][index] as HubFolder['color'],
  range,
  description: 'Các mục từ trong Dictionary được xếp theo popularity score.',
}));

export const kanjiJlptSystemFolders: HubFolder[] = JLPT_LEVELS.map((level, index) => ({
  id: `system-kanji-${level}`,
  kind: 'system-kanji-jlpt',
  title: `${level} Kanji`,
  subtitle: 'JLPT path',
  marker: ['五', '四', '三', '二', '一'][index] || '字',
  color: ['matcha', 'sora', 'sumire', 'mikan', 'sakura'][index] as HubFolder['color'],
  level,
  description: `Bộ chữ Hán theo cấp độ ${level}.`,
}));

export const kanjiFreqSystemFolders: HubFolder[] = KANJI_FREQ_RANGES.map((range, index) => ({
  id: `system-kanji-freq-${range}`,
  kind: 'system-kanji-freq',
  title: `Kanji Rank ${range}`,
  subtitle: 'Frequency map',
  marker: ['光', '風', '水', '月'][index] || '字',
  color: ['slate', 'sora', 'matcha', 'sumire'][index] as HubFolder['color'],
  range,
  description: 'Kanji hệ thống được xếp theo tần suất xuất hiện.',
}));
