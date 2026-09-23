import { Image } from "expo-image";
import { Pressable } from "react-native";

import { borders, colors } from "@/constants/theme";

type CheckboxProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
};

/** Square box with a hand-drawn tick that spills out of the top-right corner. */
export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={10}
      onPress={() => onChange?.(!checked)}
      style={{
        width: 30,
        height: 30,
        borderWidth: borders.thin,
        borderColor: colors.ink,
        overflow: "visible",
      }}
    >
      {checked && (
        <Image
          source={require("@/assets/icons/checkmark.svg")}
          style={{ position: "absolute", left: 6.5, top: -10.1, width: 30.77, height: 30 }}
          contentFit="fill"
        />
      )}
    </Pressable>
  );
}
