import type { IconName } from "@/components/ui";

import type { Category, Measure, Prescription, SetValues } from "./types";

/** `measures` are the options offered for a workout in that category; the first is the default. */
export const CATEGORIES: { id: Category; label: string; icon: IconName; measures: Measure[] }[] = [
  { id: "mobility", label: "Mobility", icon: "loader", measures: ["time", "reps"] },
  { id: "climbing", label: "Climbing", icon: "image", measures: ["climbs", "intervals", "time", "stopwatch"] },
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
export type NumericField = "reps" | "seconds" | "offSeconds" | "weightLb" | "edgeMm" | "restSeconds";

export type FieldSpec = { key: NumericField; label: string; unit: string; step: number; min: number };

const F = {
  reps: { key: "reps", label: "Reps", unit: "reps", step: 1, min: 1 },
  problems: { key: "reps", label: "Problems", unit: "problems", step: 1, min: 1 },
  hangs: { key: "reps", label: "Hangs", unit: "hangs", step: 1, min: 1 },
  hold: { key: "seconds", label: "Time", unit: "s", step: 5, min: 5 },
  on: { key: "seconds", label: "On", unit: "s", step: 1, min: 1 },
  off: { key: "offSeconds", label: "Off", unit: "s", step: 1, min: 1 },
  weight: { key: "weightLb", label: "Weight", unit: "lb", step: 5, min: -225 },
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
    /**
     * Rest between the reps of a set (offSeconds) gets its own box under the card, beside
     * rest between sets, once a set has more than one rep. Intervals edits its Off in the card.
     */
    restBetweenReps: boolean;
    defaults: Partial<Prescription>;
  }
> = {
  reps: {
    label: "Reps",
    fields: [F.reps, F.weight, F.rest],
    setFields: [F.reps, F.weight],
    usesGrade: false,
    restBetweenReps: false,
    defaults: { sets: 3, reps: 8, restSeconds: 120 },
  },
  // Each set is its reps, each rep a hold: one 30s hold, or repeaters' 6 × 7s with 3s between.
  time: {
    label: "Time",
    fields: [F.weight, F.hold, F.reps, F.rest],
    setFields: [F.weight, F.hold, F.reps],
    usesGrade: false,
    restBetweenReps: true,
    defaults: { sets: 2, seconds: 30, reps: 1, offSeconds: 3, restSeconds: 30 },
  },
  intervals: {
    label: "Intervals",
    fields: [F.hangs, F.on, F.off, F.edge, F.weight, F.rest],
    setFields: [F.hangs, F.weight],
    usesGrade: false,
    restBetweenReps: false,
    defaults: { sets: 3, reps: 6, seconds: 7, offSeconds: 3, edgeMm: 20, restSeconds: 180 },
  },
  climbs: {
    label: "Climbs",
    fields: [F.problems, F.rest],
    setFields: [F.problems],
    usesGrade: true,
    restBetweenReps: false,
    defaults: { sets: 4, reps: 4, restSeconds: 180 },
  },
  // An open-ended session: one clock that counts up until it's finished. Its time is logged
  // on its one set (seconds), so there's nothing to plan.
  stopwatch: {
    label: "Stopwatch",
    fields: [],
    setFields: [],
    usesGrade: false,
    restBetweenReps: false,
    defaults: { sets: 1 },
  },
};

/** "Weight (lb)", but just "Reps" when the unit would repeat the label. */
export function fieldLabel(f: FieldSpec) {
  return f.unit.toLowerCase() === f.label.toLowerCase() ? f.label : `${f.label} (${f.unit})`;
}

/** The planned values for one set of a prescription. */
export function plannedSetValues(p: Prescription): SetValues {
  const values: SetValues = {};
  for (const f of MEASURES[p.measure].setFields) {
    const v = p[f.key];
    if (v !== undefined && (f.key === "reps" || f.key === "seconds" || f.key === "weightLb")) values[f.key] = v;
  }
  return values;
}

/**
 * The part of a set change that also applies to every later set: reps
 * (hangs, problems), time and weight. Undefined when the change has none of them.
 */
export function carriedForward(change: SetValues | undefined): SetValues | undefined {
  if (!change) return undefined;
  const carried: SetValues = {};
  if (change.reps !== undefined) carried.reps = change.reps;
  if (change.seconds !== undefined) carried.seconds = change.seconds;
  if (change.weightLb !== undefined) carried.weightLb = change.weightLb;
  return Object.keys(carried).length ? carried : undefined;
}

/** The planned values for every set: its own where it has them, otherwise the prescription's. */
export function plannedSets(p: Prescription): SetValues[] {
  const base = plannedSetValues(p);
  return Array.from({ length: p.sets }, (_, i) => ({ ...base, ...p.setValues?.[i] }));
}

/** Whether a workout rests between the reps of its sets: timed reps, once a set has more than one. */
export function restsBetweenReps(p: Prescription) {
  return MEASURES[p.measure].restBetweenReps && plannedSets(p).some((set) => (set.reps ?? 1) > 1);
}
