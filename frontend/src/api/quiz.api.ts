import { ApiError, apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type { ApiId } from './types';

export const quizApi = {
  getQuizByVideoId: async <T = unknown>(videoId: ApiId) => {
    try {
      return await apiClient.get<T>(ENDPOINTS.quiz.getByVideoId(videoId));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  generateQuiz: <T = unknown>(videoId: ApiId, payload: { script: unknown[] }) =>
    apiClient.post<T>(ENDPOINTS.quiz.generate(videoId), payload),

  submitQuiz: <T = unknown>(videoId: ApiId, payload: Record<string, unknown>) =>
    apiClient.post<T>(`${ENDPOINTS.quiz.getByVideoId(videoId)}/submit`, payload),
};
