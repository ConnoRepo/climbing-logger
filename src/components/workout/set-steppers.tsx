import { View } from "react-native";

import { Stepper } from "@/components/ui";
import type { FieldSpec } from "@/data/categories";
import type { SetValues } from "@/data/types";

/** Fits a large stepper, so growing one never moves the columns. */
export const STEPPER_COL = 112;

/** Two steppers fit a row at full size; three (weight, time and reps) are compact and share it. */
export function isCompact(fields: FieldSpec[]) {
  return fields.length > 2;
}

/** A stepper's column, for the steppers and the labels over them. */
export function stepperColumn(fields: FieldSpec[]): { flex: number } | { width: number } {
  return isCompact(fields) ? { flex: 1 } : { width: STEPPER_COL };
}

/**
 * A column's key, which changes with the layout so switching Reps ↔ Time builds fresh
 * columns. On iOS a column that goes from a fixed width to flex keeps its old width as
 * its flex basis (Yoga caches it), which squeezed the new Time column down to nothing.
 */
export function columnKey(fields: FieldSpec[], f: FieldSpec) {
  return `${isCompact(fields) ? "compact" : "full"}:${f.key}`;
}

type SetSteppersProps = {
  /** 0-based set number. */
  position: number;
  values: SetValues;
  fields: FieldSpec[];
  onChange: (actual: SetValues) => void;
  size?: "regular" | "large";
};

/** A stepper per logged field (reps, weight…) for one set, each centered in its column. */
export function SetSteppers({ position, values, fields, onChange, size }: SetSteppersProps) {
  return fields.map((f) => (
    <View key={columnKey(fields, f)} style={[stepperColumn(fields), { alignItems: "center" }]}>
      <Stepper
        label={`Set ${position + 1} ${f.unit}`}
        value={values[f.key as keyof SetValues]}
        step={f.step}
        min={f.key === "weightLb" ? f.min : 0}
        size={isCompact(fields) ? "compact" : size}
        onChange={(v) => onChange({ [f.key]: v })}
      />
    </View>
  ));
}
