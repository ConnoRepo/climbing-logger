import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { borders, colors, type } from "@/constants/theme";
import { clamp } from "@/lib/math";

import { AppText } from "./text";

type StepperProps = {
  value: number | undefined;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Used for accessibility labels, e.g. "reps". */
  label: string;
  /** large: the timer's current set. compact: three to a row; fills its column. */
  size?: "regular" | "large" | "compact";
};

/**
 * Height, button width and value width; a regular stepper is 104 wide, a large one 112.
 * A compact one is as tall as a regular one, with narrower buttons and a value that
 * stretches to fill whatever room is left.
 */
const SIZES = {
  regular: { height: 30, button: 30, input: 44, text: type.button },
  large: { height: 32, button: 32, input: 48, text: type.label },
  compact: { height: 30, button: 22, input: undefined, text: type.note },
} as const;

/** Height of a regular (or compact) stepper, for laying out rows of them. */
export const STEPPER_HEIGHT = SIZES.regular.height;

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/** Outlined − value + control; the value can also be typed. */
export function Stepper({ value, onChange, step = 1, min = 0, max = 9999, label, size = "regular" }: StepperProps) {
  const s = SIZES[size];
  const stretch = size === "compact";
  const current = value ?? 0;
  const [text, setText] = useState(String(current));

  // Follow outside changes (e.g. the +/− buttons, or a new set copying values).
  const [shown, setShown] = useState(current);
  if (shown !== current) {
    setShown(current);
    setText(String(current));
  }

  const set = (n: number) => onChange(round(clamp(n, min, max)));

  function commit() {
    const n = Number.parseFloat(text.replace(",", "."));
    if (Number.isFinite(n)) set(n);
    else setText(String(current));
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", alignSelf: stretch ? "stretch" : undefined }}>
      <StepButton symbol="−" label={`Decrease ${label}`} width={s.button} height={s.height} onPress={() => set(current - step)} />
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
            flex: stretch ? 1 : undefined,
            minWidth: stretch ? 0 : undefined,
            height: s.height,
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
      <StepButton symbol="+" label={`Increase ${label}`} width={s.button} height={s.height} onPress={() => set(current + step)} />
    </View>
  );
}

type StepButtonProps = { symbol: string; label: string; width: number; height: number; onPress: () => void };

function StepButton({ symbol, label, width, height, onPress }: StepButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        width,
        height,
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
