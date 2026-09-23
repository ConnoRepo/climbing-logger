import { Pressable, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { borders, colors } from "@/constants/theme";

import { Box } from "./box";
import { Checkbox } from "./checkbox";
import { Icon, type IconName } from "./icon";
import { AppText } from "./text";

type WorkoutRowProps = {
  title: string;
  icon?: IconName;
  done: boolean;
  onToggle?: (done: boolean) => void;
  /** When set, swiping the row left reveals a red delete button. */
  onRemove?: () => void;
};

export function WorkoutRow({ title, icon, done, onToggle, onRemove }: WorkoutRowProps) {
  const row = (
    <Box
      style={{
        minHeight: 78,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "center",
        paddingLeft: 9,
        paddingRight: 27,
        gap: 14,
      }}
    >
      {icon ? <Icon name={icon} size={48} /> : <View style={{ width: 48 }} />}
      <AppText variant="row" style={{ flex: 1 }} numberOfLines={2}>
        {title}
      </AppText>
      <Checkbox checked={done} onChange={onToggle} label={title} />
    </Box>
  );

  if (!onRemove) return row;

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${title}`}
          onPress={onRemove}
          style={({ pressed }) => ({
            width: 78,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.danger,
            borderWidth: borders.thick,
            borderLeftWidth: 0,
            borderColor: colors.ink,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Icon name="trash" size={32} />
        </Pressable>
      )}
    >
      {row}
    </ReanimatedSwipeable>
  );
}
