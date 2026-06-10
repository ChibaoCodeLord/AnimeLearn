import type {
  DictionaryLibraryItem,
  FolderItem,
  KanjiLibraryItem,
  LearningItemType,
  PaginationMeta,
  SavedLearningItem,
} from '@/api/vocabulary.api';

export type FolderTone = 'sakura' | 'matcha' | 'sora' | 'sumire' | 'mikan' | 'slate';

export type HubFolderKind = 'user' | 'system-vocab' | 'system-kanji-jlpt' | 'system-kanji-freq';

export interface HubFolder {
  id: string;
  kind: HubFolderKind;
  title: string;
  subtitle: string;
  marker: string;
  color: FolderTone;
  count?: number;
  folderId?: string;
  range?: string;
  level?: string;
  description?: string;
}

export interface FlashcardItem {
  id: string;
  item_type: LearningItemType;
  word: string;
  reading?: string;
  meaning_vi?: string;
  meaning_en?: string;
  part_of_speech?: string;
  jlpt_level?: string;
  popularity_score?: number;
  on?: string;
  kun?: string;
  mean?: string;
  stroke_count?: number;
  freq?: number;
  detail?: string;
  example_sentence?: string;
  example_meaning?: string;
  next_review_date?: string;
  review_interval?: number;
  ease_factor?: number;
  review_count?: number;
  folderName?: string;
}

export interface FolderModalState {
  mode: 'create' | 'edit';
  folder?: FolderItem;
}

export interface FolderDetailData {
  items: FlashcardItem[];
  pagination: PaginationMeta;
}

export type {
  DictionaryLibraryItem,
  FolderItem,
  KanjiLibraryItem,
  PaginationMeta,
  SavedLearningItem,
};
