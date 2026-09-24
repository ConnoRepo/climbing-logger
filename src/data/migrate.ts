import { withSingleExercise } from "./templates";
import type { AppData, Prescription, SetValues } from "./types";

/**
 * Upgrades saved data to the current shape. Pure, so the same code can run
 * against backend rows later. Sessions are history and are only rewritten
 * when a stored unit changes.
 */
export function migrate(data: AppData, fromVersion: number): AppData {
  let next = data;
  // v1 → v2: every workout is exactly one exercise.
  if (fromVersion < 2) next = { ...next, templates: next.templates.map(withSingleExercise) };
  // v2 → v3: weight is stored in pounds (weightKg → weightLb).
  if (fromVersion < 3) {
    next = {
      ...next,
      templates: next.templates.map((t) => ({ ...t, exercises: t.exercises.map(toPounds) })),
      sessions: next.sessions.map((s) => ({
        ...s,
        exercises: s.exercises.map((e) => ({
          ...e,
          prescription: toPounds(e.prescription),
          sets: e.sets.map((set) => ({ ...set, planned: toPounds(set.planned), actual: toPounds(set.actual) })),
        })),
      })),
    };
  }
  return next;
}

const LB_PER_KG = 2.20462;

function toPounds<T extends Prescription | SetValues>(values: T): T {
  const { weightKg, ...rest } = values as T & { weightKg?: number };
  if (weightKg === undefined) return values;
  return { ...rest, weightLb: Math.round(weightKg * LB_PER_KG) } as T;
}
