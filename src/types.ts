export const PASTEL_COLORS = [
  { name: 'Niebieski', hex: '#A8D8EA' },
  { name: 'Zielony', hex: '#A8E6CF' },
  { name: 'Żółty', hex: '#FFEAA7' },
  { name: 'Różowy', hex: '#FFB3BA' },
  { name: 'Fioletowy', hex: '#C3B1E1' },
  { name: 'Pomarańczowy', hex: '#FFCBA4' },
  { name: 'Turkusowy', hex: '#B2F0E8' },
  { name: 'Lawendowy', hex: '#E6DEFF' },
  { name: 'Brzoskwiniowy', hex: '#FFDAC1' },
] as const;

export type PastelColor = (typeof PASTEL_COLORS)[number]['hex'];

export const TIME_PRESETS = [
  { label: '15min', value: 15 },
  { label: '30min', value: 30 },
  { label: '45min', value: 45 },
  { label: '1h', value: 60 },
  { label: '1.5h', value: 90 },
  { label: '2h', value: 120 },
  { label: '3h', value: 180 },
] as const;

export const MEAL_SLOT_LABELS: Record<string, string> = {
  BREAKFAST: 'śniadanie',
  SECOND_BREAKFAST: 'II śniadanie',
  LUNCH: 'obiad',
  SNACK: 'podwieczorek',
  DINNER: 'kolacja',
};

export interface Category {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
}

export interface Task {
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

export interface BacklogTask {
  id: number;
  name: string;
  description: string;
  estimatedMinutes: number;
  priority: string;
  createdAt: string;
}

export interface MealSlot {
  id: number;
  dayId: number;
  slot: string;
  description: string;
  eaten: boolean;
}

export interface Note {
  id: number;
  dayId: number;
  content: string;
  createdAt: string;
}

export interface RecurringEvent {
  id: number;
  dayId: number;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface ShoppingCategory {
  id: number;
  name: string;
}

export interface ShoppingItem {
  id: number;
  name: string;
  categoryName: string;
  categoryId: number | null;
  quantity: number;
  unit: string;
  bought: boolean;
  createdAt: string;
}

export interface FoodCategory {
  id: number;
  name: string;
}

export interface FoodVariant {
  id: number;
  name: string;
  description: string | null;
  preparation: string | null;
}

export interface Food {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  link: string | null;
  categoryId: number | null;
  categoryName: string | null;
  createdAt: string;
  variants: FoodVariant[] | null;
}

export type ScheduleType = 'DAILY' | 'SPECIFIC_DAYS' | 'EVERY_X_DAYS';

export const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  DAILY: 'Codziennie',
  SPECIFIC_DAYS: 'Wybrane dni',
  EVERY_X_DAYS: 'Co X dni',
};

export const DAY_LABELS: Record<string, string> = {
  MON: 'Pon', TUE: 'Wt', WED: 'Sr', THU: 'Czw', FRI: 'Pt', SAT: 'Sob', SUN: 'Ndz',
};

export interface Habit {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  scheduleType: ScheduleType;
  scheduleDays: string | null;
  scheduleInterval: number | null;
  startDate: string;
  active: boolean;
  streakGoal: number | null;
  createdAt: string;
}

export interface HabitForDate {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  completed: boolean;
  scheduleType: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRateThisMonth: number;
  completionsPerMonth: Record<string, number>;
}

export interface HabitCompletion {
  id: number;
  completedDate: string;
  completedAt: string;
}

export interface DayData {
  id: number;
  date: string;
  wakeUpTime: string;
  sleepTime: string;
  closed: boolean;
}
