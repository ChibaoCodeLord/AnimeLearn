import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type { ApiId, ApiMessageResponse, SaveVocabularyPayload } from './types';

export const vocabularyApi = {
  saveWord: <T = ApiMessageResponse>(payload: SaveVocabularyPayload) =>
    apiClient.post<T>(ENDPOINTS.video.saveWord, payload, { credentials: 'omit' }),

  getVocabulary: async <T = Array<Record<string, unknown>>>() => {
    const data = await apiClient.get<Array<Record<string, unknown>>>(ENDPOINTS.vocabulary.list);
    return data.map((item) => ({ ...item, id: item._id || item.id })) as T;
  },

  deleteWord: <T = ApiMessageResponse>(id: ApiId) =>
    apiClient.delete<T>(ENDPOINTS.vocabulary.item(id)),

  updateWord: <T = ApiMessageResponse>(id: ApiId, payload: Record<string, unknown>) =>
    apiClient.patch<T>(ENDPOINTS.vocabulary.item(id), payload),
};
