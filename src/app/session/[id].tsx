import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Button } from "@/components/ui";
import { SessionExerciseCard } from "@/components/workout/session-exercise-card";
import { borders, colors, space } from "@/constants/theme";
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

  const template = session.templateId ? log.template(session.templateId) : undefined;
  const sets = session.exercises.flatMap((e) => e.sets);
  const started = sets.some((s) => s.done) && !sets.every((s) => s.done);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen options={{ title: formatShortDate(session.date) }} />

      <ScrollView
        style={{ flex: 1 }}
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
      </ScrollView>

      {/* The lower third of the whole screen; the button sits centered in it at half size. */}
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
