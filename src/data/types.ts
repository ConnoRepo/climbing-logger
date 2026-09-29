/**
 * Workout data model. Each collection in AppData is one future backend table, and a
 * row's `prescription` and `sets` are JSON columns, always read and written with it.
 *
 * Row fields that can be absent are `T | null` (as a backend returns them); text is ""
 * when empty, never null. Fields inside the JSON columns are optional.
 */
import type { DateKey } from "@/lib/dates";

export type Category = "climbing" | "fingers" | "workout" | "mobility";

/** How one set of a workout is measured. */
export type Measure = "reps" | "time" | "intervals" | "climbs" | "stopwatch";

/**
 * How a session is run and logged: set by set with the step timer, or as one clock
 * counting up. Every measure is one of these (see MEASURES); the screens are the same
 * bones for both, with each kind plugging in its own card and timer.
 */
export type SessionKind = "sets" | "stopwatch";

/** What a workout's history graph plots: the heaviest weight each day, or how long it lasted. */
export type HistoryKind = "weight" | "duration";

type Timestamps = { createdAt: string; updatedAt: string };

/** The numbers that can differ from set to set, planned or logged. */
export type SetValues = {
  /** reps · intervals: hangs · climbs: problems · time: holds in the set */
  reps?: number;
  /** time: each hold · stopwatch: the time logged */
  seconds?: number;
  /** + added / – assisted */
  weightLb?: number;
};

/**
 * How a workout is done: "4 × 6 reps @ +25 lb, 2:00 rest". `sets` holds each set's
 * planned values (and so how many there are); the other fields apply to every set.
 * `measure` decides which fields apply (see MEASURES).
 */
export type Prescription = {
  measure: Measure;
  sets: SetValues[];
  /** intervals: time on for each hang */
  onSeconds?: number;
  /** intervals: time off between hangs · time: rest between the holds of a set */
  offSeconds?: number;
  perSide?: boolean;
  edgeMm?: number;
  /** Stored as entered ("V4", "V2–V4"), never converted between scales. */
  grade?: string;
  /** Rest between sets. */
  restSeconds?: number;
  notes?: string;
};

/** A saved workout. Soft-deleted, since its sessions keep pointing at it. */
export type WorkoutTemplate = Timestamps & {
  id: string;
  name: string;
  category: Category;
  prescription: Prescription;
  deletedAt: string | null;
};

/** One set as it was done. */
export type SetLog = SetValues & { id: string; done: boolean };

/** A template added to a day: a full copy, edited independently from then on. */
export type Session = Timestamps & {
  id: string;
  templateId: string;
  /** The day it's on, or null while it's Unscheduled (planned for the week, not on a day yet). */
  date: DateKey | null;
  /** Order among the sessions on the same day (or in Unscheduled); lowest first. */
  position: number;
  /** Copied from the template, so a day's row needs nothing else. */
  name: string;
  category: Category;
  /** The template's prescription when it was added. Only its rest can be changed on the day. */
  prescription: Prescription;
  /** Set i was planned as `prescription.sets[i]`; sets are only added or removed at the end. */
  sets: SetLog[];
  completedAt: string | null;
  /** Stopwatch sessions: when the clock was last started; null while it's stopped. */
  runningSince: string | null;
  /** Written at the end of the workout, for next time. */
  notes: string;
};

/** One day's journal; the date is its key. */
export type JournalEntry = Timestamps & { date: DateKey; text: string };

export type AppData = {
  templates: WorkoutTemplate[];
  sessions: Session[];
  journal: JournalEntry[];
};
