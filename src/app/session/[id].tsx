import { router, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button, Pager } from "@/components/ui";
import { RestBox } from "@/components/workout/rest-box";
import { DURATION_SCALE, HistoryGraph, WEIGHT_SCALE } from "@/components/workout/history-graph";
import { SessionExerciseCard } from "@/components/workout/session-exercise-card";
import { StopwatchCard } from "@/components/workout/stopwatch-card";
import { borders, colors, space, type } from "@/constants/theme";
import { isStopwatch, stopwatchSet } from "@/data/stopwatch";
import { formatShortDate } from "@/lib/dates";
import { useLog } from "@/store/log";

/** One day's copy of a workout: log what was actually done, set by set, or start the timer. */
export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const log = useLog();
  const { bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const session = log.session(id);

  if (!session) {
    return (
      <AppText variant="label" align="center" style={{ marginTop: space.xl }}>
        This workout was removed.
      </AppText>
    );
  }

  // The timer runs the first exercise, so that's whose rest is edited here.
  const timed = session.exercises[0];
  const sets = session.exercises.flatMap((e) => e.sets);
  const stopwatch = isStopwatch(session);
  // A stopwatch carries on from its time, even once it's finished.
  const started = stopwatch
    ? !!session.runningSince || !!stopwatchSet(session)?.actual.seconds
    : sets.some((s) => s.done) && !sets.every((s) => s.done);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen options={{ title: session.date ? formatShortDate(session.date) : "Unscheduled" }} />

      {/* While the keypad is up it covers the Start button, and the field being typed in
          scrolls up to sit just above it. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: space.xl, gap: space.md }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Keeps the room the old "Edit saved workout" line took, so the card sits where it did. */}
        <AppText variant="header" align="center" style={{ marginBottom: type.note.lineHeight }}>
          {session.name}
        </AppText>

        {session.exercises.map((e) => {
          const set = e.sets[0];
          const card = stopwatch ? (
            <StopwatchCard
              session={session}
              onChangeSeconds={(seconds) => set && log.updateSet(session.id, e.id, set.id, { actual: { seconds } })}
            />
          ) : (
            <SessionExerciseCard
              exercise={e}
              onUpdateSet={(setId, change) => log.updateSet(session.id, e.id, setId, change)}
              onAddSet={() => log.addSet(session.id, e.id)}
              onRemoveSet={(setId) => log.removeSet(session.id, e.id, setId)}
            />
          );
          // Swipe left from the sets to this workout's weight (or a stopwatch's time) over time.
          // The pages reach into the screen padding so the graph's axis marks can sit there,
          // leaving its plot about as wide as the sets box.
          return session.templateId ? (
            <Pager key={e.id} labels={stopwatch ? ["time", "time graph"] : ["sets", "weight graph"]} bleed={space.md}>
              <View style={{ paddingHorizontal: space.md }}>{card}</View>
              {stopwatch ? (
                <HistoryGraph points={log.durationHistory(session.templateId)} scale={DURATION_SCALE} />
              ) : (
                <HistoryGraph points={log.weightHistory(session.templateId)} scale={WEIGHT_SCALE} />
              )}
            </Pager>
          ) : (
            <View key={e.id}>{card}</View>
          );
        })}

        {timed && !stopwatch && (
          <RestBox value={timed.prescription.restSeconds} onChange={(v) => log.setRest(session.id, timed.id, v)} />
        )}
      </ScrollView>

      {/* The bottom quarter of the screen; the Start button sits centered in it. */}
      <View
        style={{
          height: height / 4,
          paddingHorizontal: space.md,
          paddingTop: space.sm,
          paddingBottom: Math.max(bottom, space.md),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          label={started ? "Continue" : "Start"}
          variant="fill"
          textVariant="header"
          style={{ width: "85%", height: "40%", backgroundColor: colors.go, borderWidth: borders.thick, borderColor: colors.ink }}
          onPress={() => router.push({ pathname: "/timer/[id]", params: { id: session.id } })}
        />
      </View>
    </View>
  );
}
