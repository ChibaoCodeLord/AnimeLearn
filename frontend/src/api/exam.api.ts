import { apiClient, withQuery } from './client';
import { ENDPOINTS } from './endpoints';
import type { ApiId, QueryParams } from './types';

export type ExamLevel = 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
export type ExamSectionType = 'vocabulary_grammar' | 'reading' | 'listening';
export type ExamStatus = 'draft' | 'published' | 'archived';

export interface ExamOption {
  id?: string;
  label: string;
  text: string;
  imageUrl?: string;
}

export interface ExamQuestion {
  id?: string;
  order: number;
  type: string;
  questionText: string;
  stemText?: string;
  questionImageUrl?: string;
  audioUrl?: string;
  options: ExamOption[];
  correctOptionIndex?: number | null;
  answerSource?: 'ai_inferred' | 'source_marked' | 'admin' | 'unknown';
  answerConfidence?: number | null;
  explanation?: string;
  points?: number;
  aiNotes?: string;
}

export interface ExamQuestionGroup {
  id?: string;
  order: number;
  mondaiNumber: number;
  title: string;
  instruction?: string;
  passageText?: string;
  attachmentImageUrl?: string;
  audioUrl?: string;
  audioStartSeconds?: number | null;
  audioEndSeconds?: number | null;
  sourceFileUrl?: string;
  sourceFileName?: string;
  questions: ExamQuestion[];
}

export interface ExamSection {
  id?: string;
  type: ExamSectionType;
  title: string;
  durationMinutes: number;
  order: number;
  groups: ExamQuestionGroup[];
}

export interface ExamPaper {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  level: ExamLevel;
  year: number;
  month: number;
  source?: string;
  status: ExamStatus;
  sections: ExamSection[];
  totalQuestions: number;
  totalDurationMinutes: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
}

export interface ExamListResponse {
  exams: ExamPaper[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ExamImportPreviewResponse {
  sectionType: ExamSectionType;
  sectionTitle?: string;
  groups: ExamQuestionGroup[];
  group: ExamQuestionGroup | null;
  file: {
    name: string;
    mimeType: string;
    size: number;
  };
  audioFile?: {
    name: string;
    mimeType: string;
    size: number;
  } | null;
}

export interface SaveExamGroupPayload {
  sectionType: ExamSectionType;
  group: ExamQuestionGroup;
  mode?: 'append' | 'replace';
}

export interface SaveExamSectionPayload {
  sectionType: ExamSectionType;
  groups: ExamQuestionGroup[];
  mode?: 'append' | 'replace';
}

export const examApi = {
  list: <T = ExamListResponse>(params?: QueryParams) =>
    apiClient.get<T>(withQuery(ENDPOINTS.exam.list, params)),

  detail: <T = ExamPaper>(id: ApiId) =>
    apiClient.get<T>(ENDPOINTS.exam.detail(id)),

  adminList: <T = ExamListResponse>(params?: QueryParams) =>
    apiClient.get<T>(withQuery(ENDPOINTS.exam.adminList, params)),

  adminCreate: <T = ExamPaper>(payload: Partial<ExamPaper>) =>
    apiClient.post<T>(ENDPOINTS.exam.adminCreate, payload),

  adminUpdate: <T = ExamPaper>(id: ApiId, payload: Partial<ExamPaper>) =>
    apiClient.patch<T>(ENDPOINTS.exam.adminUpdate(id), payload),

  adminDelete: <T = { success: boolean; message: string; id: string }>(id: ApiId) =>
    apiClient.delete<T>(ENDPOINTS.exam.adminDelete(id)),

  adminStatus: <T = ExamPaper>(id: ApiId, status: ExamStatus) =>
    apiClient.patch<T>(ENDPOINTS.exam.adminStatus(id), { status }),

  importPreview: <T = ExamImportPreviewResponse>(formData: FormData) =>
    apiClient.upload<T>(ENDPOINTS.exam.importPreview, formData),

  saveGroup: <T = { exam: ExamPaper; group: ExamQuestionGroup }>(
    id: ApiId,
    payload: SaveExamGroupPayload,
  ) => apiClient.post<T>(ENDPOINTS.exam.saveGroup(id), payload),

  saveSection: <T = { exam: ExamPaper; groups: ExamQuestionGroup[] }>(
    id: ApiId,
    payload: SaveExamSectionPayload,
  ) => apiClient.post<T>(ENDPOINTS.exam.saveSection(id), payload),

  importAndSave: <T = { exam: ExamPaper; group: ExamQuestionGroup }>(
    id: ApiId,
    formData: FormData,
  ) => apiClient.upload<T>(ENDPOINTS.exam.importAndSave(id), formData),

  uploadMedia: <T = { url: string; publicId: string; resourceType: string }>(formData: FormData) =>
    apiClient.upload<T>(ENDPOINTS.exam.uploadMedia, formData),
};
