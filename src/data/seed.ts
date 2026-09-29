import { repeatSet } from "./measures";
import { newPrescription, newTemplate } from "./templates";
import type { AppData } from "./types";

/** Starter templates. Placeholders to edit, not training advice. */
export function seedData(): AppData {
  return {
    templates: [
      newTemplate("climbing", "Volume Session", newPrescription("climbs")),
      newTemplate("climbing", "Max Session", newPrescription("climbs")),
      newTemplate("climbing", "Climbing Session", newPrescription("stopwatch")),
      newTemplate("fingers", "Repeaters", newPrescription("intervals")),
      newTemplate("workout", "Strength Pull-Ups", {
        ...newPrescription("reps"),
        sets: repeatSet(4, { reps: 6 }),
        restSeconds: 120,
      }),
      newTemplate("mobility", "Daily Mobility", newPrescription("time")),
    ],
    sessions: [],
    journal: [],
  };
}
