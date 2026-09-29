import type { Category, Measure } from "./types";

/**
 * In display order. `measures` are the options offered for a workout in that category; the first
 * is the default. Climbing is time on the wall; hangboard work is Fingers: repeaters (intervals),
 * max hangs (time) and weighted pick-ups (reps).
 */
export const CATEGORIES: { id: Category; label: string; measures: Measure[] }[] = [
  { id: "climbing", label: "Climbing", measures: ["climbs", "stopwatch"] },
  { id: "fingers", label: "Fingers", measures: ["intervals", "time", "reps"] },
  { id: "workout", label: "Workout", measures: ["reps", "time"] },
  { id: "mobility", label: "Mobility", measures: ["time", "reps"] },
];

export function categoryInfo(id: Category) {
  return CATEGORIES.find((c) => c.id === id)!;
}

export function defaultMeasure(category: Category) {
  return categoryInfo(category).measures[0];
}
