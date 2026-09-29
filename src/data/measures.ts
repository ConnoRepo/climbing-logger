import type { HistoryKind, Measure, Prescription, SessionKind, SetValues } from "./types";

/** Most sets a workout can have, planned or logged. */
export const MAX_SETS = 15;

/** Numbers on a prescription shared by every set, rather than set by set. */
type SharedField = "onSeconds" | "offSeconds" | "edgeMm";

/** A number edited with a stepper: one per set (the default), or shared by every set. */
export type FieldSpec<K extends string = keyof SetValues> = { key: K; label: string; unit: string; step: number; min: number };

const FIELDS = {
  reps: { key: "reps", label: "Reps", unit: "reps", step: 1, min: 1 },
  problems: { key: "reps", label: "Problems", unit: "problems", step: 1, min: 1 },
  hangs: { key: "reps", label: "Hangs", unit: "hangs", step: 1, min: 1 },
  hold: { key: "seconds", label: "Time", unit: "s", step: 5, min: 5 },
  weight: { key: "weightLb", label: "Weight", unit: "lb", step: 5, min: -225 },
  on: { key: "onSeconds", label: "On", unit: "s", step: 1, min: 1 },
  off: { key: "offSeconds", label: "Off", unit: "s", step: 1, min: 1 },
  edge: { key: "edgeMm", label: "Edge", unit: "mm", step: 1, min: 4 },
} satisfies Record<string, FieldSpec<keyof SetValues | SharedField>>;

type MeasureSpec = {
  label: string;
  /** How its sessions are run and logged (see SessionKind). */
  kind: SessionKind;
  /** What its history graph plots. */
  history: HistoryKind;
  /** Settings shared by every set, edited on the workout's card above its sets. */
  sharedFields: FieldSpec<SharedField>[];
  /** Planned and logged set by set. */
  setFields: FieldSpec[];
  usesGrade: boolean;
  usesPerSide: boolean;
  /**
   * Rest between the reps of a set (offSeconds) gets its own box under the card, beside
   * rest between sets, once a set has more than one rep. Intervals edits its Off in the card.
   */
  restBetweenReps: boolean;
  /** A new workout's plan, and what switching to this measure resets it to. */
  defaults: Omit<Prescription, "measure">;
};

/**
 * What differs between measures as data: the editor, the per-set log rows, how a
 * session is run and what its graph shows are all driven from this table. (Text and
 * timer steps that differ by measure are switches in format.ts and timer-steps.ts.)
 */
export const MEASURES: Record<Measure, MeasureSpec> = {
  reps: {
    label: "Reps",
    kind: "sets",
    history: "weight",
    sharedFields: [],
    setFields: [FIELDS.reps, FIELDS.weight],
    usesGrade: false,
    usesPerSide: true,
    restBetweenReps: false,
    defaults: { sets: repeatSet(3, { reps: 8 }), restSeconds: 120 },
  },
  // Each set is its reps, each rep a hold: one 30s hold, or repeaters' 6 × 7s with 3s between.
  time: {
    label: "Time",
    kind: "sets",
    history: "weight",
    sharedFields: [],
    setFields: [FIELDS.weight, FIELDS.hold, FIELDS.reps],
    usesGrade: false,
    usesPerSide: true,
    restBetweenReps: true,
    defaults: { sets: repeatSet(2, { seconds: 30, reps: 1 }), offSeconds: 3, restSeconds: 30 },
  },
  intervals: {
    label: "Intervals",
    kind: "sets",
    history: "weight",
    sharedFields: [FIELDS.on, FIELDS.off, FIELDS.edge],
    setFields: [FIELDS.hangs, FIELDS.weight],
    usesGrade: false,
    usesPerSide: false,
    restBetweenReps: false,
    defaults: { sets: repeatSet(3, { reps: 6 }), onSeconds: 7, offSeconds: 3, edgeMm: 20, restSeconds: 180 },
  },
  climbs: {
    label: "Climbs",
    kind: "sets",
    history: "weight",
    sharedFields: [],
    setFields: [FIELDS.problems],
    usesGrade: true,
    usesPerSide: false,
    restBetweenReps: false,
    defaults: { sets: repeatSet(4, { reps: 4 }), restSeconds: 180 },
  },
  // An open-ended session: one clock that counts up until it's finished. Its time is logged
  // on its one set (seconds), so there's nothing to plan.
  stopwatch: {
    label: "Stopwatch",
    kind: "stopwatch",
    history: "duration",
    sharedFields: [],
    setFields: [],
    usesGrade: false,
    usesPerSide: false,
    restBetweenReps: false,
    defaults: { sets: [{}] },
  },
};

/** `count` sets of the same values. */
export function repeatSet(count: number, values: SetValues): SetValues[] {
  return Array.from({ length: count }, () => ({ ...values }));
}

/** "Weight (lb)", but just "Reps" when the unit would repeat the label. */
export function fieldLabel(f: { label: string; unit: string }) {
  return f.unit.toLowerCase() === f.label.toLowerCase() ? f.label : `${f.label} (${f.unit})`;
}

/**
 * `sets` with `change` made to set `index`. New reps, time or weight also carry forward
 * to every later set (and so to sets added later, which copy the last one); earlier
 * sets keep what they were. Used for planned and logged sets alike.
 */
export function updateSetAt<T extends SetValues>(sets: T[], index: number, change: Partial<NoInfer<T>>): T[] {
  const carried: SetValues = {};
  if (change.reps !== undefined) carried.reps = change.reps;
  if (change.seconds !== undefined) carried.seconds = change.seconds;
  if (change.weightLb !== undefined) carried.weightLb = change.weightLb;
  return sets.map((set, i) => (i === index ? { ...set, ...change } : i > index ? { ...set, ...carried } : set));
}

/** Whether a workout rests between the reps of its sets: timed reps, once a set has more than one. */
export function restsBetweenReps(p: Prescription) {
  return MEASURES[p.measure].restBetweenReps && p.sets.some((set) => (set.reps ?? 1) > 1);
}
