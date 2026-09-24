import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Box, Button } from "@/components/ui";
import { SetHeader, SetRow } from "@/components/workout/set-row";
import { borders, colors, space } from "@/constants/theme";
import { MAX_SETS, MEASURES, type FieldSpec } from "@/data/categories";
import { formatClock, formatPrescription, formatWeight } from "@/data/format";
import type { TimerStep } from "@/data/timer-steps";
import type { Session, SessionExercise, SetLog, SetValues } from "@/data/types";
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
  return <WorkoutTimer session={session} exercise={exercise} />;
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
            {caption(current, set, fields)}
          </AppText>
        )}
      </Box>

      <SetList
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

type SetListProps = {
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
function SetList({ timer, exercise, fields, onUpdateSet, onAddSet, onRemoveSet }: SetListProps) {
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
          spilling out of a Done box isn't clipped at the right or above the first set. */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, marginHorizontal: -space.sm }}
        contentContainerStyle={{ gap: 4, paddingHorizontal: space.sm, paddingTop: space.xs }}
        keyboardShouldPersistTaps="handled"
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
                set={set}
                fields={fields}
                onChange={(actual) => onUpdateSet(set.id, { actual })}
                onToggleDone={(done) => onUpdateSet(set.id, { done })}
                active={isCurrent}
              />
            </View>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Button
          label="− Set"
          accessibilityLabel="Remove last set"
          disabled={!canRemove}
          style={{ width: 72, opacity: canRemove ? 1 : 0.35 }}
          onPress={() => last && onRemoveSet(last.id)}
        />
        <Button
          label="+ Set"
          accessibilityLabel="Add a set"
          disabled={!canAdd}
          style={{ width: 72, opacity: canAdd ? 1 : 0.35 }}
          onPress={onAddSet}
        />
      </View>
    </Box>
  );
}

/** Line under the clock: "Set 2 · 6 reps · +25 lb", "Set 1 · Hang 3/6 · On", "Rest · Set 3 next". */
function caption(step: TimerStep, set: SetLog, fields: FieldSpec[]) {
  if (step.kind === "rest") return `Rest · Set ${step.setNumber + 1} next`;
  const parts = [`Set ${step.setNumber}`];
  if (step.hang) {
    parts.push(`Hang ${step.hang.index}/${step.hang.of}`, step.hang.phase === "on" ? "On" : "Off");
  } else {
    for (const f of fields) {
      const key = f.key as keyof SetValues;
      const v = set.planned[key] ?? set.actual[key];
      if (!v) continue;
      parts.push(key === "weightLb" ? formatWeight(v) : key === "seconds" ? "Hold" : `${v} ${f.unit}`);
    }
  }
  return parts.join(" · ");
}
