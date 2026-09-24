import { Stepper } from "@/components/ui";
import type { FieldSpec } from "@/data/categories";
import type { SetLog, SetValues } from "@/data/types";

type SetSteppersProps = {
  set: SetLog;
  fields: FieldSpec[];
  onChange: (actual: SetValues) => void;
};

/** A stepper per logged field (reps, weight…) for what one set actually was. */
export function SetSteppers({ set, fields, onChange }: SetSteppersProps) {
  return fields.map((f) => (
    <Stepper
      key={f.key}
      label={`Set ${set.position + 1} ${f.unit}`}
      value={set.actual[f.key as keyof SetValues]}
      step={f.step}
      min={f.key === "weightKg" ? f.min : 0}
      onChange={(v) => onChange({ [f.key]: v })}
    />
  ));
}
