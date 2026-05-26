import { apiClient, buildApiUrl } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  ApiMessageResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  TrackSessionPayload,
} from './types';

export const authApi = {
  login: <T = ApiMessageResponse>(payload: LoginPayload) =>
    apiClient.post<T>(ENDPOINTS.auth.login, payload),

  register: <T = ApiMessageResponse>(payload: RegisterPayload) =>
    apiClient.post<T>(ENDPOINTS.auth.register, payload),

  signup: <T = ApiMessageResponse>(payload: RegisterPayload) =>
    apiClient.post<T>(ENDPOINTS.auth.signup, payload),

  getMe: <T = AuthUser>() => apiClient.get<T>(ENDPOINTS.auth.me),

  logout: <T = ApiMessageResponse>() => apiClient.post<T>(ENDPOINTS.auth.logout),

  updateProfile: <T = AuthUser>(payload: Partial<AuthUser> | FormData) =>
    apiClient.put<T>(ENDPOINTS.auth.updateProfile, payload),

  changePassword: <T = ApiMessageResponse>(payload: {
    currentPassword: string;
    newPassword: string;
  }) => apiClient.put<T>(ENDPOINTS.auth.changePassword, payload),

  getLearningProgress: <T = unknown>(period = 'week') =>
    apiClient.get<T>(`${ENDPOINTS.auth.learningProgress}?period=${encodeURIComponent(period)}`),

  getAchievements: <T = unknown>() => apiClient.get<T>(ENDPOINTS.auth.achievements),

  getProfileStats: <T = unknown>() => apiClient.get<T>(ENDPOINTS.auth.profileStats),

  updateLearningActivity: <T = ApiMessageResponse>(payload: Record<string, unknown>) =>
    apiClient.post<T>(ENDPOINTS.auth.updateLearningActivity, payload),

  unlockAchievement: <T = ApiMessageResponse>(achievementId: string) =>
    apiClient.post<T>(ENDPOINTS.auth.unlockAchievement, { achievementId }),

  trackSession: <T = ApiMessageResponse>(payload: TrackSessionPayload) =>
    apiClient.post<T>(ENDPOINTS.auth.trackSession, payload, { keepalive: true }),

  trackSessionBeacon: (payload: TrackSessionPayload) => {
    if (typeof navigator === 'undefined') return false;
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    return navigator.sendBeacon(buildApiUrl(ENDPOINTS.auth.trackSession), blob);
  },
};
