import { useEffect, useState } from "react";
import { Vibration } from "react-native";

import { buildSteps, stepRows, type TimerStep } from "@/data/timer-steps";
import type { Session, SessionExercise } from "@/data/types";
import { useLog } from "@/store/log";

import { useCountdown } from "./use-countdown";

/**
 * Walks a session's sets and rests. Timed steps count down and move on by
 * themselves (with a buzz); untimed sets wait for next(). Leaving a set marks
 * it done, and leaving the last step finishes the session.
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

  const countdown = useCountdown(0, () => {
    Vibration.vibrate();
    next();
  });

  // The user tapped Start to get here, so the first step starts right away.
  useEffect(() => {
    countdown.restart(current?.seconds ?? 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The current set was deleted: settle on the step that took its place and start it fresh.
  useEffect(() => {
    if (found < 0 && current) goTo(index);
  }, [found, current?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  function goTo(i: number) {
    const step = steps[i];
    if (!step) return;
    setPos({ key: step.key, index: i });
    countdown.restart(step.seconds ?? 0);
  }

  function next() {
    if (!current) return;
    const following = steps[index + 1];
    const setEnds = current.kind === "work" && !(following?.kind === "work" && following.setId === current.setId);
    if (setEnds) log.updateSet(session.id, exercise.id, current.setId, { done: true });

    if (following) {
      goTo(index + 1);
    } else {
      countdown.restart(0);
      log.setSessionDone(session.id, true);
      onFinish();
    }
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
    next,
    prev,
    togglePause: countdown.isRunning ? countdown.pause : countdown.start,
  };
}
