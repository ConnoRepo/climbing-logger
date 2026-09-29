import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, TextField } from "@/components/ui";
import { PrescriptionCard } from "@/components/workout/prescription-card";
import { RestBox } from "@/components/workout/rest-box";
import { colors, space } from "@/constants/theme";
import { categoryInfo } from "@/data/categories";
import { MEASURES, restsBetweenReps } from "@/data/measures";
import type { Prescription, WorkoutTemplate } from "@/data/types";
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
  const p = template.prescription;
  const update = (patch: Partial<Prescription>) => log.updatePrescription(template.id, patch);

  return (
    // The field being typed in scrolls up to sit just above the keyboard.
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: space.md, paddingVertical: space.md, gap: space.md }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View>
        <TextField
          variant="header"
          underline
          accessibilityLabel="Workout name"
          value={template.name}
          onChangeText={(name) => log.renameTemplate(template.id, name)}
        />
        <AppText variant="note" color={colors.placeholder} style={{ marginTop: 4 }}>
          {categoryInfo(template.category).label}
        </AppText>
      </View>

      <PrescriptionCard prescription={p} measures={categoryInfo(template.category).measures} onChange={update} />
      {/* A stopwatch session has no sets to rest between. */}
      {MEASURES[p.measure].kind === "sets" && (
        <RestBox value={p.restSeconds} onChange={(restSeconds) => update({ restSeconds })} />
      )}
      {/* Under rest between sets, so turning it on leaves everything above where it was. */}
      {restsBetweenReps(p) && (
        <RestBox between="reps" value={p.offSeconds} onChange={(offSeconds) => update({ offSeconds })} />
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
