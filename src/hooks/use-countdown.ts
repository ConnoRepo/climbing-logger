import { useEffect, useRef, useState } from "react";

/**
 * Countdown that stays accurate when JS timers fire late: remaining time is
 * derived from a wall-clock end time, so ticks only trigger re-renders.
 */
export function useCountdown(initialSeconds: number, onDone?: () => void) {
  const [remainingMs, setRemainingMs] = useState(initialSeconds * 1000);
  const [isRunning, setIsRunning] = useState(false);
  // Bumped by restart() so a new interval starts even if isRunning never flips
  // (e.g. onDone immediately restarting the next countdown).
  const [run, setRun] = useState(0);
  const endAtRef = useRef(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      const left = Math.max(0, endAtRef.current - Date.now());
      setRemainingMs(left);
      if (left === 0) {
        clearInterval(id);
        setIsRunning(false);
        onDoneRef.current?.();
      }
    }, 100);
    return () => clearInterval(id);
  }, [isRunning, run]);

  function start() {
    if (remainingMs <= 0) return;
    endAtRef.current = Date.now() + remainingMs;
    setIsRunning(true);
  }

  function pause() {
    // Capture the exact remaining time, not the last tick's value
    setRemainingMs(Math.max(0, endAtRef.current - Date.now()));
    setIsRunning(false);
  }

  /** Starts a fresh countdown of `seconds`; 0 just stops at 0. */
  function restart(seconds: number) {
    const ms = seconds * 1000;
    endAtRef.current = Date.now() + ms;
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
    start,
    pause,
    reset,
    restart,
  };
}
