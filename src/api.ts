const API_URL =
  (window as any).__ENV__?.VITE_API_URL ||
  import.meta.env.VITE_API_URL ||
  '';
const BASE = API_URL + '/api';

// ── Token management ──
let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');
let refreshPromise: Promise<void> | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function getAccessToken() { return accessToken; }
export function getRefreshToken() { return refreshToken; }

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { clearTokens(); return false; }
    const data: AuthResponse = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${BASE}${url}`, { ...options, headers: { ...headers, ...options?.headers } });

  if (res.status === 401 && refreshToken) {
    if (!refreshPromise) {
      refreshPromise = tryRefresh().then((ok) => {
        refreshPromise = null;
        if (!ok) throw new Error('Session expired');
      });
    }
    await refreshPromise;
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${BASE}${url}`, { ...options, headers: { ...headers, ...options?.headers } });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  authProvider: string;
}

export const authApi = {
  register: (data: { email: string; password: string; displayName: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  refresh: (token: string) =>
    request<AuthResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: token }) }),
  logout: (token: string) =>
    request<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: token }) }),
  googleUrl: () => request<{ url: string }>('/auth/google'),
  googleCallback: (code: string) =>
    request<AuthResponse>('/auth/google/callback', { method: 'POST', body: JSON.stringify({ code }) }),
};

export const profileApi = {
  get: () => request<UserProfile>('/profile'),
  update: (data: { displayName?: string; avatarUrl?: string }) =>
    request<UserProfile>('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    request<void>('/profile/password', { method: 'PUT', body: JSON.stringify(data) }),
  delete: () => request<void>('/profile', { method: 'DELETE' }),
};

// ── Day ──
export interface DayResponse {
  id: number;
  date: string;
  wakeUpTime: string;
  sleepTime: string;
  closed: boolean;
}

export interface DayStatsResponse {
  tasksDone: number;
  tasksTotal: number;
  mealsEaten: number;
  mealsTotal: number;
  productiveMinutes: number;
  sleepMinutes: number;
  thoughtsCount: number;
}

export const dayApi = {
  get: (date: string) => request<DayResponse>(`/days/${date}`),
  update: (date: string, data: Partial<DayResponse>) =>
    request<DayResponse>(`/days/${date}`, { method: 'PUT', body: JSON.stringify(data) }),
  stats: (date: string) => request<DayStatsResponse>(`/days/${date}/stats`),
};

// ── Category ──
export interface CategoryResponse {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
}

export const categoryApi = {
  getAll: () => request<CategoryResponse[]>('/categories'),
  create: (data: { name: string; color: string; sortOrder: number }) =>
    request<CategoryResponse>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name: string; color: string; sortOrder: number }) =>
    request<CategoryResponse>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
};

// ── Task ──
export interface TaskResponse {
  id: number;
  dayId: number;
  categoryId: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  priority: string;
  sortOrder: number;
  completed: boolean;
}

export const taskApi = {
  getByDay: (date: string) => request<TaskResponse[]>(`/days/${date}/tasks`),
  create: (date: string, data: Omit<TaskResponse, 'id' | 'dayId' | 'sortOrder' | 'completed'>) =>
    request<TaskResponse>(`/days/${date}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<TaskResponse>) =>
    request<TaskResponse>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggle: (id: number) => request<TaskResponse>(`/tasks/${id}/toggle`, { method: 'PATCH' }),
  delete: (id: number) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  reorder: (taskIds: number[]) =>
    request<void>('/tasks/reorder', { method: 'PATCH', body: JSON.stringify({ taskIds }) }),
};

// ── Meal ──
export interface MealResponse {
  id: number;
  dayId: number;
  slot: string;
  description: string;
  eaten: boolean;
}

export const mealApi = {
  getByDay: (date: string) => request<MealResponse[]>(`/days/${date}/meals`),
  update: (id: number, data: { description: string; eaten: boolean }) =>
    request<MealResponse>(`/meals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Thought ──
export interface ThoughtResponse {
  id: number;
  dayId: number;
  content: string;
  createdAt: string;
}

export const thoughtApi = {
  getByDay: (date: string) => request<ThoughtResponse[]>(`/days/${date}/thoughts`),
  create: (date: string, content: string) =>
    request<ThoughtResponse>(`/days/${date}/thoughts`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  delete: (id: number) => request<void>(`/thoughts/${id}`, { method: 'DELETE' }),
};

// ── Recurring Event ──
export interface RecurringEventResponse {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export const recurringEventApi = {
  getAll: () => request<RecurringEventResponse[]>('/recurring-events'),
  create: (data: { name: string; startTime: string; endTime: string }) =>
    request<RecurringEventResponse>('/recurring-events', {
      method: 'POST',
      body: JSON.stringify({ ...data, active: true }),
    }),
  update: (id: number, data: Partial<RecurringEventResponse>) =>
    request<RecurringEventResponse>(`/recurring-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) => request<void>(`/recurring-events/${id}`, { method: 'DELETE' }),
};

// ── Backlog ──
export interface BacklogTaskResponse {
  id: number;
  name: string;
  description: string;
  estimatedMinutes: number;
  priority: string;
  createdAt: string;
}

export const backlogApi = {
  getAll: () => request<BacklogTaskResponse[]>('/backlog'),
  create: (data: { name: string; description: string; estimatedMinutes: number; priority: string }) =>
    request<BacklogTaskResponse>('/backlog', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/backlog/${id}`, { method: 'DELETE' }),
  moveToDay: (id: number, date: string, categoryId: number) =>
    request<TaskResponse>(`/backlog/${id}/move-to-day?date=${date}&categoryId=${categoryId}`, {
      method: 'POST',
    }),
};
