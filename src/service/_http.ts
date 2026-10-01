const API_URL = (import.meta.env.VITE_API_URL as string) || '';

export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}
