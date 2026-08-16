// Pure date-math + period-selection types used by the dashboard UI and the
// IndexedDB aggregation queries — no storage access here.

export type QuickPeriod = "week" | "month" | "all";

export interface CustomPeriod {
  year: number;
  month?: number; // 1-12
  week?: string; // Monday of the week, "YYYY-MM-DD"
}

export type PeriodSelection = { kind: "quick"; value: QuickPeriod } | { kind: "custom"; value: CustomPeriod };

/**
 * All date math anchors to UTC-midnight Date objects built from the local
 * Y/M/D (so "today" matches the user's wall-clock day), then only ever uses
 * UTC getters/setters from there on, to stay DST-safe.
 */
export function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function parseDateUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Monday of the week containing `date` (weeks start Monday, per spec). */
export function mondayOfWeekUTC(date: Date): Date {
  const day = date.getUTCDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  return addDaysUTC(date, diff);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Inclusive [start, end] date-string range for a custom period. */
export function resolveCustomRange(c: CustomPeriod): { start: string; end: string } {
  if (c.week) {
    const monday = parseDateUTC(c.week);
    return { start: formatDateUTC(monday), end: formatDateUTC(addDaysUTC(monday, 6)) };
  }
  if (c.month) {
    const start = new Date(Date.UTC(c.year, c.month - 1, 1));
    const end = new Date(Date.UTC(c.year, c.month - 1, daysInMonth(c.year, c.month)));
    return { start: formatDateUTC(start), end: formatDateUTC(end) };
  }
  return { start: `${c.year}-01-01`, end: `${c.year}-12-31` };
}

/** Monday-start weeks touching [year, month] — including leading/trailing partial weeks. */
export function weeksInMonth(year: number, month: number): string[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const lastOfMonth = new Date(Date.UTC(year, month - 1, daysInMonth(year, month)));
  const weeks: string[] = [];
  let cursor = mondayOfWeekUTC(firstOfMonth);
  while (cursor <= lastOfMonth) {
    weeks.push(formatDateUTC(cursor));
    cursor = addDaysUTC(cursor, 7);
  }
  return weeks;
}

/** Monday-start weeks touching the given year. */
export function weeksInYear(year: number): string[] {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));
  const weeks: string[] = [];
  let cursor = mondayOfWeekUTC(jan1);
  while (cursor <= dec31) {
    weeks.push(formatDateUTC(cursor));
    cursor = addDaysUTC(cursor, 7);
  }
  return weeks;
}
