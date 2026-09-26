import { toKey, type DateKey } from "@/lib/dates";

import type { Session, SetLog } from "./types";

/** One day on a history graph: lb for weight, minutes for a stopwatch session's length. */
export type HistoryPoint = { date: DateKey; value: number };

/** The sessions of one workout that are on a day, with their checked-off sets. */
function doneSetsByDay(sessions: Session[], templateId: string) {
  const days: { date: DateKey; sets: SetLog[] }[] = [];
  for (const s of sessions) {
    if (s.templateId !== templateId || s.date === null) continue;
    const done = s.exercises.flatMap((e) => e.sets).filter((set) => set.done);
    if (done.length > 0) days.push({ date: s.date, sets: done });
  }
  return days;
}

function toPoints(byDate: Map<DateKey, number>): HistoryPoint[] {
  return [...byDate].map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * One point per day a workout was done: the heaviest set that was checked off.
 * A set with no weight counts as bodyweight (0). Pure, so it can run against
 * backend rows later.
 */
export function weightHistory(sessions: Session[], templateId: string): HistoryPoint[] {
  const byDate = new Map<DateKey, number>();
  for (const { date, sets } of doneSetsByDay(sessions, templateId)) {
    const heaviest = Math.max(...sets.map((set) => set.actual.weightLb ?? 0));
    byDate.set(date, Math.max(heaviest, byDate.get(date) ?? -Infinity));
  }
  return toPoints(byDate);
}

/** One point per day a stopwatch workout was finished: its minutes, added up if it was done twice. */
export function durationHistory(sessions: Session[], templateId: string): HistoryPoint[] {
  const byDate = new Map<DateKey, number>();
  for (const { date, sets } of doneSetsByDay(sessions, templateId)) {
    const minutes = sets.reduce((sum, set) => sum + (set.actual.seconds ?? 0), 0) / 60;
    if (minutes > 0) byDate.set(date, (byDate.get(date) ?? 0) + minutes);
  }
  return toPoints(byDate);
}

/** Dev builds only: mixes made-up points into every graph for testing. Set to false to turn off. */
export const SHOW_FAKE_POINTS = __DEV__;

export const FAKE_WEIGHTS = [0, 5, 5, 10, 15, 10, 20, 25];
export const FAKE_MINUTES = [45, 60, 50, 75, 90, 70, 105, 95];
const FAKE_SPACING_DAYS = 3;

/** `values` spread over the past ~3 weeks, ending three days ago. Never saved. */
export function withFakePoints(real: HistoryPoint[], values: number[]): HistoryPoint[] {
  const today = new Date();
  const fake = values.map((value, i) => {
    const daysAgo = 3 + (values.length - 1 - i) * FAKE_SPACING_DAYS;
    const date = toKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo));
    return { date, value };
  });
  // A real point wins over a fake one on the same day.
  const realDates = new Set(real.map((p) => p.date));
  return [...fake.filter((p) => !realDates.has(p.date)), ...real].sort((a, b) => a.date.localeCompare(b.date));
}
