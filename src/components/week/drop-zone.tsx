import type { ReactNode } from "react";
import type { LayoutRectangle } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { borders, colors } from "@/constants/theme";

/** Room for the outline drawn while a workout is held over a section; its content starts this far in. */
export const DROP_ZONE_INSET = 4;

type DropZoneProps = {
  index: number;
  hover: SharedValue<number>;
  onLayout: (index: number, layout: LayoutRectangle) => void;
  children: ReactNode;
};

/**
 * A section workouts can be dropped into. It outlines itself while one is held over it.
 * The outline sits in a margin that's always there, so highlighting never shifts the layout.
 */
export function DropZone({ index, hover, onLayout, children }: DropZoneProps) {
  const highlight = useAnimatedStyle(() => {
    const over = hover.value === index;
    return {
      borderColor: over ? colors.ink : "transparent",
      backgroundColor: over ? colors.fillLight : "transparent",
    };
  });

  return (
    <Animated.View
      onLayout={(e) => onLayout(index, e.nativeEvent.layout)}
      style={[
        { margin: -DROP_ZONE_INSET, padding: DROP_ZONE_INSET - borders.thin, borderWidth: borders.thin, borderStyle: "dashed" },
        highlight,
      ]}
    >
      {children}
    </Animated.View>
  );
}
