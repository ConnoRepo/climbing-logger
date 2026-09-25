import { useEffect, useRef, useState } from "react";

type CountdownHandlers = {
  /** `lateMs`: how long ago the countdown actually ran out; more than a tick if the app was suspended. */
  onDone?: (lateMs: number) => void;
  /** Each time the whole seconds left (as shown, rounded up) tick down while running, e.g. 3, 2, 1. Not at 0. */
  onSecond?: (secondsLeft: number) => void;
};

/**
 * Countdown that stays accurate when JS timers fire late: remaining time is
 * derived from a wall-clock end time, so ticks only trigger re-renders.
 */
export function useCountdown(initialSeconds: number, { onDone, onSecond }: CountdownHandlers = {}) {
  const [remainingMs, setRemainingMs] = useState(initialSeconds * 1000);
  const [isRunning, setIsRunning] = useState(false);
  // Bumped by restart() so a new interval starts even if isRunning never flips
  // (e.g. onDone immediately restarting the next countdown).
  const [run, setRun] = useState(0);
  const endAtRef = useRef(0);
  // endAtRef as state, for rendering (the Live Activity's clock).
  const [endsAt, setEndsAt] = useState(0);
  const handlers = useRef({ onDone, onSecond });

  useEffect(() => {
    handlers.current = { onDone, onSecond };
  });

  useEffect(() => {
    if (!isRunning) return;

    // The second showing when this run (re)started, so a fresh 30s countdown doesn't report 30.
    let shown = Math.ceil((endAtRef.current - Date.now()) / 1000);
    const id = setInterval(() => {
      const left = Math.max(0, endAtRef.current - Date.now());
      setRemainingMs(left);
      const second = Math.ceil(left / 1000);
      if (second < shown && second > 0) handlers.current.onSecond?.(second);
      shown = second;
      if (left === 0) {
        clearInterval(id);
        setIsRunning(false);
        handlers.current.onDone?.(Date.now() - endAtRef.current);
      }
    }, 100);
    return () => clearInterval(id);
  }, [isRunning, run]);

  function start() {
    if (remainingMs <= 0) return;
    endAtRef.current = Date.now() + remainingMs;
    setEndsAt(endAtRef.current);
    setIsRunning(true);
  }

  function pause() {
    // Capture the exact remaining time, not the last tick's value
    setRemainingMs(Math.max(0, endAtRef.current - Date.now()));
    setIsRunning(false);
  }

  /** Starts a fresh countdown of `seconds` (can be fractional); 0 just stops at 0. */
  function restart(seconds: number) {
    const ms = Math.max(0, seconds * 1000);
    endAtRef.current = Date.now() + ms;
    setEndsAt(endAtRef.current);
    setRemainingMs(ms);
    setIsRunning(ms > 0);
    setRun((n) => n + 1);
  }

  function reset() {
    setIsRunning(false);
    setRemainingMs(initialSeconds * 1000);
  }

  return {
    remainingMs,
    seconds: Math.ceil(remainingMs / 1000),
    isRunning,
    /** Wall-clock time the running countdown reaches 0 (ms since epoch). */
    endsAt,
    start,
    pause,
    reset,
    restart,
  };
}
