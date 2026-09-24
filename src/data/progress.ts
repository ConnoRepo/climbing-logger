import { toKey, type DateKey } from "@/lib/dates";

import type { Session } from "./types";

export type WeightPoint = { date: DateKey; weightLb: number };

/**
 * One point per day a workout was done: the heaviest set that was checked off.
 * A set with no weight counts as bodyweight (0). Pure, so it can run against
 * backend rows later.
 */
export function weightHistory(sessions: Session[], templateId: string): WeightPoint[] {
  const byDate = new Map<DateKey, number>();
  for (const s of sessions) {
    if (s.templateId !== templateId) continue;
    const done = s.exercises.flatMap((e) => e.sets).filter((set) => set.done);
    if (done.length === 0) continue;
    const heaviest = Math.max(...done.map((set) => set.actual.weightLb ?? 0));
    byDate.set(s.date, Math.max(heaviest, byDate.get(s.date) ?? -Infinity));
  }
  return [...byDate]
    .map(([date, weightLb]) => ({ date, weightLb }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Dev builds only: mixes made-up points into every graph for testing. Set to false to turn off. */
export const SHOW_FAKE_POINTS = __DEV__;

const FAKE_WEIGHTS = [0, 5, 5, 10, 15, 10, 20, 25];
const FAKE_SPACING_DAYS = 3;

/** A slow climb in weight over the past ~3 weeks, ending three days ago. Never saved. */
export function withFakePoints(real: WeightPoint[]): WeightPoint[] {
  const today = new Date();
  const fake = FAKE_WEIGHTS.map((weightLb, i) => {
    const daysAgo = 3 + (FAKE_WEIGHTS.length - 1 - i) * FAKE_SPACING_DAYS;
    const date = toKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo));
    return { date, weightLb };
  });
  // A real point wins over a fake one on the same day.
  const realDates = new Set(real.map((p) => p.date));
  return [...fake.filter((p) => !realDates.has(p.date)), ...real].sort((a, b) => a.date.localeCompare(b.date));
}
