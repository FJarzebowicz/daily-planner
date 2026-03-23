/**
 * WeeklyPage — widok tygodniowy daily plannera.
 *
 * Strona dostępna pod /week. Składa się z dwóch kolumn:
 *  - Lewa: 7 kart dni (Pon–Nd) ze statystykami tasków, każda klikalna
 *    → przejście do plannera danego dnia (?date=YYYY-MM-DD)
 *  - Prawa: lista aktywnych celów (Goal) z możliwością wpisania celu tygodniowego
 *    (WeeklyGoal) dla każdego z nich + odhaczenia czy tydzień był sukcesem.
 *
 * Hierarchia danych:
 *   Goal (długoterminowy) → WeeklyGoal (tygodniowy odcinek) → Task (przez weeklyGoalId)
 *
 * WAŻNE — odporność na brakujący backend:
 *   Ładowanie celów (goalApi) i celów tygodniowych (weeklyGoalApi) jest rozdzielone.
 *   Jeśli endpoint /weekly-goals jeszcze nie istnieje, aktywne cele nadal się wyświetlają.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { goalApi, weeklyGoalApi, dayApi } from '../api';
import type { GoalResponse, DayStatsResponse } from '../api';
import type { WeeklyGoal } from '../types';
import { NavTabs } from '../components/NavTabs';
import { UserMenu } from '../components/UserMenu';
import { formatDate, getWeekStart, getWeekEnd, shiftDate } from '../utils';

// ── Stałe ──

/** Polskie nazwy miesięcy w dopełniaczu */
const POLISH_MONTHS = [
  'Stycznia', 'Lutego', 'Marca', 'Kwietnia', 'Maja', 'Czerwca',
  'Lipca', 'Sierpnia', 'Września', 'Października', 'Listopada', 'Grudnia',
];

/** Skrócone nazwy dni tygodnia (indeks 0 = Poniedziałek) */
const WEEKDAY_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

// ── Helpers ──

/**
 * Formatuje zakres tygodnia jako czytelną etykietę.
 * - Ten sam miesiąc: "23–29 Marca 2026"
 * - Różne miesiące: "30 Marca – 5 Kwietnia 2026"
 */
function formatWeekLabel(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart + 'T00:00:00');
  const e = new Date(weekEnd + 'T00:00:00');
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${POLISH_MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  }
  return `${s.getDate()} ${POLISH_MONTHS[s.getMonth()]} – ${e.getDate()} ${POLISH_MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

// ── DayCard ──

/**
 * Karta pojedynczego dnia w lewej kolumnie widoku tygodniowego.
 *
 * Pokazuje:
 *  - Skróconą nazwę dnia (Pon, Wt...)
 *  - Numer dnia
 *  - Statystyki tasków (X / Y) gdy stats dostępne
 *  - Pasek postępu tasków
 *  - Wyróżnienie dnia dzisiejszego
 *
 * Kliknięcie nawiguje do plannera danego dnia (?date=YYYY-MM-DD).
 */
function DayCard({
  date,
  isToday,
  stats,
  onClick,
}: {
  date: string;
  isToday: boolean;
  /** Statystyki dnia z backendu, null gdy jeszcze się ładują lub brak danych */
  stats: DayStatsResponse | null;
  onClick: () => void;
}) {
  const d = new Date(date + 'T00:00:00');
  const dowIndex = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Pon
  const dayName = WEEKDAY_SHORT[dowIndex];
  const dayNum = d.getDate();

  const hasStats = stats !== null && stats.tasksTotal > 0;
  const allDone = hasStats && stats!.tasksDone === stats!.tasksTotal;
  const progressPct = hasStats ? Math.round((stats!.tasksDone / stats!.tasksTotal) * 100) : 0;

  return (
    <button
      className={`weekly-day-card${isToday ? ' weekly-day-card--today' : ''}${allDone ? ' weekly-day-card--done' : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className="weekly-day-top">
        <span className="weekly-day-name">{dayName}</span>
        <span className="weekly-day-num">{dayNum}</span>
        {isToday && <span className="weekly-day-today-dot" />}
      </div>

      {/* Statystyki tasków — widoczne gdy dzień ma taski */}
      {hasStats && (
        <div className="weekly-day-stats">
          <span className="weekly-day-count">
            {stats!.tasksDone}/{stats!.tasksTotal}
          </span>
          {/* Pasek postępu */}
          <div className="weekly-day-progress">
            <div
              className={`weekly-day-progress-fill${allDone ? ' weekly-day-progress-fill--done' : ''}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Pusty dzień — subtelna etykieta */}
      {stats !== null && stats.tasksTotal === 0 && (
        <span className="weekly-day-empty-label">brak tasków</span>
      )}
    </button>
  );
}

// ── GoalWeekCard ──

/**
 * Karta celu tygodniowego w prawej kolumnie.
 *
 * Dla każdego aktywnego celu (Goal) pokazuje:
 *  - Nazwę celu
 *  - Textarea do wpisania zamiaru na ten tydzień (auto-save on blur)
 *  - Przycisk "Przybliżyłem się?" do odhaczenia sukcesu tygodnia
 *  - Przycisk × do usunięcia celu tygodniowego
 *
 * Komponent jest remountowany gdy zmienia się weeklyGoal.id (via key prop w rodzicu),
 * co zapewnia poprawne zainicjowanie stanu przy nawigacji między tygodniami.
 */
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
  // Ref przechowuje ostatnio zapisany tekst — zapobiega zbędnym wywołaniom API
  const lastSavedRef = useRef(weeklyGoal?.description ?? '');

  /**
   * Wywoływany po utracie focusu przez textarea.
   * Porównuje z lastSavedRef — wysyła request tylko gdy tekst się zmienił.
   * Pusty tekst + istniejący rekord → delete (obsługiwany w handleSave rodzica).
   */
  async function handleBlur() {
    const trimmed = text.trim();
    if (trimmed === lastSavedRef.current) return;
    if (!trimmed && !weeklyGoal) return;
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

/**
 * Główny komponent widoku tygodniowego.
 *
 * Stan:
 *  - weekStart: data poniedziałku aktualnie wyświetlanego tygodnia
 *  - activeGoals: lista aktywnych celów
 *  - weeklyGoals: cele tygodniowe dla aktualnego tygodnia
 *  - dayStats: mapa date → DayStatsResponse (statystyki tasków per dzień)
 *
 * Ładowanie jest podzielone na dwie niezależne ścieżki:
 *  1. goalApi.getAll('ACTIVE') — zawsze wymagane, blokuje loading
 *  2. weeklyGoalApi.getByWeek() + dayApi.stats() per dzień — opcjonalne,
 *     błąd nie przerywa renderowania (backend może nie mieć tych endpointów)
 */
export function WeeklyPage() {
  const navigate = useNavigate();
  const todayStr = formatDate(new Date());

  const [weekStart, setWeekStart] = useState(() => getWeekStart(todayStr));
  const weekEnd = getWeekEnd(weekStart);

  const [activeGoals, setActiveGoals] = useState<GoalResponse[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  /** Mapa date string → statystyki dnia. null = jeszcze się ładuje. */
  const [dayStats, setDayStats] = useState<Record<string, DayStatsResponse | null>>({});
  const [loading, setLoading] = useState(true);

  /** Generujemy tablicę 7 dat (Pon–Nd) dla aktualnego tygodnia */
  const days = Array.from({ length: 7 }, (_, i) => shiftDate(weekStart, i));

  /**
   * Ładuje dane dla tygodnia.
   *
   * Cele (goalApi) — krytyczne: failure = pokazujemy błąd w konsoli, goals = [].
   * WeeklyGoals — opcjonalne: failure = cicha obsługa, weeklyGoals = [].
   * DayStats — opcjonalne per dzień: każdy dzień niezależnie, failure = null w mapie.
   */
  const loadData = useCallback(async (ws: string, weekDays: string[]) => {
    setLoading(true);
    setDayStats({});

    // 1. Krytyczne: aktywne cele
    try {
      const goals = await goalApi.getAll('ACTIVE');
      setActiveGoals(goals);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setActiveGoals([]);
    }

    // 2. Opcjonalne: cele tygodniowe (backend może jeszcze nie mieć endpointu)
    try {
      const wgs = await weeklyGoalApi.getByWeek(ws);
      setWeeklyGoals(wgs as WeeklyGoal[]);
    } catch {
      // endpoint /weekly-goals może nie istnieć — nie blokujemy UI
      setWeeklyGoals([]);
    }

    setLoading(false);

    // 3. Opcjonalne: statystyki dni — ładowane w tle po pokazaniu UI
    weekDays.forEach(async (date) => {
      try {
        const stats = await dayApi.stats(date);
        setDayStats((prev) => ({ ...prev, [date]: stats }));
      } catch {
        // dzień może nie istnieć jeszcze w bazie
        setDayStats((prev) => ({ ...prev, [date]: { tasksDone: 0, tasksTotal: 0, mealsEaten: 0, mealsTotal: 0, productiveMinutes: 0, sleepMinutes: 0, thoughtsCount: 0 } }));
      }
    });
  }, []);

  useEffect(() => {
    loadData(weekStart, days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, loadData]);

  function prevWeek() {
    setWeekStart((ws) => shiftDate(ws, -7));
  }

  function nextWeek() {
    setWeekStart((ws) => shiftDate(ws, 7));
  }

  /**
   * Nawiguje do plannera dziennego dla wskazanej daty.
   * App.tsx odczytuje ?date= przy inicjalizacji currentDate.
   */
  function goToDay(date: string) {
    navigate(`/?date=${date}`);
  }

  /**
   * Obsługuje zapis (create/update/delete) celu tygodniowego.
   * - existingId + opis → update
   * - existingId + pusty opis → delete
   * - brak existingId + opis → create
   */
  async function handleSave(goalId: number, description: string, existingId?: number) {
    if (existingId) {
      const existing = weeklyGoals.find((w) => w.id === existingId);
      if (!existing) return;
      if (!description) {
        await weeklyGoalApi.delete(existingId);
        setWeeklyGoals((prev) => prev.filter((w) => w.id !== existingId));
      } else {
        const updated = await weeklyGoalApi.update(existingId, { description, achieved: existing.achieved });
        setWeeklyGoals((prev) => prev.map((w) => (w.id === existingId ? (updated as WeeklyGoal) : w)));
      }
    } else if (description) {
      const created = await weeklyGoalApi.create({ goalId, weekStart, description });
      setWeeklyGoals((prev) => [...prev, created as WeeklyGoal]);
    }
  }

  async function handleToggleAchieved(wg: WeeklyGoal) {
    const updated = await weeklyGoalApi.toggleAchieved(wg.id);
    setWeeklyGoals((prev) => prev.map((w) => (w.id === wg.id ? (updated as WeeklyGoal) : w)));
  }

  async function handleDelete(id: number) {
    await weeklyGoalApi.delete(id);
    setWeeklyGoals((prev) => prev.filter((w) => w.id !== id));
  }

  const isCurrentWeek = weekStart === getWeekStart(todayStr);

  return (
    <div className="weekly-page">
      <header className="goals-header">
        <NavTabs />
        <UserMenu />
      </header>

      {/* Nawigacja między tygodniami */}
      <div className="weekly-week-nav">
        <button className="weekly-nav-btn" onClick={prevWeek} type="button">‹</button>
        <h2 className="weekly-week-label">
          {isCurrentWeek ? 'Ten tydzień · ' : ''}
          {formatWeekLabel(weekStart, weekEnd)}
        </h2>
        <button className="weekly-nav-btn" onClick={nextWeek} type="button">›</button>
      </div>

      {/* Dwukolumnowy layout: dni | cele */}
      <div className="weekly-body">

        {/* Lewa kolumna — 7 kart dni ze statystykami */}
        <section className="weekly-days-col">
          <h3 className="weekly-col-title">Dni</h3>
          <div className="weekly-days-list">
            {days.map((date) => (
              <DayCard
                key={date}
                date={date}
                isToday={date === todayStr}
                stats={dayStats[date] ?? null}
                onClick={() => goToDay(date)}
              />
            ))}
          </div>
        </section>

        {/* Prawa kolumna — cele tygodniowe */}
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
