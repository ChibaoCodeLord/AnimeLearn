import { apiClient, withQuery } from './client';
import { ENDPOINTS } from './endpoints';
import type { ApiId, ApiMessageResponse, QueryParams, VideoStatusPayload } from './types';

export const adminApi = {
  getStats: <T = unknown>() => apiClient.get<T>(ENDPOINTS.admin.stats),

  getVideos: <T = unknown>(params?: QueryParams) =>
    apiClient.get<T>(withQuery(ENDPOINTS.admin.videos, params)),

  deleteVideo: <T = ApiMessageResponse>(id: ApiId) =>
    apiClient.delete<T>(ENDPOINTS.admin.video(id)),

  updateVideoStatus: <T = ApiMessageResponse>(id: ApiId, payload: VideoStatusPayload) =>
    apiClient.patch<T>(ENDPOINTS.admin.videoStatus(id), payload),

  getUsers: <T = unknown>(params?: QueryParams) =>
    apiClient.get<T>(withQuery(ENDPOINTS.admin.users, params)),

  getUser: <T = unknown>(id: ApiId) => apiClient.get<T>(ENDPOINTS.admin.user(id)),

  updateUserRole: <T = ApiMessageResponse>(id: ApiId, role: string) =>
    apiClient.patch<T>(ENDPOINTS.admin.userRole(id), { role }),

  banUser: <T = ApiMessageResponse>(
    id: ApiId,
    payload: { banReason: string; unbannedAt?: string | null },
  ) => apiClient.patch<T>(ENDPOINTS.admin.banUser(id), payload),

  unbanUser: <T = ApiMessageResponse>(id: ApiId) =>
    apiClient.patch<T>(ENDPOINTS.admin.unbanUser(id)),
};
