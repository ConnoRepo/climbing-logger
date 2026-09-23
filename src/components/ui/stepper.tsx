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
};

const BUTTON = 30;

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/** Outlined − value + control; the value can also be typed. */
export function Stepper({ value, onChange, step = 1, min = 0, max = 9999, label }: StepperProps) {
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
      <StepButton symbol="−" label={`Decrease ${label}`} onPress={() => set(current - step)} />
      <TextInput
        accessibilityLabel={label}
        value={text}
        onChangeText={setText}
        onBlur={commit}
        onSubmitEditing={commit}
        keyboardType="decimal-pad"
        selectTextOnFocus
        style={[
          type.button,
          {
            width: 44,
            height: BUTTON,
            padding: 0,
            textAlign: "center",
            color: colors.ink,
            borderTopWidth: borders.thin,
            borderBottomWidth: borders.thin,
            borderColor: colors.ink,
          },
        ]}
      />
      <StepButton symbol="+" label={`Increase ${label}`} onPress={() => set(current + step)} />
    </View>
  );
}

function StepButton({ symbol, label, onPress }: { symbol: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        width: BUTTON,
        height: BUTTON,
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
