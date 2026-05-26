import { apiClient, withQuery } from './client';
import { ENDPOINTS } from './endpoints';
import type { ApiId, ApiMessageResponse } from './types';

export const dictionaryApi = {
  searchDictionary: <T = unknown>(params: { q: string; page?: number; limit?: number }) =>
    apiClient.get<T>(withQuery(ENDPOINTS.dictionary.search, params)),

  lookupWord: <T = unknown>(words: string[]) =>
    apiClient.post<T>(ENDPOINTS.dictionary.lookup, { words }),

  saveWordForUser: <T = ApiMessageResponse>(userId: ApiId, wordId: ApiId) =>
    apiClient.post<T>(ENDPOINTS.dictionary.saveWordForUser(userId, wordId), {}),
};
