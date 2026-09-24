import type { IconName } from "@/components/ui";

import type { Category, Measure, Prescription, SetValues } from "./types";

/** `measures` are the options offered for a workout in that category; the first is the default. */
export const CATEGORIES: { id: Category; label: string; icon: IconName; measures: Measure[] }[] = [
  { id: "mobility", label: "Mobility", icon: "loader", measures: ["time", "reps"] },
  { id: "climbing", label: "Climbing", icon: "image", measures: ["climbs", "intervals", "time"] },
  { id: "workout", label: "Workout", icon: "link", measures: ["reps", "time"] },
];

export function categoryInfo(id: Category) {
  return CATEGORIES.find((c) => c.id === id)!;
}

export function defaultMeasure(category: Category) {
  return categoryInfo(category).measures[0];
}

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((c) => c.id === value);
}

/** Most sets a workout can have, planned or logged. */
export const MAX_SETS = 15;

/** Numeric prescription fields that can be edited with a stepper. */
export type NumericField = "reps" | "seconds" | "offSeconds" | "weightKg" | "edgeMm" | "restSeconds";

export type FieldSpec = { key: NumericField; label: string; unit: string; step: number; min: number };

const F = {
  reps: { key: "reps", label: "Reps", unit: "reps", step: 1, min: 1 },
  problems: { key: "reps", label: "Problems", unit: "problems", step: 1, min: 1 },
  hangs: { key: "reps", label: "Hangs", unit: "hangs", step: 1, min: 1 },
  hold: { key: "seconds", label: "Time", unit: "s", step: 5, min: 5 },
  on: { key: "seconds", label: "On", unit: "s", step: 1, min: 1 },
  off: { key: "offSeconds", label: "Off", unit: "s", step: 1, min: 1 },
  weight: { key: "weightKg", label: "Weight", unit: "kg", step: 2.5, min: -100 },
  edge: { key: "edgeMm", label: "Edge", unit: "mm", step: 1, min: 4 },
  rest: { key: "restSeconds", label: "Rest", unit: "s", step: 15, min: 0 },
} satisfies Record<string, FieldSpec>;

/**
 * Everything that differs between measures lives here: the editor, the
 * summary text and the per-set log rows are all driven from this table.
 */
export const MEASURES: Record<
  Measure,
  {
    label: string;
    /** Editable in the template editor, in display order. */
    fields: FieldSpec[];
    /** Logged per set on a session (planned vs actual). */
    setFields: FieldSpec[];
    usesGrade: boolean;
    defaults: Partial<Prescription>;
  }
> = {
  reps: {
    label: "Reps",
    fields: [F.reps, F.weight, F.rest],
    setFields: [F.reps, F.weight],
    usesGrade: false,
    defaults: { sets: 3, reps: 8, restSeconds: 120 },
  },
  time: {
    label: "Time",
    fields: [F.hold, F.weight, F.rest],
    setFields: [F.hold],
    usesGrade: false,
    defaults: { sets: 2, seconds: 30, restSeconds: 30 },
  },
  intervals: {
    label: "Intervals",
    fields: [F.hangs, F.on, F.off, F.edge, F.weight, F.rest],
    setFields: [F.hangs, F.weight],
    usesGrade: false,
    defaults: { sets: 3, reps: 6, seconds: 7, offSeconds: 3, edgeMm: 20, restSeconds: 180 },
  },
  climbs: {
    label: "Climbs",
    fields: [F.problems, F.rest],
    setFields: [F.problems],
    usesGrade: true,
    defaults: { sets: 4, reps: 4, restSeconds: 180 },
  },
};

/** "Weight (kg)", but just "Reps" when the unit would repeat the label. */
export function fieldLabel(f: FieldSpec) {
  return f.unit.toLowerCase() === f.label.toLowerCase() ? f.label : `${f.label} (${f.unit})`;
}

/** The planned values for one set of a prescription. */
export function plannedSetValues(p: Prescription): SetValues {
  const values: SetValues = {};
  for (const f of MEASURES[p.measure].setFields) {
    const v = p[f.key];
    if (v !== undefined && (f.key === "reps" || f.key === "seconds" || f.key === "weightKg")) values[f.key] = v;
  }
  return values;
}
