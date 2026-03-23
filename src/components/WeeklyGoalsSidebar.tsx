/**
 * WeeklyGoalsSidebar — kolumna celów tygodniowych zawsze widoczna po prawej stronie plannera.
 *
 * Wyświetla aktywne cele z możliwością:
 *  - Zapisania "co chcę osiągnąć w tym tygodniu" (auto-save on blur)
 *  - Oznaczenia czy w tym tygodniu udało się przybliżyć do celu
 *
 * Dane są ładowane przy montowaniu i przy zmianie tygodnia.
 */

import { useState, useEffect, useRef } from 'react';
import { goalApi, weeklyGoalApi } from '../api';
import type { GoalResponse } from '../api';
import type { WeeklyGoal } from '../types';

// ── GoalIntentionRow ──

/**
 * Pojedynczy wiersz celu w panelu.
 * key={`${goal.id}-${wg?.id ?? 'none'}`} w rodzicu wymusza remount przy zmianie weeklyGoal,
 * dzięki czemu useState(weeklyGoal?.description) inicjalizuje się poprawnie.
 */
function GoalIntentionRow({
  goal,
  weeklyGoal,
  onSave,
  onToggleAchieved,
}: {
  goal: GoalResponse;
  weeklyGoal: WeeklyGoal | null;
  onSave: (goalId: number, text: string, existingId?: number) => Promise<void>;
  onToggleAchieved: (wg: WeeklyGoal) => Promise<void>;
}) {
  const [text, setText] = useState(weeklyGoal?.description ?? '');
  const [saving, setSaving] = useState(false);
  const lastRef = useRef(weeklyGoal?.description ?? '');

  async function handleBlur() {
    const trimmed = text.trim();
    if (trimmed === lastRef.current) return;
    if (!trimmed && !weeklyGoal) return;
    setSaving(true);
    await onSave(goal.id, trimmed, weeklyGoal?.id);
    lastRef.current = trimmed;
    setSaving(false);
  }

  const achieved = weeklyGoal?.achieved ?? false;

  return (
    <div className={`wgs-goal${achieved ? ' wgs-goal--achieved' : ''}`}>
      <div className="wgs-goal-header">
        <span className="wgs-goal-name">{goal.name}</span>
        {achieved && <span className="wgs-goal-check">✓</span>}
      </div>

      <textarea
        className="wgs-goal-textarea"
        placeholder="Co w tym tygodniu..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        rows={2}
      />

      {saving && <span className="wgs-saving">Zapisywanie...</span>}

      {weeklyGoal && (
        <button
          className={`wgs-achieved-btn${achieved ? ' wgs-achieved-btn--on' : ''}`}
          type="button"
          onClick={() => onToggleAchieved(weeklyGoal)}
        >
          {achieved ? '✓ Przybliżyłem się!' : '○ Przybliżyłem się?'}
        </button>
      )}
    </div>
  );
}

// ── WeeklyGoalsSidebar ──

interface Props {
  /** Data poniedziałku aktualnie wyświetlanego tygodnia */
  weekStart: string;
  /**
   * Opcjonalna lista celów tygodniowych z zewnątrz (np. z App.tsx).
   * Jeśli podana, komponent używa jej jako punkt startowy i aktualizuje lokalnie.
   */
  externalWeeklyGoals?: WeeklyGoal[];
  /**
   * Callback wywoływany gdy lista weeklyGoals się zmieni — pozwala App.tsx
   * zsynchronizować swój stan (np. do pokazania nazwy celu na taskach).
   */
  onWeeklyGoalsChange?: (wgs: WeeklyGoal[]) => void;
}

export function WeeklyGoalsSidebar({ weekStart, externalWeeklyGoals, onWeeklyGoalsChange }: Props) {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>(externalWeeklyGoals ?? []);
  const [loading, setLoading] = useState(true);

  /** Ładuje aktywne cele i cele tygodniowe; graceful — każda gałąź niezależna */
  useEffect(() => {
    let active = true;

    Promise.all([
      goalApi.getAll('ACTIVE').catch(() => [] as GoalResponse[]),
      weeklyGoalApi.getByWeek(weekStart).catch(() => [] as WeeklyGoal[]),
    ]).then(([fetchedGoals, fetchedWgs]) => {
      if (!active) return;
      setGoals(fetchedGoals);
      const cast = fetchedWgs as WeeklyGoal[];
      setWeeklyGoals(cast);
      onWeeklyGoalsChange?.(cast);
      setLoading(false);
    });

    return () => { active = false; };
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateLocalWeeklyGoals(updated: WeeklyGoal[]) {
    setWeeklyGoals(updated);
    onWeeklyGoalsChange?.(updated);
  }

  async function handleSave(goalId: number, description: string, existingId?: number) {
    if (existingId) {
      const existing = weeklyGoals.find((w) => w.id === existingId);
      if (!existing) return;
      if (!description) {
        await weeklyGoalApi.delete(existingId);
        updateLocalWeeklyGoals(weeklyGoals.filter((w) => w.id !== existingId));
      } else {
        const updated = await weeklyGoalApi.update(existingId, { description, achieved: existing.achieved });
        updateLocalWeeklyGoals(weeklyGoals.map((w) => (w.id === existingId ? (updated as WeeklyGoal) : w)));
      }
    } else if (description) {
      const created = await weeklyGoalApi.create({ goalId, weekStart, description });
      updateLocalWeeklyGoals([...weeklyGoals, created as WeeklyGoal]);
    }
  }

  async function handleToggleAchieved(wg: WeeklyGoal) {
    const updated = await weeklyGoalApi.toggleAchieved(wg.id);
    updateLocalWeeklyGoals(weeklyGoals.map((w) => (w.id === wg.id ? (updated as WeeklyGoal) : w)));
  }

  return (
    <aside className="wgs-column">
      <div className="wgs-header">
        <span className="wgs-title">CELE TYGODNIOWE</span>
      </div>

      <div className="wgs-body">
        {loading ? (
          <div className="wgs-loading">Ładowanie...</div>
        ) : goals.length === 0 ? (
          <p className="wgs-empty">Brak aktywnych celów.<br />Dodaj cele na stronie Cele.</p>
        ) : (
          goals.map((goal) => {
            const wg = weeklyGoals.find((w) => w.goalId === goal.id) ?? null;
            return (
              <GoalIntentionRow
                key={`${goal.id}-${wg?.id ?? 'none'}`}
                goal={goal}
                weeklyGoal={wg}
                onSave={handleSave}
                onToggleAchieved={handleToggleAchieved}
              />
            );
          })
        )}
      </div>
    </aside>
  );
}
