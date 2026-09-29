import { View } from "react-native";

import { AppText, Box, Checkbox, Pills, Stepper, TextField } from "@/components/ui";
import { colors, space, type } from "@/constants/theme";
import { formatPrescription } from "@/data/format";
import { MEASURES, fieldLabel, updateSetAt } from "@/data/measures";
import type { Measure, Prescription, SetValues } from "@/data/types";

import { SetList } from "./set-list";

type PrescriptionCardProps = {
  prescription: Prescription;
  /** The measures this workout's category allows; pills are hidden if there's only one. */
  measures: Measure[];
  onChange: (patch: Partial<Prescription>) => void;
};

/**
 * A workout's plan, laid out like the day view's set card: the settings shared by
 * every set, then a row per set. Rest is edited outside the card (see RestBox).
 * Reps and Time are the same size, so switching between them moves nothing.
 */
export function PrescriptionCard({ prescription: p, measures, onChange }: PrescriptionCardProps) {
  const spec = MEASURES[p.measure];
  const options = measures.map((m) => ({ value: m, label: MEASURES[m].label }));
  const setSets = (sets: SetValues[]) => onChange({ sets });

  return (
    <Box style={{ padding: space.sm, gap: space.sm }}>
      {/* Two lines tall whether the summary takes one or two, so it never moves what's under it. */}
      <View style={{ height: type.note.lineHeight * 2, justifyContent: "center" }}>
        <AppText variant="note" color={colors.placeholder} align="center" numberOfLines={2}>
          {formatPrescription(p)}
        </AppText>
      </View>

      {options.length > 1 && <Pills options={options} selected={p.measure} onSelect={(measure) => onChange({ measure })} />}

      {spec.sharedFields.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: space.md, rowGap: space.sm }}>
          {spec.sharedFields.map((f) => (
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

      {/* A stopwatch has nothing to plan: it just counts up. */}
      {spec.kind === "sets" && (
        <SetList
          sets={p.sets.map((values, i) => ({ key: String(i), values }))}
          fields={spec.setFields}
          // As on a day: new reps, time or weight carry forward to every later set.
          onChange={(index, values) => setSets(updateSetAt(p.sets, index, values))}
          onAdd={() => setSets([...p.sets, { ...p.sets.at(-1) }])}
          onRemove={() => setSets(p.sets.slice(0, -1))}
        />
      )}

      {spec.usesGrade && (
        <TextField
          placeholder="Grade, e.g. V4 or V2–V4"
          accessibilityLabel="Grade"
          value={p.grade ?? ""}
          onChangeText={(grade) => onChange({ grade })}
        />
      )}

      {spec.usesPerSide && (
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
