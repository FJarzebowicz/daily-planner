/** Format date as YYYY-MM-DD using LOCAL timezone (not UTC!) */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD string as local date */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Shift a date string by N days, returning YYYY-MM-DD */
export function shiftDate(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function getPolishDayName(date: Date): string {
  const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
  return days[date.getDay()];
}

export function formatPolishDate(date: Date): string {
  const months = [
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Zwraca datę poniedziałku tygodnia dla podanej daty.
 *
 * Przykład: "2026-03-25" (środa) → "2026-03-23" (poniedziałek)
 *
 * @param dateStr data w formacie YYYY-MM-DD
 * @returns data poniedziałku w formacie YYYY-MM-DD
 */
export function getWeekStart(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const dow = d.getDay(); // 0=Nd, 1=Pon, ..., 6=Sob
  // Niedziela (0) cofa o 6 dni, pozostałe dni cofają do poniedziałku
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

/**
 * Zwraca datę niedzieli tygodnia dla podanej daty.
 *
 * Przykład: "2026-03-25" (środa) → "2026-03-29" (niedziela)
 *
 * @param dateStr data w formacie YYYY-MM-DD
 * @returns data niedzieli w formacie YYYY-MM-DD
 */
export function getWeekEnd(dateStr: string): string {
  const start = parseLocalDate(getWeekStart(dateStr));
  start.setDate(start.getDate() + 6);
  return formatDate(start);
}

export function generateTimeSlots(stepMinutes: number = 15): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
}

export function computeSleepMinutes(wake: string, sleep: string): number {
  const [wh, wm] = wake.split(':').map(Number);
  const [sh, sm] = sleep.split(':').map(Number);
  const wakeMin = wh * 60 + wm;
  const sleepMin = sh * 60 + sm;
  const awake = sleepMin >= wakeMin ? sleepMin - wakeMin : 1440 - wakeMin + sleepMin;
  return 1440 - awake;
}

export function formatMinutes(min: number): string {
  if (min <= 0) return '0min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
