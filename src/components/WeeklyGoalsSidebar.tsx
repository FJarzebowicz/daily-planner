/**
 * WeeklyGoalsSidebar — panel celów tygodniowych zintegrowany z plannerem.
 *
 * Stały panel po prawej stronie (analogiczny do Backlog).
 * Otwierany przyciskiem "CELE" w WeekStrip.
 *
 * Dla każdego aktywnego celu pokazuje:
 *  - Nazwę celu
 *  - Textarea "co chcę osiągnąć w tym tygodniu" (auto-save on blur)
 *  - Przycisk "Przybliżyłem się?" (toggle achieved)
 *
 * Dane są ładowane przy otwarciu i przy zmianie tygodnia.
 */

import { useState, useEffect, useRef } from 'react';
import { goalApi, weeklyGoalApi } from '../api';
import type { GoalResponse } from '../api';
import type { WeeklyGoal } from '../types';

// ── GoalIntentionRow ──

/**
 * Pojedynczy wiersz celu w sidebarze.
 * Remountowany gdy zmienia się weeklyGoal.id (via key w rodzicu).
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
  open: boolean;
  onClose: () => void;
  /** Data poniedziałku aktualnie wyświetlanego tygodnia w plannerze */
  weekStart: string;
}

export function WeeklyGoalsSidebar({ open, onClose, weekStart }: Props) {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(false);

  /** Ładuje aktywne cele i cele tygodniowe dla bieżącego tygodnia */
  useEffect(() => {
    if (!open) return;
    setLoading(true);

    goalApi.getAll('ACTIVE')
      .then(setGoals)
      .catch(() => setGoals([]));

    weeklyGoalApi.getByWeek(weekStart)
      .then((wgs) => setWeeklyGoals(wgs as WeeklyGoal[]))
      .catch(() => setWeeklyGoals([]))
      .finally(() => setLoading(false));
  }, [open, weekStart]);

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

  return (
    <>
      {/* Overlay na mobile — kliknięcie zamyka */}
      {open && <div className="wgs-overlay" onClick={onClose} />}

      <aside className={`wgs-panel${open ? ' wgs-panel--open' : ''}`}>
        <div className="wgs-header">
          <span className="wgs-title">CELE TYGODNIOWE</span>
          <button className="wgs-close" type="button" onClick={onClose}>×</button>
        </div>

        <div className="wgs-body">
          {loading ? (
            <div className="wgs-loading">Ładowanie...</div>
          ) : goals.length === 0 ? (
            <p className="wgs-empty">Brak aktywnych celów.</p>
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
    </>
  );
}
