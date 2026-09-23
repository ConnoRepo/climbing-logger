import { Pressable, View } from "react-native";

import { colors, radii, space } from "@/constants/theme";

import { AppText } from "./text";

type PillsProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  selected: T | undefined;
  onSelect?: (value: T) => void;
  justify?: "center" | "flex-start";
  wrap?: boolean;
};

/** The Figma "Navigation Pill List": plain labels, the active one on a faint fill. */
export function Pills<T extends string>({ options, selected, onSelect, justify = "center", wrap = true }: PillsProps<T>) {
  return (
    <View style={{ flexDirection: "row", flexWrap: wrap ? "wrap" : "nowrap", justifyContent: justify, gap: space.xs }}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.value === selected }}
          onPress={() => onSelect?.(o.value)}
          style={{
            padding: space.xs,
            borderRadius: radii.pill,
            backgroundColor: o.value === selected ? colors.fillFaint : "transparent",
          }}
        >
          <AppText variant="body" color={colors.inkSoft}>
            {o.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
