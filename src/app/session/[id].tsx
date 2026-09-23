import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button } from "@/components/ui";
import { SessionExerciseCard } from "@/components/workout/session-exercise-card";
import { colors, space } from "@/constants/theme";
import { formatShortDate } from "@/lib/dates";
import { useLog } from "@/store/log";

/** One day's copy of a workout: log what was actually done, set by set, or start the timer. */
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

  const done = session.status === "done";
  const template = session.templateId ? log.template(session.templateId) : undefined;
  const sets = session.exercises.flatMap((e) => e.sets);
  const started = sets.some((s) => s.done) && !sets.every((s) => s.done);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen options={{ title: formatShortDate(session.date) }} />

      <ScrollView
        style={{ flex: 2 }}
        contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: space.xl, gap: space.md }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: "center" }}>
          <AppText variant="header" align="center">
            {session.name}
          </AppText>
          {template && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/template/[id]", params: { id: template.id } })}
              hitSlop={8}
            >
              <AppText variant="note" color={colors.placeholder} style={{ textDecorationLine: "underline" }}>
                Edit saved workout
              </AppText>
            </Pressable>
          )}
        </View>

        {session.exercises.map((e) => (
          <SessionExerciseCard
            key={e.id}
            exercise={e}
            onUpdateSet={(setId, change) => log.updateSet(session.id, e.id, setId, change)}
            onAddSet={() => log.addSet(session.id, e.id)}
            onRemoveSet={(setId) => log.removeSet(session.id, e.id, setId)}
          />
        ))}

        <Button
          label={done ? "Done ✓  (tap to undo)" : "Mark done"}
          variant={done ? "fill" : "outline"}
          style={{ alignSelf: "center", minHeight: 44, paddingHorizontal: space.md }}
          onPress={() => log.setSessionDone(session.id, !done)}
        />
      </ScrollView>

      <View style={{ flex: 1, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: Math.max(bottom, space.md) }}>
        <Button
          label={started ? "Continue" : "Start"}
          variant="fill"
          textVariant="display"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: "/timer/[id]", params: { id: session.id } })}
        />
      </View>
    </View>
  );
}
