import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, Pills, TextField } from "@/components/ui";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { colors, space } from "@/constants/theme";
import { CATEGORIES } from "@/data/categories";
import { useLog } from "@/store/log";

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c.id, label: c.label }));

/** Edits a saved workout. Days it was already added to keep their own copy. */
export default function TemplateEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const log = useLog();
  const template = log.template(id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: space.md, paddingTop: space.xs }}>
        <Button label="Done" style={{ width: 100 }} onPress={() => router.back()} />
      </View>

      {!template ? (
        <AppText variant="label" align="center" style={{ marginTop: space.xl }}>
          This workout was deleted.
        </AppText>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: space.md, paddingVertical: space.md, gap: space.md }}
          keyboardShouldPersistTaps="handled"
        >
          <TextField
            variant="header"
            underline
            accessibilityLabel="Workout name"
            value={template.name}
            onChangeText={(name) => log.updateTemplate(template.id, { name })}
          />
          <Pills
            options={CATEGORY_OPTIONS}
            selected={template.category}
            onSelect={(category) => log.updateTemplate(template.id, { category })}
          />

          {template.exercises.map((p, i) => (
            <ExerciseCard
              key={p.id}
              prescription={p}
              isFirst={i === 0}
              isLast={i === template.exercises.length - 1}
              onChange={(patch) => log.updateTemplateExercise(template.id, p.id, patch)}
              onMove={(by) => log.moveTemplateExercise(template.id, p.id, by)}
              onRemove={() => log.removeTemplateExercise(template.id, p.id)}
            />
          ))}

          <Button label="+ Exercise" style={{ alignSelf: "center", width: 120 }} onPress={() => log.addTemplateExercise(template.id)} />

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
      )}
    </SafeAreaView>
  );
}
