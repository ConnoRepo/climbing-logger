import { router, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button, Pager } from "@/components/ui";
import { HistoryWithNotes } from "@/components/workout/history-with-notes";
import { SessionLog } from "@/components/workout/session-log";
import { borders, colors, space, type } from "@/constants/theme";
import { isStarted, KIND_LABEL, sessionKind } from "@/data/kinds";
import { formatShortDate } from "@/lib/dates";
import { useLog } from "@/store/log";

/** The Start button's height: its area along the bottom is about half the quarter-screen it used to take. */
const START_HEIGHT = 60;

/**
 * One day's copy of a workout: log what was actually done, or start the timer. The same
 * for every kind of workout: its log (sets, or a stopwatch's time) swipes across to its
 * history graph and past notes.
 */
export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const log = useLog();
  const { bottom } = useSafeAreaInsets();
  const session = log.session(id);

  if (!session) {
    return (
      <AppText variant="label" align="center" style={{ marginTop: space.xl }}>
        This workout was removed.
      </AppText>
    );
  }

  // Every workout is one exercise (see migrate v2), which is what the timer runs.
  const exercise = session.exercises[0];
  const sessionLog = exercise && <SessionLog session={session} exercise={exercise} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen options={{ title: session.date ? formatShortDate(session.date) : "Unscheduled" }} />

      {/* While the keypad is up it covers the Start button, and the field being typed in
          scrolls up to sit just above it. Otherwise the log and history grow into all the
          room above the Start button. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: space.md, paddingBottom: space.md, gap: space.md }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Keeps the room the old "Edit saved workout" line took, so the card sits where it did. */}
        <AppText variant="header" align="center" style={{ marginBottom: type.note.lineHeight }}>
          {session.name}
        </AppText>

        {/* Swipe left from the log to the workout's graph over time and its past notes; the dots
            sit under the whole log. The pages reach into the screen padding so the graph's axis
            marks can sit there, leaving its plot about as wide as the log. With no workout
            behind it there's no history, so just the log. */}
        {exercise && session.templateId ? (
          <Pager labels={[KIND_LABEL[sessionKind(session)], "history"]} bleed={space.md} grow>
            <View style={{ flexGrow: 1, paddingHorizontal: space.md, gap: space.md }}>{sessionLog}</View>
            <HistoryWithNotes templateId={session.templateId} measure={exercise.prescription.measure} />
          </Pager>
        ) : (
          <View style={{ gap: space.md }}>{sessionLog}</View>
        )}
      </ScrollView>

      {/* Kept compact along the bottom, so the log and history above get the room. */}
      <View
        style={{
          paddingHorizontal: space.md,
          paddingTop: space.sm,
          paddingBottom: Math.max(bottom, space.md),
          alignItems: "center",
        }}
      >
        <Button
          label={isStarted(session) ? "Continue" : "Start"}
          variant="fill"
          textVariant="header"
          style={{ width: "85%", height: START_HEIGHT, backgroundColor: colors.go, borderWidth: borders.thick, borderColor: colors.ink }}
          onPress={() => router.push({ pathname: "/timer/[id]", params: { id: session.id } })}
        />
      </View>
    </View>
  );
}
