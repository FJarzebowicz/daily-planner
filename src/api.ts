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
  dayId: number;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export const recurringEventApi = {
  getByDay: (date: string) => request<RecurringEventResponse[]>(`/days/${date}/recurring-events`),
  create: (date: string, data: { name: string; startTime: string; endTime: string }) =>
    request<RecurringEventResponse>(`/days/${date}/recurring-events`, {
      method: 'POST',
      body: JSON.stringify({ ...data, active: true }),
    }),
  delete: (id: number) => request<void>(`/recurring-events/${id}`, { method: 'DELETE' }),
  copyFromPreviousDay: (date: string) =>
    request<RecurringEventResponse[]>(`/days/${date}/recurring-events/copy-previous`, { method: 'POST' }),
};

// ── Shopping Category ──
export interface ShoppingCategoryResponse {
  id: number;
  name: string;
}

export const shoppingCategoryApi = {
  getAll: () => request<ShoppingCategoryResponse[]>('/shopping-categories'),
  create: (data: { name: string }) =>
    request<ShoppingCategoryResponse>('/shopping-categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name: string }) =>
    request<ShoppingCategoryResponse>(`/shopping-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/shopping-categories/${id}`, { method: 'DELETE' }),
};

// ── Shopping ──
export interface ShoppingItemResponse {
  id: number;
  name: string;
  categoryName: string;
  categoryId: number | null;
  quantity: number;
  unit: string;
  bought: boolean;
  createdAt: string;
}

export const shoppingApi = {
  getAll: () => request<ShoppingItemResponse[]>('/shopping'),
  create: (data: { name: string; categoryName: string; categoryId?: number | null; quantity: number; unit: string }) =>
    request<ShoppingItemResponse>('/shopping', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name: string; categoryName: string; categoryId?: number | null; quantity: number; unit: string }) =>
    request<ShoppingItemResponse>(`/shopping/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggle: (id: number) => request<ShoppingItemResponse>(`/shopping/${id}/toggle`, { method: 'PATCH' }),
  delete: (id: number) => request<void>(`/shopping/${id}`, { method: 'DELETE' }),
  deleteBought: () => request<void>('/shopping/bought', { method: 'DELETE' }),
};

// ── File upload helper ──
async function uploadFile<T>(url: string, file: File): Promise<T> {
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}${url}`, { method: 'POST', headers, body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

// ── Food Category ──
export interface FoodCategoryResponse {
  id: number;
  name: string;
}

export const foodCategoryApi = {
  getAll: () => request<FoodCategoryResponse[]>('/food-categories'),
  create: (data: { name: string }) =>
    request<FoodCategoryResponse>('/food-categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name: string }) =>
    request<FoodCategoryResponse>(`/food-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/food-categories/${id}`, { method: 'DELETE' }),
};

// ── Food ──
export interface FoodResponse {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  link: string | null;
  categoryId: number | null;
  categoryName: string | null;
  createdAt: string;
  variants: FoodVariantResponse[] | null;
}

export interface FoodVariantResponse {
  id: number;
  name: string;
  description: string | null;
  preparation: string | null;
}

export const foodApi = {
  getAll: (categoryId?: number) =>
    request<FoodResponse[]>(categoryId ? `/foods?categoryId=${categoryId}` : '/foods'),
  getById: (id: number) => request<FoodResponse>(`/foods/${id}`),
  search: (q: string) => request<FoodResponse[]>(`/foods/search?q=${encodeURIComponent(q)}`),
  create: (data: { name: string; description?: string; link?: string; categoryId?: number | null }) =>
    request<FoodResponse>('/foods', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name: string; description?: string; link?: string; categoryId?: number | null }) =>
    request<FoodResponse>(`/foods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  uploadImage: (id: number, file: File) => uploadFile<FoodResponse>(`/foods/${id}/image`, file),
  delete: (id: number) => request<void>(`/foods/${id}`, { method: 'DELETE' }),
};

export const foodVariantApi = {
  getAll: (foodId: number) => request<FoodVariantResponse[]>(`/foods/${foodId}/variants`),
  create: (foodId: number, data: { name: string; description?: string; preparation?: string }) =>
    request<FoodVariantResponse>(`/foods/${foodId}/variants`, { method: 'POST', body: JSON.stringify(data) }),
  update: (foodId: number, id: number, data: { name: string; description?: string; preparation?: string }) =>
    request<FoodVariantResponse>(`/foods/${foodId}/variants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (foodId: number, id: number) => request<void>(`/foods/${foodId}/variants/${id}`, { method: 'DELETE' }),
};

// ── Habits ──
export interface HabitResponse {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  scheduleType: string;
  scheduleDays: string | null;
  scheduleInterval: number | null;
  startDate: string;
  active: boolean;
  streakGoal: number | null;
  createdAt: string;
}

export interface HabitForDateResponse {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  completed: boolean;
  scheduleType: string;
}

export interface HabitStatsResponse {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRateThisMonth: number;
  completionsPerMonth: Record<string, number>;
}

export interface HabitCompletionResponse {
  id: number;
  completedDate: string;
  completedAt: string;
}

export const habitApi = {
  getAll: () => request<HabitResponse[]>('/habits'),
  create: (data: { name: string; description?: string; categoryId?: number | null; scheduleType: string; scheduleDays?: string; scheduleInterval?: number; startDate: string; streakGoal?: number | null }) =>
    request<HabitResponse>('/habits', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name: string; description?: string; categoryId?: number | null; scheduleType: string; scheduleDays?: string; scheduleInterval?: number; startDate: string; active?: boolean; streakGoal?: number | null }) =>
    request<HabitResponse>(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/habits/${id}`, { method: 'DELETE' }),
  togglePause: (id: number) => request<HabitResponse>(`/habits/${id}/pause`, { method: 'PUT' }),
  complete: (id: number, date: string) =>
    request<HabitCompletionResponse>(`/habits/${id}/complete/${date}`, { method: 'POST' }),
  uncomplete: (id: number, date: string) =>
    request<void>(`/habits/${id}/complete/${date}`, { method: 'DELETE' }),
  getStats: (id: number) => request<HabitStatsResponse>(`/habits/${id}/stats`),
  getCompletions: (id: number, from: string, to: string) =>
    request<HabitCompletionResponse[]>(`/habits/${id}/completions?from=${from}&to=${to}`),
  getForDate: (date: string) => request<HabitForDateResponse[]>(`/habits/for-date/${date}`),
};

// ── Goals ──
export interface GoalResponse {
  id: number;
  name: string;
  description: string;
  rules: string | null;
  deadline: string | null;
  status: string;
  progress: number;
  milestonesCount: number;
  milestonesCompleted: number;
  createdAt: string;
}

export interface LinkedHabitResponse {
  habitId: number;
  name: string;
  description: string | null;
  categoryName: string | null;
  categoryColor: string | null;
}

export interface LinkedTaskResponse {
  taskId: number;
  title: string;
  description: string | null;
  categoryName: string | null;
  completed: boolean;
  estimatedMinutes: number;
}

export interface GoalMasterTaskResponse {
  id: number;
  name: string;
  description: string | null;
  habits: LinkedHabitResponse[];
  tasks: LinkedTaskResponse[];
}

export interface MilestoneResponse {
  id: number;
  name: string;
  description: string | null;
  completed: boolean;
  deadline: string | null;
  sortOrder: number;
  habits: LinkedHabitResponse[];
  tasks: LinkedTaskResponse[];
}

export interface GoalDetailResponse extends GoalResponse {
  masterTask: GoalMasterTaskResponse | null;
  milestones: MilestoneResponse[];
}

export const goalApi = {
  getAll: (status?: string) =>
    request<GoalResponse[]>(status ? `/goals?status=${status}` : '/goals'),
  getById: (id: number) => request<GoalDetailResponse>(`/goals/${id}`),
  create: (data: { name: string; description: string; rules?: string; deadline?: string }) =>
    request<GoalResponse>('/goals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { name: string; description: string; rules?: string; deadline?: string }) =>
    request<GoalResponse>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/goals/${id}`, { method: 'DELETE' }),
  updateStatus: (id: number, status: string) =>
    request<GoalResponse>(`/goals/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const goalMasterTaskApi = {
  createOrUpdate: (goalId: number, data: { name: string; description?: string }) =>
    request<GoalMasterTaskResponse>(`/goals/${goalId}/master-task`, { method: 'POST', body: JSON.stringify(data) }),
  linkHabit: (goalId: number, habitId: number) =>
    request<void>(`/goals/${goalId}/master-task/link-habit`, { method: 'POST', body: JSON.stringify({ habitId }) }),
  linkTask: (goalId: number, taskId: number) =>
    request<void>(`/goals/${goalId}/master-task/link-task`, { method: 'POST', body: JSON.stringify({ taskId }) }),
  createHabit: (goalId: number, data: { name: string; description?: string; categoryId?: number | null; scheduleType: string; scheduleDays?: string; scheduleInterval?: number; startDate: string }) =>
    request<LinkedHabitResponse>(`/goals/${goalId}/master-task/create-habit`, { method: 'POST', body: JSON.stringify(data) }),
  createTask: (goalId: number, data: { title: string; description?: string; categoryId: number; estimatedMinutes: number; priority: string; date: string }) =>
    request<LinkedTaskResponse>(`/goals/${goalId}/master-task/create-task`, { method: 'POST', body: JSON.stringify(data) }),
  unlinkHabit: (goalId: number, habitId: number) =>
    request<void>(`/goals/${goalId}/master-task/unlink-habit/${habitId}`, { method: 'DELETE' }),
  unlinkTask: (goalId: number, taskId: number) =>
    request<void>(`/goals/${goalId}/master-task/unlink-task/${taskId}`, { method: 'DELETE' }),
};

export const milestoneApi = {
  create: (goalId: number, data: { name: string; description?: string; deadline?: string }) =>
    request<MilestoneResponse>(`/goals/${goalId}/milestones`, { method: 'POST', body: JSON.stringify(data) }),
  update: (goalId: number, milestoneId: number, data: { name: string; description?: string; deadline?: string; sortOrder?: number }) =>
    request<MilestoneResponse>(`/goals/${goalId}/milestones/${milestoneId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (goalId: number, milestoneId: number) =>
    request<void>(`/goals/${goalId}/milestones/${milestoneId}`, { method: 'DELETE' }),
  toggleComplete: (goalId: number, milestoneId: number) =>
    request<MilestoneResponse>(`/goals/${goalId}/milestones/${milestoneId}/complete`, { method: 'PUT' }),
  linkHabit: (goalId: number, milestoneId: number, habitId: number) =>
    request<void>(`/goals/${goalId}/milestones/${milestoneId}/link-habit`, { method: 'POST', body: JSON.stringify({ habitId }) }),
  linkTask: (goalId: number, milestoneId: number, taskId: number) =>
    request<void>(`/goals/${goalId}/milestones/${milestoneId}/link-task`, { method: 'POST', body: JSON.stringify({ taskId }) }),
  createHabit: (goalId: number, milestoneId: number, data: { name: string; description?: string; categoryId?: number | null; scheduleType: string; scheduleDays?: string; scheduleInterval?: number; startDate: string }) =>
    request<LinkedHabitResponse>(`/goals/${goalId}/milestones/${milestoneId}/create-habit`, { method: 'POST', body: JSON.stringify(data) }),
  createTask: (goalId: number, milestoneId: number, data: { title: string; description?: string; categoryId: number; estimatedMinutes: number; priority: string; date: string }) =>
    request<LinkedTaskResponse>(`/goals/${goalId}/milestones/${milestoneId}/create-task`, { method: 'POST', body: JSON.stringify(data) }),
  unlinkHabit: (goalId: number, milestoneId: number, habitId: number) =>
    request<void>(`/goals/${goalId}/milestones/${milestoneId}/unlink-habit/${habitId}`, { method: 'DELETE' }),
  unlinkTask: (goalId: number, milestoneId: number, taskId: number) =>
    request<void>(`/goals/${goalId}/milestones/${milestoneId}/unlink-task/${taskId}`, { method: 'DELETE' }),
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
