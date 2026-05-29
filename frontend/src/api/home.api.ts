import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';

export const homeApi = {
  getUserProfile: <T = unknown>() => apiClient.get<T>(ENDPOINTS.home.userProfile),

  getHomeVideos: <T = unknown>() => apiClient.get<T>(ENDPOINTS.home.videos),

  getPopularVideos: <T = unknown>() => apiClient.get<T>(ENDPOINTS.home.videos),

  getRecentVideos: <T = unknown>() => apiClient.get<T>(ENDPOINTS.home.videos),
};
