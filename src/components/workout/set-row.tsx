import { View, type StyleProp, type ViewStyle } from "react-native";

import { AppText, Checkbox } from "@/components/ui";
import { space } from "@/constants/theme";
import { fieldLabel, type FieldSpec } from "@/data/categories";
import type { SetLog, SetValues } from "@/data/types";

import { SetSteppers, STEPPER_COL } from "./set-steppers";

// Fixed columns, so the header and every row line up:
// Set on the left, then a flexible gap, then the stepper columns and Done.
const SET_COL = 36;
const DONE_COL = 30;
const GAP = space.xs;

const row: ViewStyle = { flexDirection: "row", alignItems: "center", gap: GAP };
const spacer = <View style={{ flex: 1 }} />;

/** "Set · Reps · Weight (lb)" column labels, each centered over its column. */
export function SetHeader({ fields, withDone }: { fields: FieldSpec[]; withDone?: boolean }) {
  return (
    <View style={row}>
      <AppText variant="note" align="center" style={{ width: SET_COL }}>
        Set
      </AppText>
      {spacer}
      {fields.map((f) => (
        <AppText key={f.key} variant="note" align="center" style={{ width: STEPPER_COL }}>
          {fieldLabel(f)}
        </AppText>
      ))}
      {withDone && <View style={{ width: DONE_COL }} />}
    </View>
  );
}

type SetRowProps = {
  set: SetLog;
  fields: FieldSpec[];
  onChange: (actual: SetValues) => void;
  /** Shows a done checkbox at the end of the row. */
  onToggleDone?: (done: boolean) => void;
  /** The set being done right now: drawn larger. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Set number on the left, a stepper per logged field on the right. */
export function SetRow({ set, fields, onChange, onToggleDone, active, style }: SetRowProps) {
  return (
    <View style={[row, { paddingVertical: active ? 6 : 2 }, style]}>
      <AppText variant={active ? "heading" : "label"} align="center" style={{ width: SET_COL }}>
        {set.position + 1}
      </AppText>
      {spacer}
      <SetSteppers set={set} fields={fields} onChange={onChange} size={active ? "large" : "regular"} />
      {onToggleDone && (
        <View style={{ width: DONE_COL, alignItems: "center" }}>
          <Checkbox checked={set.done} onChange={onToggleDone} label={`Set ${set.position + 1} done`} />
        </View>
      )}
    </View>
  );
}
