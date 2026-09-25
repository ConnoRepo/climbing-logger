const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Local-time YYYY-MM-DD, used as the key for everything logged on a day. */
export type DateKey = string;

export function toKey(date: Date): DateKey {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/** "Monday, 2nd" */
export function formatDayHeader(key: DateKey) {
  const date = fromKey(key);
  return `${WEEKDAYS[date.getDay()]}, ${ordinal(date.getDate())}`;
}

/** The day `days` after `key` (negative for before). */
export function addDays(key: DateKey, days: number): DateKey {
  const date = fromKey(key);
  return toKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

/** Whole days from `from` to `to`. */
export function daysBetween(from: DateKey, to: DateKey) {
  return Math.round((fromKey(to).getTime() - fromKey(from).getTime()) / 86_400_000);
}

/** "Mar 2", for chart axes. */
export function formatAxisDate(key: DateKey) {
  const date = fromKey(key);
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** "Mar, 2nd" */
export function formatShortDate(key: DateKey) {
  const date = fromKey(key);
  return `${MONTHS[date.getMonth()]}, ${ordinal(date.getDate())}`;
}

/** The Sunday-to-Saturday week containing `key`. */
export function weekOf(key: DateKey): DateKey[] {
  const date = fromKey(key);
  const sundayOffset = date.getDay();
  return Array.from({ length: 7 }, (_, i) =>
    toKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - sundayOffset + i)),
  );
}

/** One letter per day, Sunday first: the week view's day markers. */
export const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/** "Sunday" */
export function weekdayName(key: DateKey) {
  return WEEKDAYS[fromKey(key).getDay()];
}

/** "Sep 20 – 26", or "Sep 27 – Oct 3" when the week crosses a month. */
export function formatWeekRange(week: DateKey[]) {
  const [first, last] = [fromKey(week[0]), fromKey(week[week.length - 1])];
  const end = first.getMonth() === last.getMonth() ? `${last.getDate()}` : `${MONTHS[last.getMonth()]} ${last.getDate()}`;
  return `${MONTHS[first.getMonth()]} ${first.getDate()} – ${end}`;
}
