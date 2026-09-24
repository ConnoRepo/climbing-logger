import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { borders, colors, type } from "@/constants/theme";

import { AppText } from "./text";

type StepperProps = {
  value: number | undefined;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Used for accessibility labels, e.g. "reps". */
  label: string;
  /** large: the timer's current set. */
  size?: "regular" | "large";
};

/** Button side and value width; a regular stepper is 104 wide, a large one 112. */
const SIZES = {
  regular: { button: 30, input: 44, text: type.button },
  large: { button: 32, input: 48, text: type.label },
} as const;

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/** Outlined − value + control; the value can also be typed. */
export function Stepper({ value, onChange, step = 1, min = 0, max = 9999, label, size = "regular" }: StepperProps) {
  const s = SIZES[size];
  const current = value ?? 0;
  const [text, setText] = useState(String(current));

  // Follow outside changes (e.g. the +/− buttons, or a new set copying values).
  useEffect(() => setText(String(current)), [current]);

  const set = (n: number) => onChange(round(Math.min(max, Math.max(min, n))));

  function commit() {
    const n = Number.parseFloat(text.replace(",", "."));
    if (Number.isFinite(n)) set(n);
    else setText(String(current));
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <StepButton symbol="−" label={`Decrease ${label}`} side={s.button} onPress={() => set(current - step)} />
      <TextInput
        accessibilityLabel={label}
        value={text}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="decimal-pad"
        selectTextOnFocus
        style={[
          s.text,
          {
            width: s.input,
            height: s.button,
            padding: 0,
            textAlign: "center",
            color: colors.ink,
            backgroundColor: colors.paper,
            borderTopWidth: borders.thin,
            borderBottomWidth: borders.thin,
            borderColor: colors.ink,
          },
        ]}
      />
      <StepButton symbol="+" label={`Increase ${label}`} side={s.button} onPress={() => set(current + step)} />
    </View>
  );
}

function StepButton({ symbol, label, side, onPress }: { symbol: string; label: string; side: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        width: side,
        height: side,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: borders.thin,
        borderColor: colors.ink,
        backgroundColor: pressed ? colors.fill : colors.paper,
      })}
    >
      <AppText variant="label" style={{ lineHeight: 22 }}>
        {symbol}
      </AppText>
    </Pressable>
  );
}
