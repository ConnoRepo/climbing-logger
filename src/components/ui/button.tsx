import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { borders, colors, type TypeVariant } from "@/constants/theme";

import { AppText } from "./text";

type ButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  /** outline: Journal / + Workout. fill: timer controls. */
  variant?: "outline" | "fill";
  textVariant?: TypeVariant;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = "outline", textVariant = "button", style, ...rest }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          minHeight: 33,
          paddingHorizontal: 4,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: variant === "fill" || pressed ? colors.fill : colors.paper,
          borderWidth: variant === "outline" ? borders.thin : 0,
          borderColor: colors.ink,
          opacity: variant === "fill" && pressed ? 0.7 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <AppText variant={textVariant} numberOfLines={1}>{label}</AppText>
    </Pressable>
  );
}
