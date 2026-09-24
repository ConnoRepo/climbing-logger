import { Image } from "expo-image";
import { Pressable, View } from "react-native";

import { borders, colors } from "@/constants/theme";

type CheckboxProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
};

/**
 * Square box with a hand-drawn tick that spills out of the top-right corner.
 * The tick is a sibling drawn over the outlined square, not its child, so the
 * square's border never clips it; leave ~10pt above and ~8pt right of it free.
 */
export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      hitSlop={10}
      onPress={() => onChange?.(!checked)}
      style={{ width: 30, height: 30, overflow: "visible" }}
    >
      <View style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, borderWidth: borders.thin, borderColor: colors.ink }} />
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
