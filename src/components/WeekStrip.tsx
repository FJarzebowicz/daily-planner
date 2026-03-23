/**
 * WeekStrip — kompaktowy pasek 7 dni tygodnia zawsze widoczny w plannerze.
 *
 * Umieszczony między NavTabs a głównym Headerem dnia.
 * Pozwala szybko przeskakiwać między dniami tygodnia bez opuszczania plannera.
 *
 * Wyświetla:
 *  - Skrócona nazwa dnia + numer
 *  - Cienki pasek postępu tasków (ładowany asynchronicznie per dzień)
 *  - Wyróżnienie dnia dzisiejszego i aktualnie wybranego dnia
 *  - Przycisk "CELE" do toggle'owania sidebara celów tygodniowych
 *  - Strzałki do poprzedniego/następnego tygodnia (jeśli currentDate jest poza bieżącym tygodniem)
 */

import { useState, useEffect } from 'react';
import { dayApi } from '../api';
import type { DayStatsResponse } from '../api';
import { formatDate, getWeekStart, shiftDate } from '../utils';

const WEEKDAY_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

interface Props {
  /** Aktualnie wyświetlany dzień w plannerze */
  currentDate: string;
  /** Nawiguje do innego dnia w plannerze */
  onNavigate: (date: string) => void;
  /** Czy sidebar celów tygodniowych jest otwarty */
  goalsOpen: boolean;
  /** Toggle sidebara celów tygodniowych */
  onToggleGoals: () => void;
}

export function WeekStrip({ currentDate, onNavigate, goalsOpen, onToggleGoals }: Props) {
  const todayStr = formatDate(new Date());

  /**
   * weekStart śledzi tydzień aktualnie wyświetlany w stripie.
   * Domyślnie = tydzień currentDate. Użytkownik może nawigować
   * do innych tygodni bez zmiany currentDate w plannerze.
   */
  const [stripWeekStart, setStripWeekStart] = useState(() => getWeekStart(currentDate));

  /** Mapa date → statystyki, null = w trakcie ładowania */
  const [stats, setStats] = useState<Record<string, DayStatsResponse | null>>({});

  // Gdy currentDate zmieni tydzień (np. nawigacja strzałkami w headerze),
  // automatycznie przewijamy strip do tego tygodnia
  useEffect(() => {
    const newWeekStart = getWeekStart(currentDate);
    setStripWeekStart(newWeekStart);
  }, [currentDate]);

  // Ładuj statystyki asynchronicznie dla każdego dnia w tygodniu
  useEffect(() => {
    setStats({});
    const days = Array.from({ length: 7 }, (_, i) => shiftDate(stripWeekStart, i));
    days.forEach(async (date) => {
      try {
        const s = await dayApi.stats(date);
        setStats((prev) => ({ ...prev, [date]: s }));
      } catch {
        setStats((prev) => ({ ...prev, [date]: { tasksDone: 0, tasksTotal: 0, mealsEaten: 0, mealsTotal: 0, productiveMinutes: 0, sleepMinutes: 0, thoughtsCount: 0 } }));
      }
    });
  }, [stripWeekStart]);

  const days = Array.from({ length: 7 }, (_, i) => shiftDate(stripWeekStart, i));

  return (
    <div className="week-strip">
      {/* Strzałka wstecz */}
      <button
        className="week-strip-nav"
        type="button"
        onClick={() => setStripWeekStart((ws) => shiftDate(ws, -7))}
        title="Poprzedni tydzień"
      >
        ‹
      </button>

      {/* 7 przycisków dni */}
      <div className="week-strip-days">
        {days.map((date) => {
          const d = new Date(date + 'T00:00:00');
          const dowIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
          const dayName = WEEKDAY_SHORT[dowIndex];
          const dayNum = d.getDate();
          const isToday = date === todayStr;
          const isSelected = date === currentDate;
          const s = stats[date] ?? null;
          const hasProgress = s !== null && s.tasksTotal > 0;
          const allDone = hasProgress && s!.tasksDone === s!.tasksTotal;
          const pct = hasProgress ? Math.round((s!.tasksDone / s!.tasksTotal) * 100) : 0;

          return (
            <button
              key={date}
              type="button"
              className={[
                'week-strip-day',
                isSelected ? 'week-strip-day--selected' : '',
                isToday ? 'week-strip-day--today' : '',
                allDone ? 'week-strip-day--done' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onNavigate(date)}
            >
              <span className="week-strip-day-name">{dayName}</span>
              <span className="week-strip-day-num">{dayNum}</span>
              {/* Mini pasek postępu */}
              {hasProgress && (
                <div className="week-strip-bar">
                  <div
                    className={`week-strip-bar-fill${allDone ? ' week-strip-bar-fill--done' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Strzałka do przodu */}
      <button
        className="week-strip-nav"
        type="button"
        onClick={() => setStripWeekStart((ws) => shiftDate(ws, 7))}
        title="Następny tydzień"
      >
        ›
      </button>

      {/* Toggle sidebara celów tygodniowych */}
      <button
        className={`week-strip-goals-btn${goalsOpen ? ' week-strip-goals-btn--active' : ''}`}
        type="button"
        onClick={onToggleGoals}
        title="Cele tygodniowe"
      >
        CELE
      </button>
    </div>
  );
}
