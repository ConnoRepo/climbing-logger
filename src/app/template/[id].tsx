import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, TextField } from "@/components/ui";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { colors, space } from "@/constants/theme";
import { categoryInfo } from "@/data/categories";
import { templateExercise } from "@/data/templates";
import type { WorkoutTemplate } from "@/data/types";
import { useCommittedText } from "@/hooks/use-committed-text";
import { useLog } from "@/store/log";

/** Edits a saved workout. Days it was already added to keep their own copy. */
export default function TemplateEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const template = useLog().template(id);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: space.md, paddingTop: space.xs }}>
        <Button label="Done" style={{ width: 100 }} onPress={() => router.back()} />
      </View>

      {template ? (
        <Editor template={template} />
      ) : (
        <AppText variant="label" align="center" style={{ marginTop: space.xl }}>
          This workout was deleted.
        </AppText>
      )}
    </SafeAreaView>
  );
}

function Editor({ template }: { template: WorkoutTemplate }) {
  const log = useLog();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const exercise = templateExercise(template);

  // The name updates live; once typing finishes it also links the exercise to the library.
  const name = useCommittedText(template.name, {
    onChange: (value) => log.updateTemplate(template.id, { name: value }),
    onCommit: (value) => exercise && log.updateTemplateExercise(template.id, exercise.id, { name: value }),
  });

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: space.md, paddingVertical: space.md, gap: space.md }}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        <TextField variant="header" underline accessibilityLabel="Workout name" {...name} />
        <AppText variant="note" color={colors.placeholder} style={{ marginTop: 4 }}>
          {categoryInfo(template.category).label}
        </AppText>
      </View>

      {exercise && (
        <ExerciseCard
          prescription={exercise}
          measures={categoryInfo(template.category).measures}
          onChange={(patch) => log.updateTemplateExercise(template.id, exercise.id, patch)}
        />
      )}

      <AppText variant="note" color={colors.placeholder} align="center">
        Changes apply the next time you add this workout.{"\n"}Days it&apos;s already on keep their own copy.
      </AppText>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (!confirmDelete) return setConfirmDelete(true);
          log.deleteTemplate(template.id);
          router.back();
        }}
        style={{ alignSelf: "center", padding: space.sm }}
      >
        <AppText variant="button" color={colors.danger}>
          {confirmDelete ? "Tap again to delete" : "Delete workout"}
        </AppText>
      </Pressable>
    </ScrollView>
  );
}
