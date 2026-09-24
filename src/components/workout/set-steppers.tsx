import { View } from "react-native";

import { Stepper } from "@/components/ui";
import type { FieldSpec } from "@/data/categories";
import type { SetLog, SetValues } from "@/data/types";

/** Fits a large stepper, so growing one never moves the columns. */
export const STEPPER_COL = 112;

type SetSteppersProps = {
  set: SetLog;
  fields: FieldSpec[];
  onChange: (actual: SetValues) => void;
  size?: "regular" | "large";
};

/** A stepper per logged field (reps, weight…) for what one set actually was, each centered in its column. */
export function SetSteppers({ set, fields, onChange, size }: SetSteppersProps) {
  return fields.map((f) => (
    <View key={f.key} style={{ width: STEPPER_COL, alignItems: "center" }}>
      <Stepper
        label={`Set ${set.position + 1} ${f.unit}`}
        value={set.actual[f.key as keyof SetValues]}
        step={f.step}
        min={f.key === "weightLb" ? f.min : 0}
        size={size}
        onChange={(v) => onChange({ [f.key]: v })}
      />
    </View>
  ));
}
