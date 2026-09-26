/**
 * Workout data model. Shaped to map 1:1 onto future backend tables:
 * every record has a UUID and timestamps, and nested lists carry their own
 * `id` + `position` so they can be flattened into child tables.
 */
import type { DateKey } from "@/lib/dates";

export type Category = "mobility" | "climbing" | "workout";

/** How one set of an exercise is measured. */
export type Measure = "reps" | "time" | "intervals" | "climbs" | "stopwatch";

type Timestamps = { createdAt: string; updatedAt: string };

/** Canonical exercise, so history can follow "Pull Ups" across templates. */
export type Exercise = Timestamps & {
  id: string;
  name: string;
  category: Category;
  defaultMeasure: Measure;
};

/**
 * One line of a template: "Pull Ups — 4 × 6 reps @ +25 lb, 2:00 rest".
 * Fields are flat and optional; `measure` decides which ones apply (see MEASURES).
 */
export type Prescription = {
  id: string;
  position: number;
  /** Library exercise this line tracks; null until it has been named. */
  exerciseId: string | null;
  name: string;
  measure: Measure;
  sets: number;
  /** Each set's own planned values, when they differ (8, 6, 4 reps). Unset fields use the flat ones below. */
  setValues?: SetValues[];
  /** reps · intervals: reps per set · climbs: problems per set */
  reps?: number;
  /** time: hold/duration · intervals: seconds on */
  seconds?: number;
  /** intervals: seconds off (repeaters 7 on / 3 off) */
  offSeconds?: number;
  perSide?: boolean;
  /** + added / – assisted */
  weightLb?: number;
  edgeMm?: number;
  /** Stored as entered ("V4", "V2–V4") — never converted between scales. */
  grade?: string;
  /** Rest between sets. */
  restSeconds?: number;
  notes?: string;
};

export type WorkoutTemplate = Timestamps & {
  id: string;
  category: Category;
  name: string;
  exercises: Prescription[];
  deletedAt?: string;
};

/** The per-set numbers that can differ between plan and reality. */
export type SetValues = {
  reps?: number;
  seconds?: number;
  weightLb?: number;
};

export type SetLog = {
  id: string;
  position: number;
  planned: SetValues;
  actual: SetValues;
  done: boolean;
};

export type SessionExercise = {
  id: string;
  position: number;
  exerciseId: string | null;
  name: string;
  /** Snapshot of the template line at the time it was scheduled. */
  prescription: Prescription;
  sets: SetLog[];
};

/** A template added to a day: a full copy, edited independently from then on. */
export type Session = Timestamps & {
  id: string;
  /** The day it's on, or null while it's Unscheduled (planned for the week, not on a day yet). */
  date: DateKey | null;
  /** Order among the sessions on the same day (or in Unscheduled); lowest first. */
  position: number;
  templateId: string | null;
  category: Category;
  name: string;
  status: "planned" | "done";
  completedAt?: string;
  /** Stopwatch sessions: when the clock was last started; unset while it's stopped. */
  runningSince?: string;
  exercises: SessionExercise[];
};

export type AppData = {
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  sessions: Session[];
  journal: Record<DateKey, string>;
};
