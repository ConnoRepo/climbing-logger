import { View } from "react-native";

import { AppText, Box, Button, Checkbox } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { MAX_SETS, MEASURES, fieldLabel } from "@/data/categories";
import { formatPrescription } from "@/data/format";
import type { SessionExercise, SetValues } from "@/data/types";

import { SetSteppers } from "./set-steppers";

type SessionExerciseCardProps = {
  exercise: SessionExercise;
  onUpdateSet: (setId: string, change: { actual?: SetValues; done?: boolean }) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
};

const SET_COL = 36;

/** Logs what was actually done, set by set. */
export function SessionExerciseCard({ exercise, onUpdateSet, onAddSet, onRemoveSet }: SessionExerciseCardProps) {
  const fields = MEASURES[exercise.prescription.measure].setFields;
  const last = exercise.sets.at(-1);
  const canAdd = exercise.sets.length < MAX_SETS;
  const canRemove = exercise.sets.length > 1;

  return (
    <Box style={{ padding: space.sm, gap: space.sm }}>
      <AppText variant="note" color={colors.placeholder} align="center">
        Planned: {formatPrescription(exercise.prescription)}
      </AppText>

      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <AppText variant="note" style={{ width: SET_COL }}>
          Set
        </AppText>
        {fields.map((f) => (
          <AppText key={f.key} variant="note" style={{ width: 104 }}>
            {fieldLabel(f)}
          </AppText>
        ))}
      </View>

      {exercise.sets.map((set) => (
        <View key={set.id} style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: 2 }}>
          <AppText variant="label" style={{ width: SET_COL }}>
            {set.position + 1}
          </AppText>
          <SetSteppers set={set} fields={fields} onChange={(actual) => onUpdateSet(set.id, { actual })} />
          <View style={{ flex: 1 }} />
          <Checkbox checked={set.done} onChange={(done) => onUpdateSet(set.id, { done })} label={`Set ${set.position + 1} done`} />
        </View>
      ))}

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Button
          label="− Remove set"
          accessibilityLabel="Remove last set"
          disabled={!canRemove}
          style={{ width: 120, opacity: canRemove ? 1 : 0.35 }}
          onPress={() => last && onRemoveSet(last.id)}
        />
        <Button
          label="+ Add set"
          disabled={!canAdd}
          style={{ width: 100, opacity: canAdd ? 1 : 0.35 }}
          onPress={onAddSet}
        />
      </View>
    </Box>
  );
}
