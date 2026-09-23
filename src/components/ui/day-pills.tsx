import { Pressable, View } from "react-native";

import { colors, radii, space } from "@/constants/theme";

import { AppText } from "./text";

export const DAYS = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"] as const;

type DayPillsProps = {
  selected: number;
  onSelect?: (index: number) => void;
};

export function DayPills({ selected, onSelect }: DayPillsProps) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: space.xs }}>
      {DAYS.map((day, i) => (
        <Pressable
          key={day}
          accessibilityRole="tab"
          accessibilityState={{ selected: i === selected }}
          onPress={() => onSelect?.(i)}
          style={{
            padding: space.xs,
            borderRadius: radii.pill,
            backgroundColor: i === selected ? colors.fillFaint : "transparent",
          }}
        >
          <AppText variant="body" color={colors.inkSoft}>
            {day}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}
