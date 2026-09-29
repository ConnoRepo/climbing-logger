import { useLocalSearchParams } from "expo-router";
import type { ComponentType } from "react";

import { AppText } from "@/components/ui";
import { SetsTimer } from "@/components/workout/sets-timer";
import { StopwatchTimer } from "@/components/workout/stopwatch-timer";
import type { TimerProps } from "@/components/workout/timer-layout";
import { space } from "@/constants/theme";
import { sessionKind } from "@/data/sessions";
import type { SessionKind } from "@/data/types";
import { useLog } from "@/store/log";

/** How each kind of session is run; all of them are built on TimerLayout. */
const TIMERS: Record<SessionKind, ComponentType<TimerProps>> = {
  sets: SetsTimer,
  stopwatch: StopwatchTimer,
};

/** Runs a scheduled workout, laid out like the Figma timer frame. */
export default function TimerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useLog().session(id);

  if (!session) {
    return (
      <AppText variant="label" align="center" style={{ marginTop: space.xl }}>
        This workout was removed.
      </AppText>
    );
  }
  const Timer = TIMERS[sessionKind(session)];
  return <Timer session={session} />;
}
