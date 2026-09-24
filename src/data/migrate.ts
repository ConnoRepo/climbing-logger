import { withSingleExercise } from "./templates";
import type { AppData } from "./types";

/**
 * Upgrades saved data to the current shape. Pure, so the same code can run
 * against backend rows later. Sessions are history and are never rewritten.
 */
export function migrate(data: AppData, fromVersion: number): AppData {
  let next = data;
  // v1 → v2: every workout is exactly one exercise.
  if (fromVersion < 2) next = { ...next, templates: next.templates.map(withSingleExercise) };
  return next;
}
