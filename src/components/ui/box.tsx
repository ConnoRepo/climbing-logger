import { View, type ViewProps } from "react-native";

import { borders, colors } from "@/constants/theme";

type BoxProps = ViewProps & {
  border?: keyof typeof borders | "none";
  fill?: keyof typeof colors;
};

/** Square, ink-outlined panel — the basic building block of every screen. */
export function Box({ border = "thick", fill = "paper", style, ...rest }: BoxProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors[fill],
          borderWidth: border === "none" ? 0 : borders[border],
          borderColor: colors.ink,
        },
        style,
      ]}
      {...rest}
    />
  );
}
