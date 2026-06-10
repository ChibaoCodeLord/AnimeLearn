import { apiClient, withQuery } from './client';
import { ENDPOINTS } from './endpoints';
import type { ApiId, ApiMessageResponse, QueryParams, SaveVocabularyPayload } from './types';

export type LearningItemType = 'vocab' | 'kanji';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface FolderItem {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  itemCount?: number;
  createdAt?: string;
}

export interface SavedLearningItem {
  _id: string;
  id?: string;
  folderId?: string | FolderItem | null;
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
  img?: string;
  example_sentence?: string;
  example_meaning?: string;
  next_review_date?: string;
  review_interval?: number;
  ease_factor?: number;
  review_count?: number;
  saved_at?: string;
}

export interface DictionaryLibraryItem {
  _id: string;
  word: string;
  reading?: string;
  pos?: string;
  meanings?: string[];
  popularity_score?: number;
}

export interface KanjiLibraryItem {
  _id: string;
  kanji: string;
  mean?: string;
  kun?: string;
  on?: string;
  level?: number;
  stroke_count?: number;
  detail?: string;
  examples?: Array<Record<string, unknown>>;
  img?: string;
  freq?: number;
}

export interface SaveLearningItemPayload {
  item_type: LearningItemType;
  itemId?: string;
  word?: string;
  folderId: string;
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
}

const normalizeSavedItems = (response: PaginatedResponse<SavedLearningItem>) => ({
  ...response,
  items: response.items.map((item) => ({ ...item, id: item._id || item.id })),
});

export const vocabularyApi = {
  saveWord: <T = ApiMessageResponse>(payload: SaveVocabularyPayload) =>
    apiClient.post<T>(ENDPOINTS.video.saveWord, payload, { credentials: 'omit' }),

  getVocabulary: async <T = PaginatedResponse<SavedLearningItem>>(params?: QueryParams) => {
    const data = await apiClient.get<PaginatedResponse<SavedLearningItem>>(
      withQuery(ENDPOINTS.vocabulary.list, params),
    );
    return normalizeSavedItems(data) as T;
  },

  deleteWord: <T = ApiMessageResponse>(id: ApiId) =>
    apiClient.delete<T>(ENDPOINTS.vocabulary.item(id)),

  updateWord: <T = SavedLearningItem>(id: ApiId, payload: Record<string, unknown>) =>
    apiClient.patch<T>(ENDPOINTS.vocabulary.item(id), payload),

  getFolders: <T = FolderItem[]>() =>
    apiClient.get<T>(ENDPOINTS.vocabulary.folders),

  createFolder: <T = FolderItem>(payload: { name: string; description?: string; color?: string }) =>
    apiClient.post<T>(ENDPOINTS.vocabulary.folders, payload),

  updateFolder: <T = FolderItem>(id: ApiId, payload: { name?: string; description?: string; color?: string }) =>
    apiClient.patch<T>(ENDPOINTS.vocabulary.folder(id), payload),

  deleteFolder: <T = ApiMessageResponse>(id: ApiId) =>
    apiClient.delete<T>(ENDPOINTS.vocabulary.folder(id)),

  saveLearningItem: <T = ApiMessageResponse>(payload: SaveLearningItemPayload) =>
    apiClient.post<T>(ENDPOINTS.vocabulary.save, payload),

  getPopularDictionary: <T = PaginatedResponse<DictionaryLibraryItem>>(params?: QueryParams) =>
    apiClient.get<T>(withQuery(ENDPOINTS.vocabulary.discoverDictionary, params)),

  getDiscoverKanji: <T = PaginatedResponse<KanjiLibraryItem>>(params?: QueryParams) =>
    apiClient.get<T>(withQuery(ENDPOINTS.vocabulary.discoverKanji, params)),
};
