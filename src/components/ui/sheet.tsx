import { View, type ViewProps } from "react-native";

import { colors, radii } from "@/constants/theme";

/** White bottom-sheet surface with the large rounded top corners from Figma. */
export function Sheet({ style, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.paper,
          borderTopLeftRadius: radii.sheet,
          borderTopRightRadius: radii.sheet,
          overflow: "hidden",
        },
        style,
      ]}
      {...rest}
    />
  );
}
