import { ENV } from '@/config/env';
import type { QueryParams } from './types';

export type ApiRequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  skipAuth?: boolean;
};

export class ApiError<TData = unknown> extends Error {
  status: number;
  data: TData | undefined;

  constructor(message: string, status: number, data?: TData) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const isFormDataBody = (body: unknown): body is FormData =>
  typeof FormData !== 'undefined' && body instanceof FormData;

const isJsonBody = (body: unknown) =>
  body !== undefined &&
  body !== null &&
  !isFormDataBody(body) &&
  !(typeof Blob !== 'undefined' && body instanceof Blob) &&
  !(typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) &&
  !(typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) &&
  typeof body !== 'string';

const readToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('token');
};

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export const buildApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${ENV.API_BASE_URL}${normalizePath(path)}`;
};

export const withQuery = (path: string, params?: QueryParams) => {
  if (!params) return path;

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
};

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(
  path: string,
  method: string,
  body?: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const requestOptions: RequestInit = {
    ...options,
    method,
    headers,
    credentials: options.credentials ?? 'include',
  };

  if (!options.skipAuth && !headers.has('Authorization')) {
    const token = readToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  if (body !== undefined) {
    if (isFormDataBody(body)) {
      requestOptions.body = body;
    } else if (isJsonBody(body)) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      requestOptions.body = JSON.stringify(body);
    } else {
      requestOptions.body = body as BodyInit;
    }
  }

  const response = await fetch(buildApiUrl(path), requestOptions);
  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null
        ? String(
            (data as { error?: unknown; message?: unknown; details?: unknown }).error ||
              (data as { error?: unknown; message?: unknown; details?: unknown }).message ||
              (data as { error?: unknown; message?: unknown; details?: unknown }).details ||
              `API request failed with status ${response.status}`,
          )
        : `API request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, 'GET', undefined, options),

  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, 'POST', body, options),

  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, 'PUT', body, options),

  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, 'PATCH', body, options),

  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, 'DELETE', undefined, options),

  upload: <T>(path: string, formData: FormData, options?: ApiRequestOptions) =>
    request<T>(path, 'POST', formData, options),
};
