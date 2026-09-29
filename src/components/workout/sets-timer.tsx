import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";

import { AppText, Box } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { formatClock, formatPrescription } from "@/data/format";
import { MAX_SETS, MEASURES } from "@/data/measures";
import { KIND_LABEL } from "@/data/sessions";
import type { Session } from "@/data/types";
import { useSetsTimer } from "@/hooks/use-sets-timer";
import { useLog } from "@/store/log";

import { SetButtons } from "./set-list";
import { SetHeader, SetRow } from "./set-row";
import { TimerLayout, type TimerProps } from "./timer-layout";

/**
 * Runs a workout set by set, with the rests between: a get-ready, then each timed step
 * counting down (or GO, for sets done at your own pace), with the sets under the clock.
 */
export function SetsTimer({ session }: TimerProps) {
  const timer = useSetsTimer(session);
  const { current, finished } = timer;

  return (
    <TimerLayout
      session={session}
      logLabel={KIND_LABEL.sets}
      finished={finished}
      panel={{
        fill: timer.isPaused ? "fillDark" : timer.isGo ? "go" : "fill",
        clock: !current ? "—" : timer.isTimed ? formatClock(timer.remainingMs) : "GO",
        caption: timer.caption,
      }}
      body={<TimerSetList session={session} currentSetId={finished ? undefined : current?.setId} />}
      controls={[
        { label: "Prev", onPress: timer.prev },
        { label: timer.isTimed && !timer.isRunning ? "Resume" : "Pause", onPress: timer.togglePause, disabled: !timer.isTimed },
        { label: timer.isLast ? "Finish" : "Next", onPress: timer.next, disabled: !current },
      ]}
    />
  );
}

type TimerSetListProps = {
  session: Session;
  /** The set being done, or rested after; highlighted. */
  currentSetId?: string;
};

/**
 * The workout screen's set card. The current set is highlighted and drawn
 * larger, and stays that way through the rest after it (the rest counts down
 * on the clock above); only Prev / Next move between sets. Scrolls once there
 * are more sets than fit. Once the workout is finished nothing is highlighted.
 */
function TimerSetList({ session, currentSetId }: TimerSetListProps) {
  const log = useLog();
  const { sets, prescription } = session;
  const fields = MEASURES[prescription.measure].setFields;
  const scrollRef = useRef<ScrollView>(null);
  const rowY = useRef<Record<string, number>>({});
  const currentIndex = sets.findIndex((s) => s.id === currentSetId);
  // Keep the set before the current one in view, landing on a row edge rather than mid-row.
  const prevSetId = sets[currentIndex - 1]?.id;
  const scrollToCurrent = (animated: boolean) =>
    scrollRef.current?.scrollTo({ y: prevSetId ? (rowY.current[prevSetId] ?? 0) : 0, animated });
  const last = sets.at(-1);
  const canAdd = sets.length < MAX_SETS;
  const canRemove = !!last && sets.length > 1 && !last.done && last.id !== currentSetId;

  useEffect(() => {
    if (currentSetId && rowY.current[currentSetId] !== undefined) scrollToCurrent(true);
  }, [currentSetId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box style={{ flex: 1, minHeight: 200, padding: space.sm, gap: space.sm }}>
      <AppText variant="note" color={colors.placeholder} align="center">
        Planned: {formatPrescription(prescription)}
      </AppText>

      <SetHeader fields={fields} withDone />

      {/* Scrolls edge to edge inside the card, with the padding moved onto the rows, so the current
          set's highlight spans the card and a tick spilling out of a Done box isn't clipped at the
          right or above the first set.
          While the keypad is up, the set being typed in scrolls up to sit just above it. */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, marginHorizontal: -space.sm }}
        contentContainerStyle={{ gap: 4, paddingTop: space.xs }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {sets.map((set, i) => {
          const isCurrent = set.id === currentSetId;
          return (
            <View
              key={set.id}
              onLayout={(e) => {
                rowY.current[set.id] = e.nativeEvent.layout.y;
                // Rows lay out after the first scroll effect, so opening mid-workout scrolls here.
                if (isCurrent) scrollToCurrent(false);
              }}
              style={{ paddingVertical: 4, paddingHorizontal: space.sm, backgroundColor: isCurrent ? colors.fillLight : undefined }}
            >
              <SetRow
                position={i}
                values={set}
                done={set.done}
                fields={fields}
                onChange={(values) => log.updateSet(session.id, set.id, values)}
                onToggleDone={(done) => log.updateSet(session.id, set.id, { done })}
                active={isCurrent}
              />
            </View>
          );
        })}
      </ScrollView>

      <SetButtons
        canAdd={canAdd}
        canRemove={canRemove}
        onAdd={() => log.addSet(session.id)}
        onRemove={() => log.removeLastSet(session.id)}
      />
    </Box>
  );
}
