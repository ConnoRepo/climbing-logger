import { MEASURES } from "./categories";
import { stopwatchSet } from "./stopwatch";
import type { Session, SessionKind } from "./types";

/**
 * The kind of a session (see SessionKind), from its one exercise's measure. Screens
 * ask this rather than checking measures, so a new measure only needs its MEASURES entry.
 */
export function sessionKind(session: Session): SessionKind {
  const measure = session.exercises[0]?.prescription.measure;
  return measure ? MEASURES[measure].kind : "sets";
}

export function isStopwatch(session: Session) {
  return sessionKind(session) === "stopwatch";
}

/** What a session of each kind logs: names its page on the pager dots, and in "Swipe back to check your …". */
export const KIND_LABEL: Record<SessionKind, string> = {
  sets: "sets",
  stopwatch: "time",
};

/** Under way, so its Start button reads Continue. */
export function isStarted(session: Session) {
  if (isStopwatch(session)) {
    // A stopwatch carries on from its time, even once it's finished.
    return !!session.runningSince || !!stopwatchSet(session)?.actual.seconds;
  }
  const sets = session.exercises.flatMap((e) => e.sets);
  return sets.some((s) => s.done) && !sets.every((s) => s.done);
}
