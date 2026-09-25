import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { Box, LIST_SIDE } from "@/components/ui";
import { borders, colors } from "@/constants/theme";
import type { Session } from "@/data/types";

import { SessionRow } from "./draggable-session";

/** Marks the slot between rows where the held workout will land. */
export function DropLine({ y, scrollY }: { y: SharedValue<number>; scrollY: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: y.value < 0 ? 0 : 1,
    transform: [{ translateY: y.value - scrollY.value - borders.thick / 2 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          left: LIST_SIDE,
          right: LIST_SIDE,
          height: borders.thick,
          backgroundColor: colors.ink,
          pointerEvents: "none",
        },
        style,
      ]}
    />
  );
}

/** How big the held copy gets, relative to its row: smaller, so the rows it passes stay in view. */
const LIFTED_SCALE = 0.8;

type LiftedCopyProps = {
  session: Session;
  x: SharedValue<number>;
  y: SharedValue<number>;
  /** Where the finger took hold, within the row; the copy grows or shrinks around that point. */
  grabX: SharedValue<number>;
  grabY: SharedValue<number>;
  /** 0 = row size, 1 = fully lifted. */
  lift: SharedValue<number>;
};

/** The held workout, lifted off the page: follows the finger over an ink shadow. */
export function LiftedCopy({ session, x, y, grabX, grabY, lift }: LiftedCopyProps) {
  const style = useAnimatedStyle(() => ({
    transformOrigin: [grabX.value, grabY.value, 0],
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: interpolate(lift.value, [0, 1], [1, LIFTED_SCALE]) },
    ],
  }));

  return (
    <Animated.View style={[{ position: "absolute", top: 0, left: LIST_SIDE, right: LIST_SIDE, pointerEvents: "none" }, style]}>
      <Box fill="ink" border="none" style={{ position: "absolute", top: 4, left: 4, right: -4, bottom: -4 }} />
      <SessionRow session={session} />
    </Animated.View>
  );
}
