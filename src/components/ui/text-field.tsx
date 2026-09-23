import { TextInput, type TextInputProps } from "react-native";

import { borders, colors, type, type TypeVariant } from "@/constants/theme";

type TextFieldProps = TextInputProps & {
  variant?: TypeVariant;
  /** Underline only (for titles) instead of a full box. */
  underline?: boolean;
};

/** Single-line notebook input: a thin ink box, or an underline for titles. */
export function TextField({ variant = "button", underline, style, ...rest }: TextFieldProps) {
  return (
    <TextInput
      placeholderTextColor={colors.placeholder}
      style={[
        type[variant],
        {
          color: colors.ink,
          minWidth: 0,
          paddingVertical: 6,
          paddingHorizontal: underline ? 0 : 8,
          borderColor: colors.ink,
          ...(underline ? { borderBottomWidth: borders.thin } : { borderWidth: borders.thin }),
        },
        style,
      ]}
      {...rest}
    />
  );
}
