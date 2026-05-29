import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type { ApiId } from './types';

export const chatApi = {
  indexVideo: <T = unknown>(videoId: ApiId) =>
    apiClient.post<T>(ENDPOINTS.chat.indexVideo(videoId)),

  sendMessage: <T = unknown>(
    videoId: ApiId,
    payload: { question: string; history?: Array<{ question: string; answer: string }> },
  ) => apiClient.post<T>(ENDPOINTS.chat.askVideo(videoId), payload),

  askVideo: <T = unknown>(
    videoId: ApiId,
    payload: { question: string; history?: Array<{ question: string; answer: string }> },
  ) => apiClient.post<T>(ENDPOINTS.chat.askVideo(videoId), payload),

  getHistory: <T = unknown[]>(videoId: ApiId) =>
    apiClient.get<T>(ENDPOINTS.chat.history(videoId)),
};
