import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";

import { AppText, Box } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { MAX_SETS, MEASURES, type FieldSpec } from "@/data/categories";
import { formatClock, formatPrescription } from "@/data/format";
import { KIND_LABEL } from "@/data/kinds";
import type { SessionExercise, SetValues } from "@/data/types";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";
import { useLog } from "@/store/log";

import { SetButtons } from "./set-list";
import { SetHeader, SetRow } from "./set-row";
import { TimerLayout, type TimerProps } from "./timer-layout";

/**
 * Runs a workout set by set, with the rests between: a get-ready, then each timed step
 * counting down (or GO, for sets done at your own pace), with the sets under the clock.
 */
export function SetsTimer({ session, exercise }: TimerProps) {
  const log = useLog();
  const timer = useWorkoutTimer(session, exercise);
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
      body={
        <TimerSetList
          currentSetId={finished ? undefined : current?.setId}
          exercise={exercise}
          fields={MEASURES[exercise.prescription.measure].setFields}
          onUpdateSet={(setId, change) => log.updateSet(session.id, exercise.id, setId, change)}
          onAddSet={() => log.addSet(session.id, exercise.id)}
          onRemoveSet={(setId) => log.removeSet(session.id, exercise.id, setId)}
        />
      }
      controls={[
        { label: "Prev", onPress: timer.prev },
        { label: timer.isTimed && !timer.isRunning ? "Resume" : "Pause", onPress: timer.togglePause, disabled: !timer.isTimed },
        { label: timer.isLast ? "Finish" : "Next", onPress: timer.next, disabled: !current },
      ]}
    />
  );
}

type TimerSetListProps = {
  /** The set being done, or rested after; highlighted. */
  currentSetId?: string;
  exercise: SessionExercise;
  fields: FieldSpec[];
  onUpdateSet: (setId: string, change: { actual?: SetValues; done?: boolean }) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
};

/**
 * The workout screen's set card. The current set is highlighted and drawn
 * larger, and stays that way through the rest after it (the rest counts down
 * on the clock above); only Prev / Next move between sets. Scrolls once there
 * are more sets than fit. Once the workout is finished nothing is highlighted.
 */
function TimerSetList({ currentSetId, exercise, fields, onUpdateSet, onAddSet, onRemoveSet }: TimerSetListProps) {
  const scrollRef = useRef<ScrollView>(null);
  const rowY = useRef<Record<string, number>>({});
  const currentIndex = exercise.sets.findIndex((s) => s.id === currentSetId);
  // Keep the set before the current one in view, landing on a row edge rather than mid-row.
  const prevSetId = exercise.sets[currentIndex - 1]?.id;
  const scrollToCurrent = (animated: boolean) =>
    scrollRef.current?.scrollTo({ y: prevSetId ? (rowY.current[prevSetId] ?? 0) : 0, animated });
  const last = exercise.sets.at(-1);
  const canAdd = exercise.sets.length < MAX_SETS;
  const canRemove = !!last && exercise.sets.length > 1 && !last.done && last.id !== currentSetId;

  useEffect(() => {
    if (currentSetId && rowY.current[currentSetId] !== undefined) scrollToCurrent(true);
  }, [currentSetId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box style={{ flex: 1, minHeight: 200, padding: space.sm, gap: space.sm }}>
      <AppText variant="note" color={colors.placeholder} align="center">
        Planned: {formatPrescription(exercise.prescription)}
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
        {exercise.sets.map((set) => {
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
                position={set.position}
                values={set.actual}
                done={set.done}
                fields={fields}
                onChange={(actual) => onUpdateSet(set.id, { actual })}
                onToggleDone={(done) => onUpdateSet(set.id, { done })}
                active={isCurrent}
              />
            </View>
          );
        })}
      </ScrollView>

      <SetButtons
        canAdd={canAdd}
        canRemove={canRemove}
        onAdd={onAddSet}
        onRemove={() => last && onRemoveSet(last.id)}
      />
    </Box>
  );
}
