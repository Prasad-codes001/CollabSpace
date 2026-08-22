const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1';

export class UnauthorizedError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

type RequestOptions = {
  headers?: Record<string, string>;
  body?: unknown;
};

function handleUnauthorized(isSessionExpired: boolean) {
  if (isSessionExpired) {
    localStorage.removeItem('collabspace_token');
    localStorage.removeItem('collabspace_user');
  }
  window.dispatchEvent(new Event('collabspace:unauthorized'));
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('collabspace_token');

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401) {
      const errorData = await res.json().catch(() => ({ message: '' }));
      const errorMsg = (errorData.message || '').toLowerCase();
      
      // If it's an invalid credential error, show warning but keep token
      if (errorMsg.includes('invalid email or password')) {
        throw new Error('Invalid credentials');
      }
      
      // Otherwise, treat as session expired
      handleUnauthorized(true);
      throw new UnauthorizedError();
    }

    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function upload<T>(path: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem('collabspace_token');

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 401) {
      const errorData = await res.json().catch(() => ({ message: '' }));
      const errorMsg = (errorData.message || '').toLowerCase();
      
      // If it's an invalid credential error, show warning but keep token
      if (errorMsg.includes('invalid email or password')) {
        throw new Error('Invalid credentials');
      }
      
      // Otherwise, treat as session expired
      handleUnauthorized(true);
      throw new UnauthorizedError();
    }

    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  get:    <T>(path: string, opts?: RequestOptions) => request<T>('GET',    path, opts),
  post:   <T>(path: string, body: unknown, opts?: RequestOptions) => request<T>('POST',   path, { ...opts, body }),
  put:    <T>(path: string, body: unknown, opts?: RequestOptions) => request<T>('PUT',    path, { ...opts, body }),
  patch:  <T>(path: string, body: unknown, opts?: RequestOptions) => request<T>('PATCH',  path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
  upload: <T>(path: string, formData: FormData) => upload<T>(path, formData),
};
