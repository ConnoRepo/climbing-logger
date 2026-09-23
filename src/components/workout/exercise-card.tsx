import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";

import { AppText, Box, Checkbox, Pills, Stepper, SwipeToDelete, TextField } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { MEASURES, fieldLabel, type FieldSpec } from "@/data/categories";
import { formatPrescription } from "@/data/format";
import type { Measure, Prescription } from "@/data/types";

const MEASURE_OPTIONS = (Object.keys(MEASURES) as Measure[]).map((m) => ({ value: m, label: MEASURES[m].label }));

type ExerciseCardProps = {
  prescription: Prescription;
  onChange: (patch: Partial<Prescription>) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
};

/** One editable line of a template: name, measure and the numbers for it. */
export function ExerciseCard({ prescription: p, onChange, onMove, onRemove, isFirst, isLast }: ExerciseCardProps) {
  const spec = MEASURES[p.measure];
  const name = useCommittedText(p.name, (value) => onChange({ name: value }));

  return (
    <SwipeToDelete label={p.name || "exercise"} onDelete={onRemove} size={64}>
      <Box style={{ padding: space.sm, gap: space.sm }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
          <TextField
            variant="row"
            underline
            placeholder="Exercise name"
            accessibilityLabel="Exercise name"
            style={{ flex: 1 }}
            {...name.inputProps}
          />
          <MoveButton symbol="↑" label="Move up" disabled={isFirst} onPress={() => onMove(-1)} />
          <MoveButton symbol="↓" label="Move down" disabled={isLast} onPress={() => onMove(1)} />
        </View>

        <AppText variant="note" color={colors.placeholder}>
          {formatPrescription(p)}
        </AppText>

        <Pills options={MEASURE_OPTIONS} selected={p.measure} onSelect={(measure) => onChange({ measure })} justify="flex-start" />

        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: space.md, rowGap: space.sm }}>
          <Field label="Sets" value={p.sets} step={1} min={1} onChange={(sets) => onChange({ sets })} />
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
    </SwipeToDelete>
  );
}

function Field({ label, ...stepper }: { label: string; value: number | undefined; step: number; min: number; onChange: (v: number) => void }) {
  return (
    <View style={{ gap: 4 }}>
      <AppText variant="note">{label}</AppText>
      <Stepper label={label} {...stepper} />
    </View>
  );
}

function MoveButton({ symbol, label, disabled, onPress }: { symbol: string; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} hitSlop={6}>
      <AppText variant="label" color={disabled ? colors.placeholder : colors.ink}>
        {symbol}
      </AppText>
    </Pressable>
  );
}

/**
 * Local text that is only reported when editing finishes (blur, submit or
 * unmount), so half-typed names never reach the exercise library.
 */
function useCommittedText(initial: string, commit: (value: string) => void) {
  const [value, setValue] = useState(initial);
  const latest = useRef(initial);
  const committed = useRef(initial);
  const commitRef = useRef(commit);

  useEffect(() => {
    commitRef.current = commit;
  });

  function flush() {
    if (latest.current !== committed.current) {
      committed.current = latest.current;
      commitRef.current(latest.current);
    }
  }

  // Leaving the screen while still typing counts as finishing.
  useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    inputProps: {
      value,
      onChangeText: (text: string) => {
        latest.current = text;
        setValue(text);
      },
      onBlur: flush,
      onSubmitEditing: flush,
    },
  };
}
