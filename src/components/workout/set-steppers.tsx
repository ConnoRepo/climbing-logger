import { View } from "react-native";

import { Stepper } from "@/components/ui";
import type { FieldSpec } from "@/data/categories";
import type { SetValues } from "@/data/types";

/** Fits a large stepper, so growing one never moves the columns. */
export const STEPPER_COL = 112;

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
    <View key={f.key} style={{ width: STEPPER_COL, alignItems: "center" }}>
      <Stepper
        label={`Set ${position + 1} ${f.unit}`}
        value={values[f.key as keyof SetValues]}
        step={f.step}
        min={f.key === "weightLb" ? f.min : 0}
        size={size}
        onChange={(v) => onChange({ [f.key]: v })}
      />
    </View>
  ));
}
