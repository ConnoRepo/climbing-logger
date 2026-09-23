import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { AppText, Button, TextField } from "@/components/ui";
import { SessionExerciseCard } from "@/components/workout/session-exercise-card";
import { colors, space } from "@/constants/theme";
import { categoryInfo } from "@/data/categories";
import { formatShortDate } from "@/lib/dates";
import { useLog } from "@/store/log";

/** One day's copy of a workout: log what was actually done, set by set. */
export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const log = useLog();
  const session = log.session(id);
  const [newExercise, setNewExercise] = useState("");

  if (!session) {
    return (
      <AppText variant="label" align="center" style={{ marginTop: space.xl }}>
        This workout was removed.
      </AppText>
    );
  }

  const done = session.status === "done";
  const template = session.templateId ? log.template(session.templateId) : undefined;

  function addExercise() {
    const name = newExercise.trim();
    if (!name || !session) return;
    log.addSessionExercise(session.id, name, categoryInfo(session.category).defaultMeasure);
    setNewExercise("");
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ paddingHorizontal: space.md, paddingBottom: space.xl, gap: space.md }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: formatShortDate(session.date) }} />

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

      {session.exercises.length === 0 && (
        <AppText variant="note" color={colors.placeholder} align="center">
          No exercises yet. Add one below, or add some to the saved workout.
        </AppText>
      )}

      {session.exercises.map((e) => (
        <SessionExerciseCard
          key={e.id}
          exercise={e}
          onUpdateSet={(setId, change) => log.updateSet(session.id, e.id, setId, change)}
          onAddSet={() => log.addSet(session.id, e.id)}
          onRemoveSet={(setId) => log.removeSet(session.id, e.id, setId)}
          onRemove={() => log.removeSessionExercise(session.id, e.id)}
        />
      ))}

      <View style={{ flexDirection: "row", gap: space.xs }}>
        <TextField
          placeholder="Add an exercise for today"
          accessibilityLabel="New exercise name"
          value={newExercise}
          onChangeText={setNewExercise}
          onSubmitEditing={addExercise}
          returnKeyType="done"
          style={{ flex: 1 }}
        />
        <Button label="Add" style={{ width: 60 }} onPress={addExercise} />
      </View>

      <Button
        label={done ? "Done ✓  (tap to undo)" : "Mark done"}
        variant={done ? "fill" : "outline"}
        style={{ alignSelf: "center", minHeight: 44, paddingHorizontal: space.md }}
        onPress={() => log.setSessionDone(session.id, !done)}
      />
    </ScrollView>
  );
}
