import { View } from "react-native";

import { AppText, Box, Checkbox, Pills, Stepper, TextField } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { MEASURES, carriedForward, fieldLabel, plannedSets, type FieldSpec } from "@/data/categories";
import { formatPrescription } from "@/data/format";
import type { Measure, Prescription, SetValues } from "@/data/types";

import { SetList } from "./set-list";

type ExerciseCardProps = {
  prescription: Prescription;
  /** The measures this workout's category allows; pills are hidden if there's only one. */
  measures: Measure[];
  onChange: (patch: Partial<Prescription>) => void;
};

/**
 * The plan for a workout's exercise, laid out like the day view's set card:
 * a row per set, then the settings shared by every set. Rest is edited
 * outside the card (see RestBox).
 */
export function ExerciseCard({ prescription: p, measures, onChange }: ExerciseCardProps) {
  const spec = MEASURES[p.measure];
  const options = measures.map((m) => ({ value: m, label: MEASURES[m].label }));
  // Fields shared by every set (hang on/off, edge…): not per set, and not rest.
  const shared = spec.fields.filter((f) => f.key !== "restSeconds" && !spec.setFields.some((s) => s.key === f.key));
  const sets = plannedSets(p);

  // The flat fields follow set 1, for anything that reads the plan without per-set values.
  const setSets = (next: SetValues[]) => onChange({ sets: next.length, setValues: next, ...next[0] });

  function updateSet(index: number, values: SetValues) {
    // As on a day: new reps or weight carry forward to every later set.
    const carried = carriedForward(values);
    setSets(
      sets.map((set, i) => {
        if (i === index) return { ...set, ...values };
        if (carried && i > index) return { ...set, ...carried };
        return set;
      }),
    );
  }

  return (
    <Box style={{ padding: space.sm, gap: space.sm }}>
      <AppText variant="note" color={colors.placeholder} align="center">
        {formatPrescription(p)}
      </AppText>

      {options.length > 1 && <Pills options={options} selected={p.measure} onSelect={(measure) => onChange({ measure })} />}

      {shared.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: space.md, rowGap: space.sm }}>
          {shared.map((f: FieldSpec) => (
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
      )}

      <SetList
        sets={sets.map((values, i) => ({ key: String(i), values }))}
        fields={spec.setFields}
        onChange={updateSet}
        onAdd={() => setSets([...sets, { ...sets.at(-1) }])}
        onRemove={() => setSets(sets.slice(0, -1))}
      />

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
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ gap: 4, alignItems: "center" }}>
      <AppText variant="note">{label}</AppText>
      <Stepper label={label} {...stepper} />
    </View>
  );
}
