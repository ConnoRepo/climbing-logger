import { MEASURES, defaultMeasure } from "./categories";
import { newId } from "./ids";
import type { Category, Measure, Prescription, WorkoutTemplate } from "./types";

/** A fresh exercise line with the measure's sensible defaults. */
export function newPrescription(
  measure: Measure,
  { name = "", exerciseId = null }: { name?: string; exerciseId?: string | null } = {},
): Prescription {
  return { sets: 1, ...MEASURES[measure].defaults, id: newId(), position: 0, exerciseId, name, measure };
}

/** Each workout is exactly one exercise; this is it (undefined only for malformed data). */
export function templateExercise(t: WorkoutTemplate): Prescription | undefined {
  return t.exercises[0];
}

/** Gives a template exactly one exercise, named after the workout. */
export function withSingleExercise(t: WorkoutTemplate): WorkoutTemplate {
  const [first] = t.exercises;
  const exercise = first ?? newPrescription(defaultMeasure(t.category as Category), { name: t.name });
  return t.exercises.length === 1 ? t : { ...t, exercises: [{ ...exercise, position: 0 }] };
}
