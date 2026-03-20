import { useState, useEffect, useCallback, useRef } from 'react';
import { habitApi, categoryApi } from '../api';
import type {
  Habit,
  HabitStats,
  HabitCompletion,
  Category,
  ScheduleType,
} from '../types';
import { SCHEDULE_LABELS, DAY_LABELS } from '../types';
import { NavTabs } from '../components/NavTabs';
import { UserMenu } from '../components/UserMenu';

const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
];
const WEEKDAY_HEADERS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ── Calendar Date Picker ──
function DatePicker({
  value,
  onChange,
}: {
  value: string; // yyyy-MM-dd
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = formatDate(new Date());

  function selectDay(day: number) {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  }

  const displayDate = value
    ? `${parseInt(value.slice(8, 10))} ${MONTH_NAMES[parseInt(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}`
    : 'Wybierz datę';

  return (
    <div className="datepicker" ref={ref}>
      <button
        type="button"
        className="datepicker-trigger"
        onClick={() => {
          if (!open) {
            setViewYear(selected.getFullYear());
            setViewMonth(selected.getMonth());
          }
          setOpen(!open);
        }}
      >
        {displayDate}
      </button>
      {open && (
        <div className="datepicker-dropdown">
          <div className="datepicker-nav">
            <button type="button" className="datepicker-nav-btn" onClick={prevMonth}>‹</button>
            <span className="datepicker-month">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" className="datepicker-nav-btn" onClick={nextMonth}>›</button>
          </div>
          <div className="datepicker-weekdays">
            {WEEKDAY_HEADERS.map((w) => (
              <span key={w} className="datepicker-weekday">{w}</span>
            ))}
          </div>
          <div className="datepicker-grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e${i}`} className="datepicker-cell datepicker-cell--empty" />;
              const m = String(viewMonth + 1).padStart(2, '0');
              const d = String(day).padStart(2, '0');
              const cellDate = `${viewYear}-${m}-${d}`;
              const isSelected = cellDate === value;
              const isToday = cellDate === todayStr;
              return (
                <button
                  key={day}
                  type="button"
                  className={`datepicker-cell ${isSelected ? 'datepicker-cell--selected' : ''} ${isToday ? 'datepicker-cell--today' : ''}`}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getMonthsBack(months: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - months);
  return { from: formatDate(from), to: formatDate(to) };
}

function scheduleDescription(h: Habit): string {
  if (h.scheduleType === 'DAILY') return 'Codziennie';
  if (h.scheduleType === 'SPECIFIC_DAYS' && h.scheduleDays) {
    return h.scheduleDays
      .split(',')
      .map((d) => DAY_LABELS[d] || d)
      .join(', ');
  }
  if (h.scheduleType === 'EVERY_X_DAYS' && h.scheduleInterval) {
    return `Co ${h.scheduleInterval} dni`;
  }
  return SCHEDULE_LABELS[h.scheduleType] || h.scheduleType;
}

// ── Heatmap Component ──
function Heatmap({ completions }: { completions: HabitCompletion[] }) {
  const completedSet = new Set(completions.map((c) => c.completedDate));
  const today = new Date();
  const weeks: { date: Date; dateStr: string }[][] = [];

  // Build 26 weeks (~ 6 months)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 26 * 7 + (7 - startDate.getDay()));

  let currentWeek: { date: Date; dateStr: string }[] = [];
  const d = new Date(startDate);
  while (d <= today) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 1 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push({ date: new Date(d), dateStr: formatDate(d) });
    d.setDate(d.getDate() + 1);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="heatmap">
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="heatmap-week">
            {week.map((day) => (
              <div
                key={day.dateStr}
                className={`heatmap-cell ${completedSet.has(day.dateStr) ? 'heatmap-cell--done' : ''}`}
                title={`${day.dateStr}${completedSet.has(day.dateStr) ? ' ✓' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">MNIEJ</span>
        <div className="heatmap-cell" />
        <div className="heatmap-cell heatmap-cell--done" />
        <span className="heatmap-legend-label">WIĘCEJ</span>
      </div>
    </div>
  );
}

// ── Habit Form ──
function HabitForm({
  initial,
  categories,
  onSubmit,
  onCancel,
}: {
  initial?: Habit;
  categories: Category[];
  onSubmit: (data: {
    name: string;
    description?: string;
    categoryId?: number | null;
    scheduleType: string;
    scheduleDays?: string;
    scheduleInterval?: number;
    startDate: string;
    streakGoal?: number | null;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [scheduleType, setScheduleType] = useState<ScheduleType>(initial?.scheduleType || 'DAILY');
  const [scheduleDays, setScheduleDays] = useState<string[]>(
    initial?.scheduleDays ? initial.scheduleDays.split(',') : [],
  );
  const [scheduleInterval, setScheduleInterval] = useState(initial?.scheduleInterval || 2);
  const [startDate, setStartDate] = useState(initial?.startDate || formatDate(new Date()));
  const [streakGoal, setStreakGoal] = useState<number | ''>(initial?.streakGoal ?? '');

  function toggleDay(day: string) {
    setScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      categoryId,
      scheduleType,
      scheduleDays: scheduleType === 'SPECIFIC_DAYS' ? scheduleDays.join(',') : undefined,
      scheduleInterval: scheduleType === 'EVERY_X_DAYS' ? scheduleInterval : undefined,
      startDate,
      streakGoal: streakGoal ? Number(streakGoal) : null,
    });
  }

  return (
    <form className="habit-form" onSubmit={handleSubmit}>
      <input
        className="habit-form-input"
        placeholder="Nazwa nawyka"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <input
        className="habit-form-input"
        placeholder="Opis (opcjonalny)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="habit-form-row">
        <label className="habit-form-label">KATEGORIA</label>
        <select
          className="habit-form-select"
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Brak</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="habit-form-row">
        <label className="habit-form-label">HARMONOGRAM</label>
        <div className="habit-schedule-btns">
          {(Object.keys(SCHEDULE_LABELS) as ScheduleType[]).map((type) => (
            <button
              key={type}
              type="button"
              className={`habit-schedule-btn ${scheduleType === type ? 'habit-schedule-btn--active' : ''}`}
              onClick={() => setScheduleType(type)}
            >
              {SCHEDULE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {scheduleType === 'SPECIFIC_DAYS' && (
        <div className="habit-form-row">
          <label className="habit-form-label">DNI</label>
          <div className="habit-days-picker">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                type="button"
                className={`habit-day-btn ${scheduleDays.includes(day) ? 'habit-day-btn--active' : ''}`}
                onClick={() => toggleDay(day)}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>
      )}

      {scheduleType === 'EVERY_X_DAYS' && (
        <div className="habit-form-row">
          <label className="habit-form-label">CO ILE DNI</label>
          <input
            type="number"
            className="habit-form-input habit-form-input--short"
            min={2}
            value={scheduleInterval}
            onChange={(e) => setScheduleInterval(Number(e.target.value))}
          />
        </div>
      )}

      <div className="habit-form-row">
        <label className="habit-form-label">DATA STARTU</label>
        <DatePicker value={startDate} onChange={setStartDate} />
      </div>

      <div className="habit-form-row">
        <label className="habit-form-label">CEL STREAK</label>
        <input
          type="number"
          className="habit-form-input habit-form-input--short"
          placeholder="np. 30"
          min={1}
          value={streakGoal}
          onChange={(e) => setStreakGoal(e.target.value ? Number(e.target.value) : '')}
        />
      </div>

      <div className="habit-form-actions">
        <button type="submit" className="habit-form-submit">
          {initial ? 'ZAPISZ' : 'DODAJ'}
        </button>
        <button type="button" className="habit-form-cancel" onClick={onCancel}>
          ANULUJ
        </button>
      </div>
    </form>
  );
}

// ── Habit Detail ──
function HabitDetail({
  habit,
  categories,
  onClose,
  onUpdate,
  onDelete,
}: {
  habit: Habit;
  categories: Category[];
  onClose: () => void;
  onUpdate: (h: Habit) => void;
  onDelete: (id: number) => void;
}) {
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const { from, to } = getMonthsBack(6);
    Promise.all([
      habitApi.getStats(habit.id),
      habitApi.getCompletions(habit.id, from, to),
    ]).then(([s, c]) => {
      setStats(s as HabitStats);
      setCompletions(c as HabitCompletion[]);
    }).catch(() => {});
  }, [habit.id]);

  async function handleTogglePause() {
    try {
      const updated = await habitApi.togglePause(habit.id);
      onUpdate(updated as Habit);
    } catch { /* silent */ }
  }

  async function handleUpdate(data: Parameters<typeof habitApi.update>[1]) {
    try {
      const updated = await habitApi.update(habit.id, data as Parameters<typeof habitApi.update>[1]);
      onUpdate(updated as Habit);
      setEditing(false);
    } catch { /* silent */ }
  }

  async function handleDelete() {
    try {
      await habitApi.delete(habit.id);
      onDelete(habit.id);
    } catch { /* silent */ }
  }

  if (editing) {
    return (
      <div className="habit-detail-overlay" onClick={onClose}>
        <div className="habit-detail" onClick={(e) => e.stopPropagation()}>
          <div className="habit-detail-header">
            <button className="habit-detail-close" onClick={() => setEditing(false)}>
              ✕
            </button>
          </div>
          <div className="habit-detail-body">
            <HabitForm
              initial={habit}
              categories={categories}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="habit-detail-overlay" onClick={onClose}>
      <div className="habit-detail" onClick={(e) => e.stopPropagation()}>
        <div className="habit-detail-header">
          <button className="habit-detail-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="habit-detail-body">
          <div className="habit-detail-top">
            <h2 className="habit-detail-name">{habit.name}</h2>
            {habit.categoryName && (
              <span
                className="habit-detail-cat"
                style={{ borderColor: habit.categoryColor || 'var(--border)' }}
              >
                {habit.categoryName}
              </span>
            )}
            <span className={`habit-badge ${habit.active ? 'habit-badge--active' : 'habit-badge--paused'}`}>
              {habit.active ? 'AKTYWNY' : 'PAUZA'}
            </span>
          </div>

          {habit.description && (
            <p className="habit-detail-desc">{habit.description}</p>
          )}

          <div className="habit-detail-schedule">
            <span className="habit-detail-schedule-label">HARMONOGRAM</span>
            <span>{scheduleDescription(habit)}</span>
          </div>

          {/* Stats */}
          {stats && (
            <div className="habit-stats-grid">
              <div className="habit-stat">
                <span className="habit-stat-value">{stats.currentStreak}</span>
                <span className="habit-stat-label">OBECNY STREAK</span>
              </div>
              <div className="habit-stat">
                <span className="habit-stat-value">{stats.longestStreak}</span>
                <span className="habit-stat-label">NAJDŁUŻSZY</span>
              </div>
              <div className="habit-stat">
                <span className="habit-stat-value">{stats.totalCompletions}</span>
                <span className="habit-stat-label">RAZEM</span>
              </div>
              <div className="habit-stat">
                <span className="habit-stat-value">{Math.round(stats.completionRateThisMonth)}%</span>
                <span className="habit-stat-label">TEN MIESIĄC</span>
              </div>
            </div>
          )}

          {/* Streak goal */}
          {habit.streakGoal && stats && (
            <div className="habit-streak-goal">
              <div className="habit-streak-goal-bar">
                <div
                  className="habit-streak-goal-fill"
                  style={{ width: `${Math.min(100, (stats.currentStreak / habit.streakGoal) * 100)}%` }}
                />
              </div>
              <span className="habit-streak-goal-label">
                {stats.currentStreak} / {habit.streakGoal} DNI
              </span>
            </div>
          )}

          {/* Heatmap */}
          <div className="habit-detail-section">
            <span className="habit-detail-section-title">AKTYWNOŚĆ (6 MIESIĘCY)</span>
            <Heatmap completions={completions} />
          </div>

          {/* Actions */}
          <div className="habit-detail-actions">
            <button className="habit-action-btn" onClick={() => setEditing(true)}>
              EDYTUJ
            </button>
            <button className="habit-action-btn" onClick={handleTogglePause}>
              {habit.active ? 'PAUZA' : 'WZNÓW'}
            </button>
            <button className="habit-action-btn habit-action-btn--danger" onClick={handleDelete}>
              USUŃ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  const fetchData = useCallback(async () => {
    try {
      const [habitsData, catsData] = await Promise.all([
        habitApi.getAll(),
        categoryApi.getAll(),
      ]);
      setHabits(habitsData as Habit[]);
      setCategories(catsData as Category[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate(data: Parameters<typeof habitApi.create>[0]) {
    try {
      const h = await habitApi.create(data);
      setHabits((prev) => [...prev, h as Habit]);
      setShowForm(false);
    } catch { /* silent */ }
  }

  function handleUpdate(updated: Habit) {
    setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    setSelectedHabit(updated);
  }

  function handleDelete(id: number) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setSelectedHabit(null);
  }

  const filtered = habits.filter((h) => {
    if (filter === 'active') return h.active;
    if (filter === 'paused') return !h.active;
    return true;
  });

  // Group by category
  const grouped = new Map<string, Habit[]>();
  const noCat: Habit[] = [];
  for (const h of filtered) {
    if (h.categoryName) {
      const list = grouped.get(h.categoryName) || [];
      list.push(h);
      grouped.set(h.categoryName, list);
    } else {
      noCat.push(h);
    }
  }

  if (loading) {
    return <div className="app loading">Ładowanie...</div>;
  }

  return (
    <div className="app">
      <div className="page-header">
        <NavTabs />
        <UserMenu />
      </div>

      <div className="section">
        <div className="section-header">
          <h1 className="section-title">HABITY</h1>
          <button className="btn-add" onClick={() => setShowForm(true)}>
            + NOWY NAWYK
          </button>
        </div>

        {/* Filter tabs */}
        <div className="habit-filters">
          {(['all', 'active', 'paused'] as const).map((f) => (
            <button
              key={f}
              className={`habit-filter-btn ${filter === f ? 'habit-filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'WSZYSTKIE' : f === 'active' ? 'AKTYWNE' : 'PAUZOWANE'}
              <span className="habit-filter-count">
                {f === 'all'
                  ? habits.length
                  : f === 'active'
                    ? habits.filter((h) => h.active).length
                    : habits.filter((h) => !h.active).length}
              </span>
            </button>
          ))}
        </div>

        {/* Add form */}
        {showForm && (
          <HabitForm
            categories={categories}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Habits list grouped by category */}
        {filtered.length === 0 && !showForm && (
          <div className="habit-empty">
            Brak nawyków. Dodaj pierwszy nawyk aby zacząć śledzić postępy.
          </div>
        )}

        {Array.from(grouped.entries()).map(([catName, catHabits]) => {
          const color = catHabits[0]?.categoryColor || 'var(--border)';
          return (
            <div key={catName} className="habit-group">
              <div className="habit-group-header" style={{ borderColor: color }}>
                <span className="habit-group-name">{catName}</span>
                <span className="habit-group-count">{catHabits.length}</span>
              </div>
              {catHabits.map((h) => (
                <HabitCard key={h.id} habit={h} onClick={() => setSelectedHabit(h)} />
              ))}
            </div>
          );
        })}

        {noCat.length > 0 && (
          <div className="habit-group">
            {grouped.size > 0 && (
              <div className="habit-group-header">
                <span className="habit-group-name">BEZ KATEGORII</span>
                <span className="habit-group-count">{noCat.length}</span>
              </div>
            )}
            {noCat.map((h) => (
              <HabitCard key={h.id} habit={h} onClick={() => setSelectedHabit(h)} />
            ))}
          </div>
        )}
      </div>

      {/* Detail overlay */}
      {selectedHabit && (
        <HabitDetail
          habit={selectedHabit}
          categories={categories}
          onClose={() => setSelectedHabit(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ── Habit Card ──
function HabitCard({ habit, onClick }: { habit: Habit; onClick: () => void }) {
  return (
    <div className="habit-card" onClick={onClick}>
      <div className="habit-card-left">
        {habit.categoryColor && (
          <div className="habit-card-dot" style={{ background: habit.categoryColor }} />
        )}
        <div className="habit-card-info">
          <span className="habit-card-name">{habit.name}</span>
          <span className="habit-card-schedule">{scheduleDescription(habit)}</span>
        </div>
      </div>
      <div className="habit-card-right">
        <span className={`habit-badge ${habit.active ? 'habit-badge--active' : 'habit-badge--paused'}`}>
          {habit.active ? 'AKTYWNY' : 'PAUZA'}
        </span>
      </div>
    </div>
  );
}
