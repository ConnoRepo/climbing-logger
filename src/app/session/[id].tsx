import { router, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button, Pager } from "@/components/ui";
import { HistoryWithNotes } from "@/components/workout/history-with-notes";
import { SessionLog } from "@/components/workout/session-log";
import { borders, colors, space, type } from "@/constants/theme";
import { isStarted, KIND_LABEL, sessionKind } from "@/data/sessions";
import { formatShortDate } from "@/lib/dates";
import { useLog } from "@/store/log";

/** The Start button's height: compact, so the log and history above get the room. */
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
        {/* A note line's worth of room under the name, before the card. */}
        <AppText variant="header" align="center" style={{ marginBottom: type.note.lineHeight }}>
          {session.name}
        </AppText>

        {/* Swipe left from the log to the workout's graph over time and its past notes; the dots
            sit under the whole log. The pages reach into the screen padding so the graph's axis
            marks can sit there, leaving its plot about as wide as the log. */}
        <Pager labels={[KIND_LABEL[sessionKind(session)], "history"]} bleed={space.md} grow>
          <View style={{ flexGrow: 1, paddingHorizontal: space.md, gap: space.md }}>
            <SessionLog session={session} />
          </View>
          <HistoryWithNotes templateId={session.templateId} measure={session.prescription.measure} />
        </Pager>
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
