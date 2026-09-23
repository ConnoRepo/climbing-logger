import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { AppText, Box } from "@/components/ui";
import { borders, colors } from "@/constants/theme";

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

const square = { width: 37, height: 37, alignItems: "center", justifyContent: "center", borderWidth: borders.hairline, borderColor: colors.ink } as const;

function SquareSymbol({ symbol }: { symbol: string }) {
  return (
    <View style={{ marginTop: -4 }}>
      <AppText variant="title" style={{ lineHeight: 44 }}>
        {symbol}
      </AppText>
    </View>
  );
}

/**
 * The thin-outlined square ("+" / "›") at the end of a sheet row. Without
 * `onPress` it is just the visual, for rows that are tappable as a whole.
 */
export function SquareButton({ symbol, label, onPress }: { symbol: string; label?: string; onPress?: () => void }) {
  if (!onPress) {
    return (
      <View style={[square, { backgroundColor: colors.paper }]}>
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
      style={({ pressed }) => [square, { backgroundColor: pressed ? colors.fill : colors.paper }]}
    >
      <SquareSymbol symbol={symbol} />
    </Pressable>
  );
}
