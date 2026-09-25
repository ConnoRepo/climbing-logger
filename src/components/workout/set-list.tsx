import { useRef } from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";

import { Button } from "@/components/ui";
import { space } from "@/constants/theme";
import { MAX_SETS, type FieldSpec } from "@/data/categories";
import type { SetValues } from "@/data/types";

import { SET_ROW_HEIGHT, SetHeader, SetRow } from "./set-row";

/** The list is always this many sets tall; more sets scroll inside it. */
const VISIBLE_SETS = 5;
const LIST_HEIGHT = VISIBLE_SETS * SET_ROW_HEIGHT + (VISIBLE_SETS - 1) * space.sm;

type SetListProps = {
  /** One entry per set, in order. */
  sets: { key: string; values: SetValues }[];
  fields: FieldSpec[];
  onChange: (index: number, values: SetValues) => void;
  onAdd: () => void;
  /** Removes the last set. */
  onRemove: () => void;
};

/** Set · Reps · Weight header, a row of steppers per set, and − Set / + Set. Sits inside a card. */
export function SetList({ sets, fields, onChange, onAdd, onRemove }: SetListProps) {
  const canAdd = sets.length < MAX_SETS;
  const canRemove = sets.length > 1;
  const list = useRef<ScrollView>(null);
  // Set when a set is added, so the list scrolls to show it once it has rendered.
  const added = useRef(false);

  return (
    <>
      <SetHeader fields={fields} />

      <ScrollView
        ref={list}
        style={{ height: LIST_HEIGHT, flexGrow: 0 }}
        contentContainerStyle={{ gap: space.sm }}
        scrollEnabled={sets.length > VISIBLE_SETS}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => {
          if (!added.current) return;
          added.current = false;
          list.current?.scrollToEnd();
        }}
      >
        {sets.map((set, i) => (
          <SetRow key={set.key} position={i} values={set.values} fields={fields} onChange={(values) => onChange(i, values)} />
        ))}
      </ScrollView>

      <SetButtons
        canAdd={canAdd}
        canRemove={canRemove}
        onAdd={() => {
          added.current = true;
          onAdd();
        }}
        onRemove={onRemove}
        // 15% more room above the buttons than between the other rows.
        style={{ marginTop: space.sm * 0.15 }}
      />
    </>
  );
}

type SetButtonsProps = {
  canAdd: boolean;
  canRemove: boolean;
  onAdd: () => void;
  /** Removes the last set. */
  onRemove: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * − Set / + Set under a list of sets; each is faded out while it can't be used.
 * Like the iOS stepper, they act the moment a finger touches down, not on release.
 */
export function SetButtons({ canAdd, canRemove, onAdd, onRemove, style }: SetButtonsProps) {
  return (
    <View style={[{ flexDirection: "row", justifyContent: "space-between" }, style]}>
      <Button
        label="− Set"
        accessibilityLabel="Remove last set"
        disabled={!canRemove}
        style={{ width: 72, opacity: canRemove ? 1 : 0.35 }}
        onPressIn={onRemove}
      />
      <Button
        label="+ Set"
        accessibilityLabel="Add a set"
        disabled={!canAdd}
        style={{ width: 72, opacity: canAdd ? 1 : 0.35 }}
        onPressIn={onAdd}
      />
    </View>
  );
}
