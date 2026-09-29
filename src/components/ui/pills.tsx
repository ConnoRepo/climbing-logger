import { Pressable, View } from "react-native";

import { borders, colors, radii, space } from "@/constants/theme";

import { AppText } from "./text";

type PillsProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  selected: T | undefined;
  onSelect?: (value: T) => void;
  justify?: "center" | "flex-start";
  wrap?: boolean;
  /** Thin-outlined boxes sharing one row equally, the active one filled (the add-workout type filter). */
  boxed?: boolean;
};

/** The Figma "Navigation Pill List": plain labels, the active one on a faint fill. */
export function Pills<T extends string>({
  options,
  selected,
  onSelect,
  justify = "center",
  wrap = true,
  boxed = false,
}: PillsProps<T>) {
  return (
    <View
      style={{ flexDirection: "row", flexWrap: wrap && !boxed ? "wrap" : "nowrap", justifyContent: justify, gap: space.xs }}
    >
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect?.(o.value)}
            style={({ pressed }) =>
              boxed
                ? {
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: space.xs,
                    borderRadius: radii.pill,
                    borderWidth: borders.thin,
                    borderColor: colors.ink,
                    backgroundColor: active || pressed ? colors.fill : colors.paper,
                  }
                : { padding: space.xs, borderRadius: radii.pill, backgroundColor: active ? colors.fillFaint : "transparent" }
            }
          >
            <AppText variant="body" color={colors.inkSoft} numberOfLines={1}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
