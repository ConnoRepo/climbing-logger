import type { DateKey } from "@/lib/dates";

import { newId, now } from "./ids";
import { MEASURES } from "./measures";
import type { Prescription, Session, SessionKind, SetLog, WorkoutTemplate } from "./types";

/**
 * Schedules a template on a day. The session is a full copy: editing the
 * template afterwards never changes it, so completed sessions are history.
 */
export function newSession(template: WorkoutTemplate, id: string, date: DateKey | null, position: number): Session {
  const ts = now();
  return {
    id,
    templateId: template.id,
    date,
    position,
    name: template.name,
    category: template.category,
    prescription: template.prescription,
    sets: makeSets(template.prescription),
    completedAt: null,
    runningSince: null,
    notes: "",
    createdAt: ts,
    updatedAt: ts,
  };
}

/** A logged set for each planned one, starting from the plan. */
function makeSets(p: Prescription): SetLog[] {
  return p.sets.map((values) => ({ id: newId(), ...values, done: false }));
}

/** The sessions on a day (or Unscheduled for null), in their order. */
export function sessionsOn(sessions: Session[], date: DateKey | null) {
  return sessions.filter((s) => s.date === date).sort((a, b) => a.position - b.position);
}

/**
 * A workout as it stands on its day: its sets as edited there (added, removed, reps
 * changed) over the prescription it was added with.
 */
export function planOf(s: Session): Prescription {
  return { ...s.prescription, sets: s.sets };
}

/** The kind of a session (see SessionKind). Screens branch on this rather than on measures. */
export function sessionKind(s: Session): SessionKind {
  return MEASURES[s.prescription.measure].kind;
}

export function isStopwatch(s: Session) {
  return sessionKind(s) === "stopwatch";
}

/** What a session of each kind logs: names its page on the pager dots, and in "Swipe back to check your …". */
export const KIND_LABEL: Record<SessionKind, string> = {
  sets: "sets",
  stopwatch: "time",
};

/** Under way, so its Start button reads Continue. */
export function isStarted(s: Session) {
  // A stopwatch carries on from its time, even once it's finished.
  if (isStopwatch(s)) return !!s.runningSince || !!stopwatchSet(s)?.seconds;
  return s.sets.some((set) => set.done) && !s.sets.every((set) => set.done);
}

/*
 * The stopwatch. A stopwatch session is one clock that counts up. The time already
 * counted is its one set's `seconds`; while the clock runs, `runningSince` adds the
 * time since it was started. Both come from the wall clock, so it keeps counting
 * while the app is suspended or closed.
 */

/** The session's one set, which holds its logged time. */
export function stopwatchSet(s: Session): SetLog | undefined {
  return s.sets[0];
}

/** Time on the clock at `nowMs`. */
export function elapsedMs(s: Session, nowMs: number) {
  const counted = (stopwatchSet(s)?.seconds ?? 0) * 1000;
  return s.runningSince ? counted + Math.max(0, nowMs - Date.parse(s.runningSince)) : counted;
}

/** Stops the clock: the running time is added to the set (in whole seconds). No-op when stopped. */
export function stopClock(s: Session, nowIso: string): Session {
  if (!s.runningSince) return s;
  const seconds = Math.round(elapsedMs(s, Date.parse(nowIso)) / 1000);
  return withSet(s, (set) => ({ ...set, seconds }), { runningSince: null });
}

/** Updates the session's one set (and, optionally, the session itself). */
export function withSet(s: Session, fn: (set: SetLog) => SetLog, patch: Partial<Session> = {}): Session {
  return { ...s, ...patch, sets: s.sets.map((set, i) => (i === 0 ? fn(set) : set)) };
}
