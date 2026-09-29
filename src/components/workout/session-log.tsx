import type { ComponentType } from "react";

import { AppText, Box } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { formatPrescription } from "@/data/format";
import { MEASURES } from "@/data/measures";
import { sessionKind, stopwatchSet } from "@/data/sessions";
import type { Session, SessionKind } from "@/data/types";
import { useLog } from "@/store/log";

import { RestBox } from "./rest-box";
import { SetList } from "./set-list";
import { StopwatchCard } from "./stopwatch-card";

type LogViewProps = { session: Session };

/**
 * Set by set, then the rest between sets. The set card grows to fill the height
 * it's given, showing more sets.
 */
function SetsLog({ session }: LogViewProps) {
  const log = useLog();
  return (
    <>
      <Box style={{ flexGrow: 1, padding: space.sm, gap: space.sm }}>
        <AppText variant="note" color={colors.placeholder} align="center">
          Planned: {formatPrescription(session.prescription)}
        </AppText>
        <SetList
          sets={session.sets.map((set) => ({ key: set.id, values: set }))}
          fields={MEASURES[session.prescription.measure].setFields}
          onChange={(i, values) => log.updateSet(session.id, session.sets[i].id, values)}
          onAdd={() => log.addSet(session.id)}
          onRemove={() => log.removeLastSet(session.id)}
        />
      </Box>
      <RestBox value={session.prescription.restSeconds} onChange={(v) => log.setSessionRest(session.id, v)} />
    </>
  );
}

/** The time on the clock, which can be fixed once it's stopped. */
function StopwatchLog({ session }: LogViewProps) {
  const log = useLog();
  const set = stopwatchSet(session);
  return (
    <StopwatchCard
      session={session}
      onChangeSeconds={(seconds) => set && log.updateSet(session.id, set.id, { seconds })}
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
export function SessionLog({ session }: LogViewProps) {
  const Log = LOG_VIEWS[sessionKind(session)];
  return <Log session={session} />;
}
