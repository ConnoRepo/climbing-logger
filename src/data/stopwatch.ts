import type { Session, SetLog } from "./types";

/**
 * A stopwatch session is one clock that counts up. The time already counted is
 * its one set's `actual.seconds`; while the clock runs, `runningSince` adds the
 * time since it was started. Both come from the wall clock, so it keeps counting
 * while the app is suspended or closed.
 */
export function isStopwatch(session: Session) {
  return session.exercises[0]?.prescription.measure === "stopwatch";
}

/** The session's one set, which holds its logged time. */
export function stopwatchSet(session: Session) {
  return session.exercises[0]?.sets[0];
}

/** Time on the clock at `nowMs`. */
export function elapsedMs(session: Session, nowMs: number) {
  const counted = (stopwatchSet(session)?.actual.seconds ?? 0) * 1000;
  return session.runningSince ? counted + Math.max(0, nowMs - Date.parse(session.runningSince)) : counted;
}

/** Stops the clock: the running time is added to the set (in whole seconds). No-op when stopped. */
export function stopClock(session: Session, nowIso: string): Session {
  if (!session.runningSince) return session;
  const seconds = Math.round(elapsedMs(session, Date.parse(nowIso)) / 1000);
  return withSet(session, (set) => ({ ...set, actual: { ...set.actual, seconds } }), { runningSince: undefined });
}

/** Updates the session's one set (and, optionally, the session itself). */
export function withSet(
  session: Session,
  fn: (set: SetLog) => SetLog,
  patch: Partial<Session> = {},
): Session {
  return {
    ...session,
    ...patch,
    exercises: session.exercises.map((e, i) => (i === 0 ? { ...e, sets: e.sets.map((set, j) => (j === 0 ? fn(set) : set)) } : e)),
  };
}
