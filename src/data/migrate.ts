import { withSingleExercise } from "./templates";
import type { AppData, Prescription, Session, SetValues } from "./types";

/**
 * Upgrades saved data to the current shape. Pure, so the same code can run
 * against backend rows later. Sessions are history and are only rewritten
 * when a stored unit or meaning changes.
 */
export function migrate(data: AppData, fromVersion: number): AppData {
  let next = data;
  // v1 → v2: every workout is exactly one exercise.
  if (fromVersion < 2) next = { ...next, templates: next.templates.map(withSingleExercise) };
  // v2 → v3: weight is stored in pounds (weightKg → weightLb).
  // (v3 also allows session.date === null for unscheduled workouts; old data needs no rewrite.)
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
  // v3 → v4: sessions carry their order within a day, starting from how they were saved.
  if (fromVersion < 4) {
    const counts = new Map<string | null, number>();
    next = {
      ...next,
      sessions: next.sessions.map((s): Session => {
        const position = counts.get(s.date) ?? 0;
        counts.set(s.date, position + 1);
        return { ...s, position };
      }),
    };
  }
  // v4 → v5: timed sets count reps (repeaters: 6 × 7s). Ones saved before were a single hold.
  if (fromVersion < 5) {
    next = {
      ...next,
      templates: next.templates.map((t) => ({ ...t, exercises: t.exercises.map(oneRep) })),
      sessions: next.sessions.map((s) => ({
        ...s,
        exercises: s.exercises.map((e) =>
          e.prescription.measure !== "time"
            ? e
            : {
                ...e,
                prescription: oneRep(e.prescription),
                sets: e.sets.map((set) => ({ ...set, actual: { reps: 1, ...set.actual } })),
              },
        ),
      })),
    };
  }
  return next;
}

function oneRep(p: Prescription): Prescription {
  return p.measure === "time" && p.reps === undefined ? { ...p, reps: 1 } : p;
}

const LB_PER_KG = 2.20462;

function toPounds<T extends Prescription | SetValues>(values: T): T {
  const { weightKg, ...rest } = values as T & { weightKg?: number };
  if (weightKg === undefined) return values;
  return { ...rest, weightLb: Math.round(weightKg * LB_PER_KG) } as T;
}
