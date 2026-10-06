/**
 * Utility to construct full API endpoints supporting VITE_API_BASE_URL.
 * If VITE_API_BASE_URL is set (e.g. Render backend URL in production Vercel frontend),
 * it prefixes the path.
 * If not set (local dev / monolith), it returns the relative path (e.g. '/api/...').
 */
export const getApiUrl = (path: string): string => {
  const envBase =
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? (import.meta as any).env.VITE_API_BASE_URL
      : typeof process !== 'undefined' && process.env
      ? process.env.VITE_API_BASE_URL
      : '';

  const baseUrl = (envBase || '').replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
