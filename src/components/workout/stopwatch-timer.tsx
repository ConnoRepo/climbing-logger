import { useEffect, useState } from "react";

import { formatElapsed } from "@/data/format";
import { KIND_LABEL } from "@/data/kinds";
import { stopwatchSet } from "@/data/stopwatch";
import { useLiveActivity } from "@/hooks/use-live-activity";
import { useStopwatch } from "@/hooks/use-stopwatch";
import { useLog } from "@/store/log";

import { SessionLog } from "./session-log";
import { TimerLayout, type TimerProps } from "./timer-layout";

/**
 * An open-ended session: one clock counting up. Finish logs its time and goes to the
 * review, where the time can be fixed and notes written, like any other workout.
 */
export function StopwatchTimer({ session, exercise }: TimerProps) {
  const log = useLog();
  const { running, elapsedMs } = useStopwatch(session);
  const [finished, setFinished] = useState(false);

  // The user tapped Start (or Continue) to get here, so the clock starts right away.
  useEffect(() => {
    if (!session.runningSince) log.startStopwatch(session.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // iOS runs the Lock Screen clock itself, so it only hears about starts and pauses:
  // running, it counts from when the clock would have read 0:00. Finished, it goes away.
  const counted = (stopwatchSet(session)?.actual.seconds ?? 0) * 1000;
  const clock = session.runningSince
    ? { countUpFrom: Date.parse(session.runningSince) - counted }
    : { pausedElapsedMs: counted };
  useLiveActivity(
    finished ? undefined : { title: session.name, caption: running ? "Session running" : "Paused", ...clock },
    `climbingapp://timer/${session.id}`,
  );

  return (
    <TimerLayout
      session={session}
      logLabel={KIND_LABEL.stopwatch}
      finished={finished}
      panel={{ fill: running ? "go" : "fillDark", clock: formatElapsed(elapsedMs), caption: running ? "Running" : "Paused" }}
      // Nothing under the clock while it runs; once finished, the logged time, to fix if need be.
      body={finished ? <SessionLog session={session} exercise={exercise} /> : null}
      controls={[
        {
          label: running ? "Pause" : "Resume",
          onPress: () => (running ? log.pauseStopwatch(session.id) : log.startStopwatch(session.id)),
        },
        {
          label: "Finish",
          onPress: () => {
            log.finishStopwatch(session.id);
            setFinished(true);
          },
        },
      ]}
    />
  );
}
