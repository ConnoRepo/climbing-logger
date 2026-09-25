import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { AppText, Box } from "@/components/ui";
import { borders, colors } from "@/constants/theme";

/** Side padding of the pages inside a sheet. */
export const SHEET_SIDE = 39;

/** "‹ Back" text link for screens stacked inside a sheet. */
export function SheetBack({ label = "Back" }: { label?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={{ alignSelf: "flex-start" }}>
      <AppText variant="label">‹ {label}</AppText>
    </Pressable>
  );
}

/** Thick-outlined sheet row from the Figma "Add Workout Sheet" card. */
export function SheetRow({ children }: { children: ReactNode }) {
  return (
    <Box style={{ minHeight: 93, flexDirection: "row", alignItems: "center", paddingLeft: 12, paddingRight: 9, gap: 10 }}>
      {children}
    </Box>
  );
}

const square = { alignItems: "center", justifyContent: "center", borderWidth: borders.thin, borderColor: colors.ink } as const;

const CHEVRON = 13;
const PLUS = 17;
const STROKE = 3;

type Symbol = "+" | "›";

// Drawn rather than typed so they sit in the true centre of the square: the
// glyphs ride high in their line box.
function SquareSymbol({ symbol }: { symbol: Symbol }) {
  if (symbol === "+") {
    return (
      <View style={{ width: PLUS, height: PLUS, alignItems: "center", justifyContent: "center" }}>
        <View style={{ position: "absolute", width: PLUS, height: STROKE, backgroundColor: colors.ink }} />
        <View style={{ position: "absolute", width: STROKE, height: PLUS, backgroundColor: colors.ink }} />
      </View>
    );
  }
  // Two sides of a square turned 45°, nudged left so the stroke (not the
  // square's bounds) is what's centred.
  return (
    <View
      style={{
        width: CHEVRON,
        height: CHEVRON,
        borderTopWidth: STROKE,
        borderRightWidth: STROKE,
        borderColor: colors.ink,
        transform: [{ translateX: -CHEVRON * 0.3 }, { rotate: "45deg" }],
      }}
    />
  );
}

/**
 * The thin-outlined square ("+" / "›") at the end of a sheet row. Without
 * `onPress` it is just the visual, for rows that are tappable as a whole.
 * `size` 30 matches the done checkbox, for rows shaped like the home screen's.
 */
export function SquareButton({
  symbol,
  label,
  onPress,
  size = 37,
}: {
  symbol: Symbol;
  label?: string;
  onPress?: () => void;
  size?: number;
}) {
  if (!onPress) {
    return (
      <View style={[square, { width: size, height: size, backgroundColor: colors.paper }]}>
        <SquareSymbol symbol={symbol} />
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [square, { width: size, height: size, backgroundColor: pressed ? colors.fill : colors.paper }]}
    >
      <SquareSymbol symbol={symbol} />
    </Pressable>
  );
}
