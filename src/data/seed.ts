import { newExercise, newPrescription, newTemplate } from "./templates";
import type { AppData } from "./types";

/** Starter templates. Placeholders to edit, not training advice. */
export function seedData(): AppData {
  const pullUps = newExercise("Pull Ups", "workout", "reps");

  return {
    exercises: [pullUps],
    templates: [
      newTemplate("climbing", "Volume Session", newPrescription("climbs", { name: "Volume Session" })),
      newTemplate("climbing", "Max Session", newPrescription("climbs", { name: "Max Session" })),
      newTemplate("climbing", "Climbing Session", newPrescription("stopwatch", { name: "Climbing Session" })),
      newTemplate("workout", "Strength Pull-Ups", {
        ...newPrescription("reps", { name: pullUps.name, exerciseId: pullUps.id }),
        sets: 4,
        reps: 6,
        restSeconds: 120,
      }),
      newTemplate("mobility", "Daily Mobility", newPrescription("time", { name: "Daily Mobility" })),
    ],
    sessions: [],
    journal: {},
  };
}
