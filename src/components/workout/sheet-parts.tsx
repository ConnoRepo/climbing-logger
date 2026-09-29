import { Pressable, View } from "react-native";

import { borders, colors } from "@/constants/theme";

const PLUS = 17;
const STROKE = 3;

/**
 * The thin-outlined "+" square at the end of a row on the add-workout list. `size` 30 matches
 * the done checkbox it stands in for, for rows shaped like the home screen's.
 */
export function SquareButton({ label, onPress, size = 30 }: { label: string; onPress: () => void; size?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: borders.thin,
        borderColor: colors.ink,
        backgroundColor: pressed ? colors.fill : colors.paper,
      })}
    >
      {/* Drawn rather than typed so it sits in the true centre of the square: the glyph rides high in its line box. */}
      <View style={{ width: PLUS, height: PLUS, alignItems: "center", justifyContent: "center" }}>
        <View style={{ position: "absolute", width: PLUS, height: STROKE, backgroundColor: colors.ink }} />
        <View style={{ position: "absolute", width: STROKE, height: PLUS, backgroundColor: colors.ink }} />
      </View>
    </Pressable>
  );
}
