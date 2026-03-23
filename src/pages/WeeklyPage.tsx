import { useState, useEffect, useRef, useCallback } from 'react'; // useEffect used in WeeklyPage loadData
import { useNavigate } from 'react-router-dom';
import { goalApi, weeklyGoalApi } from '../api';
import type { GoalResponse } from '../api';
import type { WeeklyGoal } from '../types';
import { NavTabs } from '../components/NavTabs';
import { UserMenu } from '../components/UserMenu';
import { formatDate, getWeekStart, getWeekEnd, shiftDate } from '../utils';

const POLISH_MONTHS = [
  'Stycznia', 'Lutego', 'Marca', 'Kwietnia', 'Maja', 'Czerwca',
  'Lipca', 'Sierpnia', 'Września', 'Października', 'Listopada', 'Grudnia',
];

const WEEKDAY_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

function formatWeekLabel(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart + 'T00:00:00');
  const e = new Date(weekEnd + 'T00:00:00');
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${POLISH_MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  }
  return `${s.getDate()} ${POLISH_MONTHS[s.getMonth()]} – ${e.getDate()} ${POLISH_MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

// ── DayCard ──
function DayCard({
  date,
  isToday,
  onClick,
}: {
  date: string;
  isToday: boolean;
  onClick: () => void;
}) {
  const d = new Date(date + 'T00:00:00');
  const dowIndex = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Pon
  const dayName = WEEKDAY_SHORT[dowIndex];
  const dayNum = d.getDate();

  return (
    <button
      className={`weekly-day-card${isToday ? ' weekly-day-card--today' : ''}`}
      onClick={onClick}
      type="button"
    >
      <span className="weekly-day-name">{dayName}</span>
      <span className="weekly-day-num">{dayNum}</span>
      {isToday && <span className="weekly-day-today-dot" />}
    </button>
  );
}

// ── GoalWeekCard ──
function GoalWeekCard({
  goal,
  weeklyGoal,
  onSave,
  onToggleAchieved,
  onDelete,
}: {
  goal: GoalResponse;
  weeklyGoal: WeeklyGoal | null;
  onSave: (goalId: number, description: string, existingId?: number) => void;
  onToggleAchieved: (wg: WeeklyGoal) => void;
  onDelete: (id: number) => void;
}) {
  const [text, setText] = useState(weeklyGoal?.description ?? '');
  const [saving, setSaving] = useState(false);
  const lastSavedRef = useRef(weeklyGoal?.description ?? '');

  async function handleBlur() {
    const trimmed = text.trim();
    if (trimmed === lastSavedRef.current) return;
    if (!trimmed && !weeklyGoal) return; // nie twórz pustego
    setSaving(true);
    await onSave(goal.id, trimmed, weeklyGoal?.id);
    lastSavedRef.current = trimmed;
    setSaving(false);
  }

  const achieved = weeklyGoal?.achieved ?? false;

  return (
    <div className={`weekly-goal-card${achieved ? ' weekly-goal-card--achieved' : ''}`}>
      <div className="weekly-goal-card-header">
        <span className="weekly-goal-card-name">{goal.name}</span>
        {weeklyGoal && (
          <button
            className="weekly-goal-delete"
            type="button"
            title="Usuń cel tygodniowy"
            onClick={() => onDelete(weeklyGoal.id)}
          >
            ×
          </button>
        )}
      </div>

      <textarea
        className="weekly-goal-textarea"
        placeholder="Co chcę osiągnąć w tym tygodniu..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        rows={3}
      />

      {saving && <span className="weekly-goal-saving">Zapisywanie...</span>}

      {weeklyGoal && (
        <button
          className={`weekly-goal-achieved-btn${achieved ? ' weekly-goal-achieved-btn--on' : ''}`}
          type="button"
          onClick={() => onToggleAchieved(weeklyGoal)}
        >
          <span className="weekly-goal-achieved-check">{achieved ? '✓' : '○'}</span>
          {achieved ? 'Przybliżyłem się!' : 'Przybliżyłem się?'}
        </button>
      )}
    </div>
  );
}

// ── WeeklyPage ──
export function WeeklyPage() {
  const navigate = useNavigate();
  const todayStr = formatDate(new Date());

  const [weekStart, setWeekStart] = useState(() => getWeekStart(todayStr));
  const weekEnd = getWeekEnd(weekStart);

  const [activeGoals, setActiveGoals] = useState<GoalResponse[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (ws: string) => {
    setLoading(true);
    try {
      const [goals, wgs] = await Promise.all([
        goalApi.getAll('ACTIVE'),
        weeklyGoalApi.getByWeek(ws),
      ]);
      setActiveGoals(goals);
      setWeeklyGoals(wgs as WeeklyGoal[]);
    } catch (err) {
      console.error('Failed to load weekly data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(weekStart);
  }, [weekStart, loadData]);

  function prevWeek() {
    setWeekStart((ws) => shiftDate(ws, -7));
  }

  function nextWeek() {
    setWeekStart((ws) => shiftDate(ws, 7));
  }

  function goToDay(date: string) {
    navigate(`/?date=${date}`);
  }

  async function handleSave(goalId: number, description: string, existingId?: number) {
    if (existingId) {
      // update
      const existing = weeklyGoals.find((w) => w.id === existingId);
      if (!existing) return;
      if (!description) {
        // puste = usuń
        await weeklyGoalApi.delete(existingId);
        setWeeklyGoals((prev) => prev.filter((w) => w.id !== existingId));
      } else {
        const updated = await weeklyGoalApi.update(existingId, {
          description,
          achieved: existing.achieved,
        });
        setWeeklyGoals((prev) =>
          prev.map((w) => (w.id === existingId ? (updated as WeeklyGoal) : w)),
        );
      }
    } else if (description) {
      // create
      const created = await weeklyGoalApi.create({ goalId, weekStart, description });
      setWeeklyGoals((prev) => [...prev, created as WeeklyGoal]);
    }
  }

  async function handleToggleAchieved(wg: WeeklyGoal) {
    const updated = await weeklyGoalApi.toggleAchieved(wg.id);
    setWeeklyGoals((prev) =>
      prev.map((w) => (w.id === wg.id ? (updated as WeeklyGoal) : w)),
    );
  }

  async function handleDelete(id: number) {
    await weeklyGoalApi.delete(id);
    setWeeklyGoals((prev) => prev.filter((w) => w.id !== id));
  }

  // build 7-day array
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(weekStart, i));

  const isCurrentWeek = weekStart === getWeekStart(todayStr);

  return (
    <div className="weekly-page">
      <header className="goals-header">
        <NavTabs />
        <UserMenu />
      </header>

      <div className="weekly-week-nav">
        <button className="weekly-nav-btn" onClick={prevWeek} type="button">
          ‹
        </button>
        <h2 className="weekly-week-label">
          {isCurrentWeek ? 'Ten tydzień · ' : ''}
          {formatWeekLabel(weekStart, weekEnd)}
        </h2>
        <button className="weekly-nav-btn" onClick={nextWeek} type="button">
          ›
        </button>
      </div>

      <div className="weekly-body">
        {/* Lewa kolumna — dni */}
        <section className="weekly-days-col">
          <h3 className="weekly-col-title">Dni</h3>
          <div className="weekly-days-list">
            {days.map((date) => (
              <DayCard
                key={date}
                date={date}
                isToday={date === todayStr}
                onClick={() => goToDay(date)}
              />
            ))}
          </div>
        </section>

        {/* Prawa kolumna — cele */}
        <section className="weekly-goals-col">
          <h3 className="weekly-col-title">Cele tygodniowe</h3>

          {loading ? (
            <div className="weekly-loading">Ładowanie...</div>
          ) : activeGoals.length === 0 ? (
            <p className="weekly-empty">
              Brak aktywnych celów.{' '}
              <button
                className="weekly-link-btn"
                type="button"
                onClick={() => navigate('/goals')}
              >
                Dodaj cele →
              </button>
            </p>
          ) : (
            <div className="weekly-goals-list">
              {activeGoals.map((goal) => {
                const wg = weeklyGoals.find((w) => w.goalId === goal.id) ?? null;
                return (
                  <GoalWeekCard
                    key={`${goal.id}-${wg?.id ?? 'none'}`}
                    goal={goal}
                    weeklyGoal={wg}
                    onSave={handleSave}
                    onToggleAchieved={handleToggleAchieved}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
