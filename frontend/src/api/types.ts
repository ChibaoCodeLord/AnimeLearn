export type ApiId = string | number;

export type QueryValue = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryValue>;

export interface ApiMessageResponse {
  success?: boolean;
  message?: string;
  error?: string;
  details?: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  jlptLevel?: string;
  profilePicture?: string | null;
  bio?: string;
  phone?: string;
  location?: string;
  role?: 'user' | 'admin' | string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  fullName: string;
}

export interface TrackSessionPayload {
  durationSeconds: number;
  page: string;
}

export interface VideoStatusPayload {
  status: 'approved' | 'rejected' | 'pending';
  reason?: string;
}

export interface SaveVocabularyPayload {
  word: string;
  reading?: string;
  meaning_vi?: string;
  meaning_en?: string;
  part_of_speech?: string;
  jlpt_level?: string;
  example_sentence?: string;
  example_meaning?: string;
  kanji_info?: unknown[];
  [key: string]: unknown;
}
