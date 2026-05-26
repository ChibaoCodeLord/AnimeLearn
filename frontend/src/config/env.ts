const normalizeApiBaseUrl = (value: string) => value.replace(/\/+$/, '');

export const ENV = {
  API_BASE_URL: normalizeApiBaseUrl(
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  ),
};
