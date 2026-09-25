import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

import { Box } from "@/components/ui";
import { borders, colors } from "@/constants/theme";
import type { Session } from "@/data/types";

import { SessionRow } from "./draggable-session";

/** Side padding of the lists these draw over, so they line up with the rows. */
export const LIST_SIDE = 27.5;

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

/** The held workout, lifted off the page: follows the finger over an ink shadow. */
export function LiftedCopy({
  session,
  x,
  y,
}: {
  session: Session;
  x: SharedValue<number>;
  y: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: 1.03 }],
  }));

  return (
    <Animated.View style={[{ position: "absolute", top: 0, left: LIST_SIDE, right: LIST_SIDE, pointerEvents: "none" }, style]}>
      <Box fill="ink" border="none" style={{ position: "absolute", top: 4, left: 4, right: -4, bottom: -4 }} />
      <SessionRow session={session} />
    </Animated.View>
  );
}
