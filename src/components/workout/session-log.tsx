import type { ComponentType } from "react";

import { MEASURES } from "@/data/categories";
import { sessionKind } from "@/data/kinds";
import type { Session, SessionExercise, SessionKind } from "@/data/types";
import { useLog } from "@/store/log";

import { RestBox } from "./rest-box";
import { SessionExerciseCard } from "./session-exercise-card";
import { StopwatchCard } from "./stopwatch-card";

type LogViewProps = { session: Session; exercise: SessionExercise };

/** Set by set, then the rest between sets. */
function SetsLog({ session, exercise }: LogViewProps) {
  const log = useLog();
  return (
    <>
      <SessionExerciseCard
        exercise={exercise}
        onUpdateSet={(setId, change) => log.updateSet(session.id, exercise.id, setId, change)}
        onAddSet={() => log.addSet(session.id, exercise.id)}
        onRemoveSet={(setId) => log.removeSet(session.id, exercise.id, setId)}
      />
      {MEASURES[exercise.prescription.measure].restBetweenSets && (
        <RestBox
          value={exercise.prescription.restSeconds}
          onChange={(v) => log.setRest(session.id, exercise.id, v)}
        />
      )}
    </>
  );
}

/** The time on the clock, which can be fixed once it's stopped. */
function StopwatchLog({ session, exercise }: LogViewProps) {
  const log = useLog();
  const set = exercise.sets[0];
  return (
    <StopwatchCard
      session={session}
      onChangeSeconds={(seconds) => set && log.updateSet(session.id, exercise.id, set.id, { actual: { seconds } })}
    />
  );
}

/** How each kind of session logs what was done. */
const LOG_VIEWS: Record<SessionKind, ComponentType<LogViewProps>> = {
  sets: SetsLog,
  stopwatch: StopwatchLog,
};

/**
 * What was done in a session, in whatever form its kind logs it: the workout screen's
 * first page, and the timer's once the workout is finished. Changes save as they're made.
 */
export function SessionLog({ session, exercise }: LogViewProps) {
  const Log = LOG_VIEWS[sessionKind(session)];
  return <Log session={session} exercise={exercise} />;
}
