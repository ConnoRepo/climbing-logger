import { AppText, Box } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { MEASURES } from "@/data/categories";
import { formatPrescription } from "@/data/format";
import type { SessionExercise, SetValues } from "@/data/types";

import { SetList } from "./set-list";

type SessionExerciseCardProps = {
  exercise: SessionExercise;
  onUpdateSet: (setId: string, change: { actual?: SetValues; done?: boolean }) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
};

/** Logs what was actually done, set by set. */
export function SessionExerciseCard({ exercise, onUpdateSet, onAddSet, onRemoveSet }: SessionExerciseCardProps) {
  const last = exercise.sets.at(-1);

  return (
    <Box style={{ padding: space.sm, gap: space.sm }}>
      <AppText variant="note" color={colors.placeholder} align="center">
        Planned: {formatPrescription(exercise.prescription)}
      </AppText>

      <SetList
        sets={exercise.sets.map((set) => ({ key: set.id, values: set.actual }))}
        fields={MEASURES[exercise.prescription.measure].setFields}
        onChange={(i, actual) => onUpdateSet(exercise.sets[i].id, { actual })}
        onAdd={onAddSet}
        onRemove={() => last && onRemoveSet(last.id)}
      />
    </Box>
  );
}
