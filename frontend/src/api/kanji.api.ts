import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';

export const kanjiApi = {
  lookupKanji: <T = unknown>(characters: string[]) =>
    apiClient.post<T>(ENDPOINTS.kanji.lookup, { characters }),

  getKanjiInfo: <T = unknown>(character: string) =>
    apiClient.get<T>(ENDPOINTS.kanji.detail(character)),
};
