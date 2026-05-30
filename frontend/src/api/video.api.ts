import { apiClient, withQuery } from './client';
import { ENDPOINTS } from './endpoints';
import type { ApiId, ApiMessageResponse, QueryParams, SaveVocabularyPayload } from './types';

export const videoApi = {
  analyzeVideo: <T = unknown>(payload: { url: string }) =>
    apiClient.post<T>(ENDPOINTS.video.analyze, payload, { credentials: 'omit' }),

  translateWord: <T = unknown>(word: string) =>
    apiClient.post<T>(ENDPOINTS.video.translateWord, { word }),

  saveWord: <T = ApiMessageResponse>(payload: SaveVocabularyPayload) =>
    apiClient.post<T>(ENDPOINTS.video.saveWord, payload, { credentials: 'omit' }),

  saveVideo: <T = ApiMessageResponse>(payload: Record<string, unknown>) =>
    apiClient.post<T>(ENDPOINTS.video.save, payload, { credentials: 'omit' }),

  getVideoById: <T = unknown>(id: ApiId) => apiClient.get<T>(ENDPOINTS.video.detail(id)),

  getVideoDetail: <T = unknown>(id: ApiId) => apiClient.get<T>(ENDPOINTS.video.detail(id)),

  countView: <T = ApiMessageResponse>(id: ApiId) => apiClient.post<T>(ENDPOINTS.video.view(id)),

  markWatched: <T = ApiMessageResponse>(id: ApiId, payload?: { progress_seconds?: number }) =>
    apiClient.post<T>(ENDPOINTS.video.markWatched(id), payload ?? {}),

  getWatchedVideos: <T = unknown>(params?: QueryParams) =>
    apiClient.get<T>(withQuery(ENDPOINTS.video.watched, params)),

  likeVideo: <T = ApiMessageResponse>(id: ApiId) => apiClient.post<T>(ENDPOINTS.video.like(id)),

  unlikeVideo: <T = ApiMessageResponse>(id: ApiId) =>
    apiClient.post<T>(ENDPOINTS.video.unlike(id)),

  getComments: <T = unknown>(id: ApiId) =>
    apiClient.get<T>(ENDPOINTS.video.comments(id)),

  createComment: <T = unknown>(
    id: ApiId,
    payload: { content: string; parentComment?: ApiId | null },
  ) => apiClient.post<T>(ENDPOINTS.video.comments(id), payload),

  toggleCommentLike: <T = unknown>(id: ApiId) =>
    apiClient.post<T>(ENDPOINTS.video.commentLike(id)),

  updateComment: <T = unknown>(id: ApiId, payload: { content: string }) =>
    apiClient.patch<T>(ENDPOINTS.video.comment(id), payload),

  deleteComment: <T = ApiMessageResponse>(id: ApiId) =>
    apiClient.delete<T>(ENDPOINTS.video.comment(id)),

  getUserVideos: <T = unknown>(params?: QueryParams) =>
    apiClient.get<T>(withQuery(ENDPOINTS.video.userVideos, params)),

  updateVideo: <T = ApiMessageResponse>(id: ApiId, payload: Record<string, unknown>) =>
    apiClient.put<T>(ENDPOINTS.video.update(id), payload),

  deleteVideo: <T = ApiMessageResponse>(id: ApiId) =>
    apiClient.delete<T>(ENDPOINTS.video.delete(id)),

  getVideoVocabulary: <T = unknown>(id: ApiId) =>
    apiClient.get<T>(ENDPOINTS.video.vocabulary(id)),

  getPublicVideos: <T = unknown>(params?: QueryParams) =>
    apiClient.get<T>(withQuery(ENDPOINTS.video.publicVideos, params)),

  createFuriganaLine: <T = { html: string }>(text: string) =>
    apiClient.post<T>(ENDPOINTS.video.furiganaLine, { text }),
};
