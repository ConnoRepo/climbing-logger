import { View, type StyleProp, type ViewStyle } from "react-native";

import { AppText, Checkbox, STEPPER_HEIGHT } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { fieldLabel, type FieldSpec } from "@/data/categories";
import type { SetValues } from "@/data/types";

import { columnKey, isCompact, SetSteppers, stepperColumn } from "./set-steppers";

// Fixed columns, so the header and every row line up:
// Set on the left, then a flexible gap, then the stepper columns and Done.
// Compact stepper columns share the rest of the row instead, with no flexible gap.
const SET_COL = 36;
const DONE_COL = 30;
const GAP = space.xs;
const ROW_PAD = 2;

/** Height of a regular (not active) set row. */
export const SET_ROW_HEIGHT = STEPPER_HEIGHT + ROW_PAD * 2;

const row: ViewStyle = { flexDirection: "row", alignItems: "center", gap: GAP };
const spacer = <View style={{ flex: 1 }} />;

/** "Set · Reps · Weight (lb)" column labels, each centered over its column. */
export function SetHeader({ fields, withDone }: { fields: FieldSpec[]; withDone?: boolean }) {
  return (
    <View style={row}>
      <AppText variant="note" align="center" style={{ width: SET_COL }}>
        Set
      </AppText>
      {!isCompact(fields) && spacer}
      {fields.map((f) => (
        <AppText key={columnKey(fields, f)} variant="note" align="center" numberOfLines={1} style={stepperColumn(fields)}>
          {/* Compact columns leave out the unit: "Weight (lb)" is wider than one on the timer. */}
          {isCompact(fields) ? f.label : fieldLabel(f)}
        </AppText>
      ))}
      {withDone && <View style={{ width: DONE_COL }} />}
    </View>
  );
}

type SetRowProps = {
  /** 0-based set number. */
  position: number;
  values: SetValues;
  done?: boolean;
  fields: FieldSpec[];
  onChange: (actual: SetValues) => void;
  /** Shows a done checkbox at the end of the row. */
  onToggleDone?: (done: boolean) => void;
  /** The set being done right now: drawn larger. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Set number on the left, a stepper per logged field on the right. */
export function SetRow({ position, values, done = false, fields, onChange, onToggleDone, active, style }: SetRowProps) {
  return (
    <View style={[row, { paddingVertical: active ? 6 : ROW_PAD }, style]}>
      <AppText variant={active ? "heading" : "label"} align="center" style={{ width: SET_COL }}>
        {position + 1}
      </AppText>
      {!isCompact(fields) && spacer}
      <SetSteppers position={position} values={values} fields={fields} onChange={onChange} size={active ? "large" : "regular"} />
      {onToggleDone && (
        <View style={{ width: DONE_COL, alignItems: "center" }}>
          <Checkbox checked={done} onChange={onToggleDone} label={`Set ${position + 1} done`} color={colors.check} />
        </View>
      )}
    </View>
  );
}
