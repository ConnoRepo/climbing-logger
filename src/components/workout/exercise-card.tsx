import { View } from "react-native";

import { AppText, Box, Checkbox, Pills, Stepper, TextField } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { MAX_SETS, MEASURES, fieldLabel, type FieldSpec } from "@/data/categories";
import { formatPrescription } from "@/data/format";
import type { Measure, Prescription } from "@/data/types";

type ExerciseCardProps = {
  prescription: Prescription;
  /** The measures this workout's category allows; pills are hidden if there's only one. */
  measures: Measure[];
  onChange: (patch: Partial<Prescription>) => void;
};

/** The numbers for a workout's exercise: how it's measured, sets, reps, rest… */
export function ExerciseCard({ prescription: p, measures, onChange }: ExerciseCardProps) {
  const spec = MEASURES[p.measure];
  const options = measures.map((m) => ({ value: m, label: MEASURES[m].label }));

  return (
    <Box style={{ padding: space.sm, gap: space.sm }}>
      <AppText variant="note" color={colors.placeholder}>
        {formatPrescription(p)}
      </AppText>

      {options.length > 1 && (
        <Pills options={options} selected={p.measure} onSelect={(measure) => onChange({ measure })} justify="flex-start" />
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.md, rowGap: space.sm }}>
        <Field label="Sets" value={p.sets} step={1} min={1} max={MAX_SETS} onChange={(sets) => onChange({ sets })} />
        {spec.fields.map((f: FieldSpec) => (
          <Field
            key={f.key}
            label={fieldLabel(f)}
            value={p[f.key]}
            step={f.step}
            min={f.min}
            onChange={(v) => onChange({ [f.key]: v })}
          />
        ))}
      </View>

      {spec.usesGrade && (
        <TextField
          placeholder="Grade, e.g. V4 or V2–V4"
          accessibilityLabel="Grade"
          value={p.grade ?? ""}
          onChangeText={(grade) => onChange({ grade })}
        />
      )}

      {(p.measure === "reps" || p.measure === "time") && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
          <Checkbox checked={!!p.perSide} onChange={(perSide) => onChange({ perSide })} label="Per side" />
          <AppText variant="button">Per side</AppText>
        </View>
      )}

      <TextField
        placeholder="Notes"
        accessibilityLabel="Notes"
        value={p.notes ?? ""}
        onChangeText={(notes) => onChange({ notes })}
      />
    </Box>
  );
}

function Field({
  label,
  ...stepper
}: {
  label: string;
  value: number | undefined;
  step: number;
  min: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ gap: 4 }}>
      <AppText variant="note">{label}</AppText>
      <Stepper label={label} {...stepper} />
    </View>
  );
}
