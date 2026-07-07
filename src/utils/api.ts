export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
  timestamp: string;
};

export type UserView = {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
};

export type AuthResult = {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
  user: UserView;
};

export type AuthState = {
  token: string;
  user: UserView;
};

export type BlogVisibility = 'PUBLIC' | 'LOGIN_REQUIRED' | 'PRIVATE';

export type BlogPost = {
  id: number;
  content: string;
  summary: string;
  visibility: BlogVisibility;
  authorId: number;
  authorName: string;
  owned: boolean;
  createdAt: string;
  updatedAt: string;
};

export const visibilityOptions: Array<{ value: BlogVisibility; label: string }> = [
  { value: 'PUBLIC', label: '公共' },
  { value: 'LOGIN_REQUIRED', label: '登录可见' },
  { value: 'PRIVATE', label: '私有' },
];

export function visibilityLabel(value: BlogVisibility) {
  return visibilityOptions.find((item) => item.value === value)?.label || '公共';
}

export const authStorageKey = 'blog-auth';

export function readStoredAuth(): AuthState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(authStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    window.localStorage.removeItem(authStorageKey);
    return null;
  }
}

export function writeStoredAuth(auth: AuthState) {
  window.localStorage.setItem(authStorageKey, JSON.stringify(auth));
}

export function clearStoredAuth() {
  window.localStorage.removeItem(authStorageKey);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  auth?: AuthState | null,
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth?.token) {
    headers.set('Authorization', auth.token);
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const result = (await response.json()) as ApiResponse<T>;
  if (!response.ok || result.code !== 200) {
    throw new Error(result.message || '请求失败');
  }

  return result.data;
}

export function formatDateTime(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace('T', ' ').slice(0, 19);
  }

  return date.toLocaleString();
}
