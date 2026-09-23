import { TextInput, type TextInputProps } from "react-native";

import { borders, colors, type } from "@/constants/theme";

/** Journal page: a thick-outlined box you write straight into. */
export function NotebookInput({ style, ...rest }: TextInputProps) {
  return (
    <TextInput
      multiline
      placeholder="Start typing..."
      placeholderTextColor={colors.placeholder}
      textAlignVertical="top"
      style={[
        type.note,
        {
          color: colors.ink,
          minHeight: 321,
          padding: 7,
          paddingTop: 9,
          borderWidth: borders.thick,
          borderColor: colors.ink,
          backgroundColor: colors.paper,
        },
        style,
      ]}
      {...rest}
    />
  );
}
