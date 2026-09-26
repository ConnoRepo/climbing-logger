import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Box, Button } from "@/components/ui";
import { SetButtons } from "@/components/workout/set-list";
import { SetHeader, SetRow } from "@/components/workout/set-row";
import { borders, colors, space } from "@/constants/theme";
import { MAX_SETS, MEASURES, type FieldSpec } from "@/data/categories";
import { formatClock, formatElapsed, formatPrescription } from "@/data/format";
import { isStopwatch, stopwatchSet } from "@/data/stopwatch";
import { stepCaption } from "@/data/timer-steps";
import type { Session, SessionExercise, SetValues } from "@/data/types";
import { useLiveActivity } from "@/hooks/use-live-activity";
import { useStopwatch } from "@/hooks/use-stopwatch";
import { useWorkoutTimer } from "@/hooks/use-workout-timer";
import { useLog } from "@/store/log";

/** Runs a scheduled workout set by set, laid out like the Figma timer frame. */
export default function TimerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useLog().session(id);
  const exercise = session?.exercises[0];

  if (!session || !exercise) {
    return (
      <AppText variant="label" align="center" style={{ marginTop: space.xl }}>
        This workout was removed.
      </AppText>
    );
  }
  return isStopwatch(session) ? <StopwatchTimer session={session} /> : <WorkoutTimer session={session} exercise={exercise} />;
}

/** An open-ended session: one clock counting up, until Finish logs its time. */
function StopwatchTimer({ session }: { session: Session }) {
  const log = useLog();
  const { bottom } = useSafeAreaInsets();
  const { running, elapsedMs } = useStopwatch(session);

  // The user tapped Start (or Continue) to get here, so the clock starts right away.
  useEffect(() => {
    if (!session.runningSince) log.startStopwatch(session.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // iOS runs the Lock Screen clock itself, so it only hears about starts and pauses:
  // running, it counts from when the clock would have read 0:00.
  const counted = (stopwatchSet(session)?.actual.seconds ?? 0) * 1000;
  const clock = session.runningSince
    ? { countUpFrom: Date.parse(session.runningSince) - counted }
    : { pausedElapsedMs: counted };
  useLiveActivity(
    { title: session.name, caption: running ? "Session running" : "Paused", ...clock },
    `climbingapp://timer/${session.id}`,
  );

  function finish() {
    log.finishStopwatch(session.id);
    router.dismissTo("/");
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: 15, paddingBottom: Math.max(bottom, space.md), gap: space.md }}>
      <Stack.Screen options={{ title: session.name }} />

      <Box fill={running ? "go" : "fill"} style={{ height: 169, alignItems: "center", justifyContent: "center" }}>
        <AppText variant="display" style={{ fontVariant: ["tabular-nums"] }}>
          {formatElapsed(elapsedMs)}
        </AppText>
        <AppText variant="label" align="center">
          {running ? "Running" : "Paused"}
        </AppText>
      </Box>

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: "row", justifyContent: "space-evenly", paddingHorizontal: 12 }}>
        <Button
          label={running ? "Pause" : "Resume"}
          variant="fill"
          textVariant="label"
          style={[CONTROL, { width: 140 }]}
          onPress={() => (running ? log.pauseStopwatch(session.id) : log.startStopwatch(session.id))}
        />
        <Button label="Finish" variant="fill" textVariant="label" style={[CONTROL, { width: 140 }]} onPress={finish} />
      </View>
    </View>
  );
}

function WorkoutTimer({ session, exercise }: { session: Session; exercise: SessionExercise }) {
  const log = useLog();
  const { bottom } = useSafeAreaInsets();
  const timer = useWorkoutTimer(session, exercise, () => router.dismissTo("/"));
  const { current } = timer;

  const fields = MEASURES[exercise.prescription.measure].setFields;
  const set = exercise.sets.find((s) => s.id === current?.setId);

  return (
    <View style={{ flex: 1, paddingHorizontal: 15, paddingBottom: Math.max(bottom, space.md), gap: space.md }}>
      <Stack.Screen options={{ title: session.name }} />

      <Box fill={current && !timer.isTimed ? "go" : "fill"} style={{ height: 169, alignItems: "center", justifyContent: "center" }}>
        <AppText variant="display" style={{ fontVariant: ["tabular-nums"] }}>
          {!current ? "—" : timer.isTimed ? formatClock(timer.remainingMs) : "GO"}
        </AppText>
        {current && set && (
          <AppText variant="label" align="center">
            {stepCaption(current, set, fields)}
          </AppText>
        )}
      </Box>

      <TimerSetList
        timer={timer}
        exercise={exercise}
        fields={fields}
        onUpdateSet={(setId, change) => log.updateSet(session.id, exercise.id, setId, change)}
        onAddSet={() => log.addSet(session.id, exercise.id)}
        onRemoveSet={(setId) => log.removeSet(session.id, exercise.id, setId)}
      />

      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12 }}>
        <Button label="Prev" variant="fill" textVariant="label" style={[CONTROL, { width: 110 }]} onPress={timer.prev} />
        <Button
          label={timer.isTimed && !timer.isRunning ? "Resume" : "Pause"}
          variant="fill"
          textVariant="label"
          disabled={!timer.isTimed}
          style={[CONTROL, { width: 110, opacity: timer.isTimed ? 1 : 0.35 }]}
          onPress={timer.togglePause}
        />
        <Button
          label={timer.isLast ? "Finish" : "Next"}
          variant="fill"
          textVariant="label"
          disabled={!current}
          style={[CONTROL, { width: 110 }]}
          onPress={timer.next}
        />
      </View>
    </View>
  );
}

/** Prev / Pause / Next, outlined like the workout screen's Start button. */
const CONTROL = { height: 48, borderWidth: borders.thick, borderColor: colors.ink };

type TimerSetListProps = {
  timer: ReturnType<typeof useWorkoutTimer>;
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
 * are more sets than fit.
 */
function TimerSetList({ timer, exercise, fields, onUpdateSet, onAddSet, onRemoveSet }: TimerSetListProps) {
  const scrollRef = useRef<ScrollView>(null);
  const rowY = useRef<Record<string, number>>({});
  // On a rest this is the set just finished.
  const currentSetId = timer.current?.setId;
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

      {/* Scrolls edge to edge inside the card, with the padding moved onto the content, so a tick
          spilling out of a Done box isn't clipped at the right or above the first set.
          While the keypad is up, the set being typed in scrolls up to sit just above it. */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, marginHorizontal: -space.sm }}
        contentContainerStyle={{ gap: 4, paddingHorizontal: space.sm, paddingTop: space.xs }}
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
              style={{ paddingVertical: 4, backgroundColor: isCurrent ? colors.fillLight : undefined }}
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
