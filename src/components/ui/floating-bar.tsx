import type { ReactNode } from "react";
import { View } from "react-native";

import { LIST_SIDE } from "./workout-row";

const BUTTON_HEIGHT = 33;
const PAD_Y = 7;

/** Height the bar covers at the bottom of its screen; scroll content needs this much extra room. */
export const FLOATING_BAR_HEIGHT = BUTTON_HEIGHT + PAD_Y * 2;

/**
 * A row of buttons floating over the bottom of the screen, so content scrolls
 * behind it. Taps between the buttons fall through to what's underneath.
 */
export function FloatingBar({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        position: "absolute",
        left: LIST_SIDE,
        right: LIST_SIDE,
        bottom: 0,
        paddingVertical: PAD_Y,
        flexDirection: "row",
        justifyContent: "space-between",
        pointerEvents: "box-none",
      }}
    >
      {children}
    </View>
  );
}
