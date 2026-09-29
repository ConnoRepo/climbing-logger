import { newId, now } from "./ids";
import { MEASURES } from "./measures";
import type { Category, Measure, Prescription, WorkoutTemplate } from "./types";

/** A fresh plan with the measure's sensible defaults. */
export function newPrescription(measure: Measure): Prescription {
  return { measure, ...MEASURES[measure].defaults };
}

export function newTemplate(category: Category, name: string, prescription: Prescription, id = newId()): WorkoutTemplate {
  const ts = now();
  return { id, name, category, prescription, deletedAt: null, createdAt: ts, updatedAt: ts };
}

/** Lowercase, without spaces or punctuation (iOS types curly quotes), so "pullups" finds "Pull-Ups". */
function normalize(text: string) {
  return text.toLowerCase().replace(/[\s!-/:-@[-`{-~‘’“”]/g, "");
}

/**
 * The workouts matching both a search and a category (either can be empty), alphabetical.
 * Every word searched for has to appear in the name, so "pull str" finds "Strength Pull-Ups".
 */
export function searchTemplates(templates: WorkoutTemplate[], query: string, category?: Category) {
  const words = query.split(/\s+/).map(normalize).filter(Boolean);
  return templates
    .filter((t) => !category || t.category === category)
    .filter((t) => {
      const name = normalize(t.name);
      return words.every((word) => name.includes(word));
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
