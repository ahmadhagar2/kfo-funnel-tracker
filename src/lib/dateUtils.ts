/** Returns today as YYYY-MM-DD */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns current time as HH:MM:SS */
export function nowTime(): string {
  return new Date().toLocaleTimeString('de-DE', { hour12: false });
}

/** Returns [monday, sunday] of the current week as YYYY-MM-DD */
export function weekRange(): [string, string] {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [fmt(monday), fmt(sunday)];
}

/** Returns [first, last] of the current month as YYYY-MM-DD */
export function monthRange(): [string, string] {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return [fmt(first), fmt(last)];
}

/** Previous week range */
export function prevWeekRange(): [string, string] {
  const [mon] = weekRange();
  const monday = new Date(mon);
  monday.setDate(monday.getDate() - 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [fmt(monday), fmt(sunday)];
}

/** Previous month range */
export function prevMonthRange(): [string, string] {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  return [fmt(first), fmt(last)];
}

/** Previous day */
export function prevDay(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fmt(d);
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns weekday index 0=Mon..6=Sun for a YYYY-MM-DD string */
export function weekdayIndex(dateStr: string): number {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

/** Returns [first, last] of a specific month as YYYY-MM-DD */
export function getMonthRange(year: number, month: number): [string, string] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const f = (d: Date) => d.toISOString().slice(0, 10);
  return [f(first), f(last)];
}
