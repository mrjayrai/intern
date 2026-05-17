type ApiOptions = RequestInit & {
  auth?: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const API_BASE_URL = ((import.meta as any).env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'internflow_access_token';
const USER_KEY = 'internflow_user';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(accessToken: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, headers, ...requestOptions } = options;
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...requestOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return (payload?.data ?? payload) as T;
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<{ accessToken: string; user: { id: string; name: string; email: string; role: string } }>(
      '/api/auth/login',
      {
        auth: false,
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    ),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  dashboard: () => apiRequest<any>('/api/dashboard'),
  referrals: () => apiRequest<any[]>('/api/referrals'),
  createReferral: (data: unknown) =>
    apiRequest('/api/referrals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  ndas: () => apiRequest<any[]>('/api/nda'),
  submitNda: (data: unknown) =>
    apiRequest('/api/nda', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  certificates: () => apiRequest<any[]>('/api/certificates'),
  issueCertificate: (data: unknown) =>
    apiRequest('/api/certificates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  notifications: () => apiRequest<any[]>('/api/notifications'),
};
