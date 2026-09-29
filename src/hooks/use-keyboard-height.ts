import { useEffect } from "react";
import { Keyboard, type KeyboardEvent } from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";

/** Close to the curve iOS slides its keyboard on. */
const KEYBOARD_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

/**
 * The on-screen keyboard's height, sliding with it as it comes up and goes down (`height`),
 * and how tall it is when fully up (`full`). They're shared values, so layout driven from
 * them moves in step with the keyboard on the UI thread, with no re-render or relayout
 * jumps. Both stay 0 with a hardware keyboard, when there's nothing to make room for.
 */
export function useKeyboardHeight() {
  const height = useSharedValue(0);
  const full = useSharedValue(0);

  useEffect(() => {
    const slide = (to: number, e: KeyboardEvent) =>
      height.set(withTiming(to, { duration: e.duration || 250, easing: KEYBOARD_EASING }));
    const subs = [
      Keyboard.addListener("keyboardWillShow", (e) => {
        full.set(e.endCoordinates.height);
        slide(e.endCoordinates.height, e);
      }),
      Keyboard.addListener("keyboardWillHide", (e) => slide(0, e)),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { height, full };
}
