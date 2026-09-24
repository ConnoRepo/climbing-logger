import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Box, Button, Checkbox } from "@/components/ui";
import { SetSteppers } from "@/components/workout/set-steppers";
import { colors, space } from "@/constants/theme";
import { fieldLabel, MAX_SETS, MEASURES, type FieldSpec } from "@/data/categories";
import { formatClock, formatSeconds, formatWeight } from "@/data/format";
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
  // On a rest this is the set just finished, so "how many did I really get" can be logged.
  const set = exercise.sets.find((s) => s.id === current?.setId);
  const last = exercise.sets.at(-1);
  const canAdd = exercise.sets.length < MAX_SETS;
  const canRemoveLast = !!last && exercise.sets.length > 1 && !last.done && last.id !== current?.setId;

  return (
    <View style={{ flex: 1, paddingHorizontal: 15, paddingBottom: Math.max(bottom, space.md), gap: space.md }}>
      <Stack.Screen options={{ title: session.name }} />

      <Box border="none" fill={current && !timer.isTimed ? "go" : "fill"} style={{ height: 169, alignItems: "center", justifyContent: "center" }}>
        <AppText variant="display" style={{ fontVariant: ["tabular-nums"] }}>
          {!current ? "—" : timer.isTimed ? formatClock(timer.remainingMs) : "GO"}
        </AppText>
        {current && set && (
          <AppText variant="label" align="center">
            {caption(current, set, fields)}
          </AppText>
        )}
      </Box>

      <StepTable
        timer={timer}
        exercise={exercise}
        fields={fields}
        onToggleDone={(setId, done) => log.updateSet(session.id, exercise.id, setId, { done })}
      />

      {set && (
        <View style={{ gap: space.xs }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Button
              label="− Set"
              style={{ width: 64, opacity: canRemoveLast ? 1 : 0.35 }}
              disabled={!canRemoveLast}
              accessibilityLabel="Remove last set"
              onPress={() => last && log.removeSet(session.id, exercise.id, last.id)}
            />
            <AppText variant="label">Set {set.position + 1}</AppText>
            <Button
              label="+ Set"
              disabled={!canAdd}
              style={{ width: 64, opacity: canAdd ? 1 : 0.35 }}
              accessibilityLabel="Add a set"
              onPress={() => log.addSet(session.id, exercise.id)}
            />
          </View>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            {fields.map((f) => (
              <AppText key={f.key} variant="note" style={{ width: 104 }}>
                {fieldLabel(f)}
              </AppText>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <SetSteppers
              set={set}
              fields={fields}
              onChange={(actual) => log.updateSet(session.id, exercise.id, set.id, { actual })}
            />
          </View>
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12 }}>
        <Button label="Prev Step" variant="fill" textVariant="label" style={{ width: 90, height: 48 }} onPress={timer.prev} />
        <Button
          label={timer.isTimed && !timer.isRunning ? "Resume" : "Pause"}
          variant="fill"
          textVariant="label"
          disabled={!timer.isTimed}
          style={{ width: 128, height: 48, opacity: timer.isTimed ? 1 : 0.35 }}
          onPress={timer.togglePause}
        />
        <Button
          label={timer.isLast ? "Finish" : "Next Step"}
          variant="fill"
          textVariant="label"
          disabled={!current}
          style={{ width: 110, height: 48 }}
          onPress={timer.next}
        />
      </View>
    </View>
  );
}

type StepTableProps = {
  timer: ReturnType<typeof useWorkoutTimer>;
  exercise: SessionExercise;
  fields: FieldSpec[];
  onToggleDone: (setId: string, done: boolean) => void;
};

const SET_COL = 72;
const DONE_COL = 44;

/**
 * Set · weight · done table with a small "Rest" line between sets. The current
 * step is highlighted and the rest are dimmed; tap a set to jump to it.
 * Scrolls once there are more sets than fit.
 */
function StepTable({ timer, exercise, fields, onToggleDone }: StepTableProps) {
  const scrollRef = useRef<ScrollView>(null);
  const rowY = useRef<Record<string, number>>({});
  const currentKey = timer.rows[timer.rowIndex]?.key;
  // Weight when the exercise logs it, otherwise its main number (problems, hold time).
  const valueField = fields.find((f) => f.key === "weightKg") ?? fields[0];
  const rest = exercise.prescription.restSeconds;

  useEffect(() => {
    const y = currentKey ? rowY.current[currentKey] : undefined;
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 60), animated: true });
  }, [currentKey]);

  return (
    <Box border="none" fill="fill" style={{ flex: 1, minHeight: 160, paddingTop: space.xs }}>
      <View style={{ flexDirection: "row", paddingHorizontal: space.sm + space.xs, paddingBottom: 4 }}>
        <AppText variant="note" style={{ width: SET_COL }}>
          Set
        </AppText>
        <AppText variant="note" style={{ flex: 1 }}>
          {valueField?.label}
        </AppText>
        <AppText variant="note" align="center" style={{ width: DONE_COL }}>
          Done
        </AppText>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.sm }}>
        {timer.rows.map((row, i) => {
          const isCurrent = i === timer.rowIndex;
          const set = exercise.sets.find((s) => s.id === row.setId);
          const rowStyle = {
            marginHorizontal: space.xs,
            paddingHorizontal: space.sm,
            backgroundColor: isCurrent ? colors.paper : undefined,
            opacity: isCurrent ? 1 : 0.4,
          };
          const onLayout = (y: number) => {
            rowY.current[row.key] = y;
            // Rows lay out after the first scroll effect, so opening mid-workout scrolls here.
            if (isCurrent) scrollRef.current?.scrollTo({ y: Math.max(0, y - 60), animated: false });
          };

          if (row.kind === "rest") {
            return (
              <View key={row.key} onLayout={(e) => onLayout(e.nativeEvent.layout.y)} style={[rowStyle, { paddingVertical: 2 }]}>
                <AppText variant="note" style={{ marginLeft: SET_COL }}>
                  Rest{rest ? ` · ${formatSeconds(rest)}` : ""}
                </AppText>
              </View>
            );
          }

          return (
            <Pressable
              key={row.key}
              accessibilityRole="button"
              accessibilityLabel={`Go to set ${row.setNumber}`}
              accessibilityState={{ selected: isCurrent }}
              onPress={() => timer.jumpTo(row.key)}
              onLayout={(e) => onLayout(e.nativeEvent.layout.y)}
              style={[rowStyle, { flexDirection: "row", alignItems: "center", minHeight: 48 }]}
            >
              <AppText variant="row" style={{ width: SET_COL }}>
                {row.setNumber}
              </AppText>
              <AppText variant="label" style={{ flex: 1 }} numberOfLines={1}>
                {set && valueField ? formatValue(valueField, set.actual) : ""}
              </AppText>
              <View style={{ width: DONE_COL, alignItems: "center" }}>
                {set && (
                  <Checkbox checked={set.done} onChange={(done) => onToggleDone(set.id, done)} label={`Set ${row.setNumber} done`} />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Box>
  );
}

/** "+10 kg" / "Bodyweight", "4 problems", "30s". */
function formatValue(f: FieldSpec, values: SetValues) {
  const v = values[f.key as keyof SetValues];
  if (f.key === "weightKg") return v ? formatWeight(v) : "Bodyweight";
  if (v === undefined) return "–";
  return f.key === "seconds" ? formatSeconds(v) : `${v} ${f.unit}`;
}

/** Line under the clock: "Set 2 · 6 reps · +10 kg", "Set 1 · Hang 3/6 · On", "Rest · Set 3 next". */
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
      parts.push(key === "weightKg" ? formatWeight(v) : key === "seconds" ? "Hold" : `${v} ${f.unit}`);
    }
  }
  return parts.join(" · ");
}
