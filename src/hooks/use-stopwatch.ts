import { useEffect, useState } from "react";

import { elapsedMs } from "@/data/stopwatch";
import type { Session } from "@/data/types";

const TICK_MS = 250;

/**
 * Time on a stopwatch session's clock, re-rendering while it runs. The time
 * comes from the saved session and the wall clock; the ticks only redraw it.
 */
export function useStopwatch(session: Session) {
  const [nowMs, setNowMs] = useState(Date.now);
  const running = !!session.runningSince;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  // A stopped clock doesn't depend on the time, so a stale nowMs is fine then.
  return { running, elapsedMs: elapsedMs(session, nowMs) };
}
