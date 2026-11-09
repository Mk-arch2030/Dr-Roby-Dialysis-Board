import type { AuthUser, Session, Slot, Vital } from '../types';

const TOKEN_KEY = 'dr-roby-token';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let currentToken: string | null = null;

export function loadStoredToken(): string | null {
  try {
    currentToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    currentToken = null;
  }
  return currentToken;
}

export function setAuthToken(token: string | null): void {
  currentToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* التخزين قد يكون معطلًا — الجلسة تبقى في الذاكرة فقط */
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body) headers['Content-Type'] = 'application/json';
  if (currentToken) headers.Authorization = `Bearer ${currentToken}`;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'تعذّر الاتصال بالخادم — تأكد أن سيرفر الوحدة يعمل ثم أعد المحاولة.');
  }

  const raw = await response.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `فشل الطلب (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export interface LoginResult {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface StartSessionPayload {
  slotId: number;
  patient: { name: string; fileNo: string; age: number };
  access: string;
  dryWeight: number;
  preWeight: number;
  ufGoalMl: number;
  qb: number;
  durationMin: number;
}

export interface VitalPayload {
  systolic: number;
  diastolic: number;
  pulse: number;
  ufRemovedMl: number;
  note?: string;
}

export const api = {
  login: (username: string, password: string) =>
    request<LoginResult>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  me: () => request<{ user: AuthUser }>('/auth/me'),

  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ token: string; expiresAt: string }>('/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  board: () => request<{ slots: Slot[]; serverTime: string }>('/board'),

  startSession: (payload: StartSessionPayload) =>
    request<{ session: Session }>('/sessions', { method: 'POST', body: JSON.stringify(payload) }),

  addVital: (sessionId: string, payload: VitalPayload) =>
    request<{ session: Session }>(`/sessions/${encodeURIComponent(sessionId)}/vitals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  endSession: (sessionId: string) =>
    request<{ session: Session }>(`/sessions/${encodeURIComponent(sessionId)}/end`, { method: 'POST' }),

  discharge: (sessionId: string) =>
    request<{ ok: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/discharge`, { method: 'POST' }),

  resetDemo: () => request<{ ok: boolean }>('/admin/reset-demo', { method: 'POST' }),
};

export type { Vital };
