import { newId, now } from "./ids";
import type { AppData, Exercise, WorkoutTemplate } from "./types";

/** Starter templates. Placeholders to edit, not training advice. */
export function seedData(): AppData {
  const ts = now();
  const pullUps: Exercise = {
    id: newId(),
    name: "Pull Ups",
    category: "workout",
    defaultMeasure: "reps",
    createdAt: ts,
    updatedAt: ts,
  };

  const template = (category: WorkoutTemplate["category"], name: string): WorkoutTemplate => ({
    id: newId(),
    category,
    name,
    exercises: [],
    createdAt: ts,
    updatedAt: ts,
  });

  const strength = template("workout", "Strength Pull-Ups");
  strength.exercises.push({
    id: newId(),
    position: 0,
    exerciseId: pullUps.id,
    name: pullUps.name,
    measure: "reps",
    sets: 4,
    reps: 6,
    restSeconds: 120,
  });

  return {
    exercises: [pullUps],
    templates: [
      template("climbing", "Volume Session"),
      template("climbing", "Max Session"),
      strength,
      template("mobility", "Daily Mobility"),
    ],
    sessions: [],
    journal: {},
  };
}
