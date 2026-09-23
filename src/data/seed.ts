import { newId, now } from "./ids";
import { newPrescription } from "./templates";
import type { AppData, Exercise, Prescription, WorkoutTemplate } from "./types";

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

  const template = (category: WorkoutTemplate["category"], name: string, exercise: Prescription): WorkoutTemplate => ({
    id: newId(),
    category,
    name,
    exercises: [exercise],
    createdAt: ts,
    updatedAt: ts,
  });

  return {
    exercises: [pullUps],
    templates: [
      template("climbing", "Volume Session", newPrescription("climbs", { name: "Volume Session" })),
      template("climbing", "Max Session", newPrescription("climbs", { name: "Max Session" })),
      template("workout", "Strength Pull-Ups", {
        ...newPrescription("reps", { name: pullUps.name, exerciseId: pullUps.id }),
        sets: 4,
        reps: 6,
        restSeconds: 120,
      }),
      template("mobility", "Daily Mobility", newPrescription("time", { name: "Daily Mobility" })),
    ],
    sessions: [],
    journal: {},
  };
}
