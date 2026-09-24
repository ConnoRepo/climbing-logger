import { View } from "react-native";

import { AppText, Box, Button } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { MAX_SETS, MEASURES } from "@/data/categories";
import { formatPrescription } from "@/data/format";
import type { SessionExercise, SetValues } from "@/data/types";

import { SetHeader, SetRow } from "./set-row";

type SessionExerciseCardProps = {
  exercise: SessionExercise;
  onUpdateSet: (setId: string, change: { actual?: SetValues; done?: boolean }) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
};

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

      <SetHeader fields={fields} />

      {exercise.sets.map((set) => (
        <SetRow key={set.id} set={set} fields={fields} onChange={(actual) => onUpdateSet(set.id, { actual })} />
      ))}

      {/* 15% more room above the buttons than between the other rows. */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: space.sm * 0.15 }}>
        <Button
          label="− Set"
          accessibilityLabel="Remove last set"
          disabled={!canRemove}
          style={{ width: 72, opacity: canRemove ? 1 : 0.35 }}
          onPress={() => last && onRemoveSet(last.id)}
        />
        <Button
          label="+ Set"
          accessibilityLabel="Add a set"
          disabled={!canAdd}
          style={{ width: 72, opacity: canAdd ? 1 : 0.35 }}
          onPress={onAddSet}
        />
      </View>
    </Box>
  );
}
