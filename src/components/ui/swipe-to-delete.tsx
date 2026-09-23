import type { ReactNode } from "react";
import { Pressable } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { borders, colors } from "@/constants/theme";

import { Icon } from "./icon";

type SwipeToDeleteProps = {
  /** Used for the delete button's accessibility label: "Delete {label}". */
  label: string;
  onDelete: () => void;
  /** Width of the red delete box; match the row height for a square. */
  size?: number;
  /** Draw the ink outline around the red box (matches thick-bordered rows). */
  outlined?: boolean;
  children: ReactNode;
};

/** Swipe left to reveal a red box with a trash can; tap it to delete. */
export function SwipeToDelete({ label, onDelete, size = 78, outlined = true, children }: SwipeToDeleteProps) {
  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${label}`}
          onPress={onDelete}
          style={({ pressed }) => ({
            width: size,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.danger,
            borderWidth: outlined ? borders.thick : 0,
            borderLeftWidth: 0,
            borderColor: colors.ink,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Icon name="trash" size={Math.min(32, size * 0.45)} />
        </Pressable>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}
