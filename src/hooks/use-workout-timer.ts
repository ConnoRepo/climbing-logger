import { useEffect, useState } from "react";
import { Vibration } from "react-native";

import { MEASURES } from "@/data/categories";
import { buildSteps, stepCaption, stepRows, type TimerStep } from "@/data/timer-steps";
import type { Session, SessionExercise } from "@/data/types";
import { useLog } from "@/store/log";
import type { WorkoutActivityProps } from "@/widgets/workout-activity";

import { useBackgroundKeepAlive } from "./use-background-keep-alive";
import { useBeep } from "./use-beep";
import { useCountdown } from "./use-countdown";
import { useLiveActivity } from "./use-live-activity";

/** Seconds left at which a timed step beeps: a heads-up at 30 and 10, then 3, 2, 1. */
const BEEP_AT = new Set([30, 10, 3, 2, 1]);

/**
 * Walks a session's sets and rests. Timed steps count down (beeping near the
 * end) and move on by themselves (with a buzz); untimed sets wait for next().
 * Leaving a set marks it done, and leaving the last step finishes the session.
 *
 * Locking the phone doesn't stop it: silent background audio keeps the app
 * running while a step counts down, and the Live Activity shows the step on the
 * Lock Screen. If iOS suspends the app anyway, it catches up on return.
 */
export function useWorkoutTimer(session: Session, exercise: SessionExercise, onFinish: () => void) {
  const log = useLog();
  const steps = buildSteps(exercise);
  const rows = stepRows(steps);

  // Tracked by key so edits to the set list don't move us; the index is the
  // fallback when the current step itself disappears (its set was removed).
  const [pos, setPos] = useState(() => {
    const index = Math.max(0, steps.findIndex((s) => !exercise.sets.find((set) => set.id === s.setId)?.done));
    return { key: steps[index]?.key, index };
  });
  const found = steps.findIndex((s) => s.key === pos.key);
  const index = found >= 0 ? found : Math.min(pos.index, steps.length - 1);
  const current: TimerStep | undefined = steps[index];
  const rowIndex = rows.findIndex((r) => current && r.stepKeys.includes(current.key));

  const beep = useBeep();
  const countdown = useCountdown(0, {
    onDone: (lateMs) => {
      Vibration.vibrate();
      next(lateMs);
    },
    onSecond: (s) => {
      if (BEEP_AT.has(s)) beep();
    },
  });

  // The user tapped Start to get here, so the first step starts right away.
  useEffect(() => {
    countdown.restart(current?.seconds ?? 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The current set was deleted: settle on the step that took its place and start it fresh.
  useEffect(() => {
    if (found < 0 && current) goTo(index);
  }, [found, current?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useBackgroundKeepAlive(countdown.isRunning);

  const set = exercise.sets.find((s) => s.id === current?.setId);
  const stepMs = current?.seconds !== undefined ? current.seconds * 1000 : undefined;
  let activity: WorkoutActivityProps | undefined;
  if (current && set) {
    activity = { title: session.name, caption: stepCaption(current, set, MEASURES[exercise.prescription.measure].setFields) };
    if (stepMs !== undefined && countdown.isRunning) activity = { ...activity, stepMs, endsAt: countdown.endsAt };
    else if (stepMs !== undefined) activity = { ...activity, stepMs, pausedLeftMs: countdown.remainingMs };
  }
  useLiveActivity(activity, `climbingapp://timer/${session.id}`);

  /** `lateMs`: time already gone from the step's countdown. */
  function goTo(i: number, lateMs = 0) {
    const step = steps[i];
    if (!step) return;
    setPos({ key: step.key, index: i });
    countdown.restart(step.seconds === undefined ? 0 : step.seconds - lateMs / 1000);
  }

  /**
   * Leaves the current step. `lateMs` is how far past its end we already are
   * (long if the app was suspended): it's carried through the following timed
   * steps, finishing their sets, so the workout lands where it would have been.
   */
  function next(lateMs = 0) {
    let i = index;
    let late = lateMs;
    for (;;) {
      const step = steps[i];
      if (!step) return;
      const following = steps[i + 1];
      const setEnds = step.kind === "work" && !(following?.kind === "work" && following.setId === step.setId);
      if (setEnds) log.updateSet(session.id, exercise.id, step.setId, { done: true });

      if (!following) {
        countdown.restart(0);
        log.setSessionDone(session.id, true);
        onFinish();
        return;
      }
      i++;
      // Untimed sets wait for the user; a timed step with time left is where we land.
      if (following.seconds === undefined || late < following.seconds * 1000) break;
      late -= following.seconds * 1000;
    }
    goTo(i, late);
  }

  /** Back to the start of the previous Set / Rest line. */
  function prev() {
    const row = rows[Math.max(0, rowIndex - 1)];
    if (row) goTo(steps.findIndex((s) => s.key === row.stepKeys[0]));
  }

  return {
    current,
    isLast: index === steps.length - 1,
    isTimed: current?.seconds !== undefined,
    remainingMs: countdown.remainingMs,
    isRunning: countdown.isRunning,
    next: () => next(),
    prev,
    togglePause: countdown.isRunning ? countdown.pause : countdown.start,
  };
}
