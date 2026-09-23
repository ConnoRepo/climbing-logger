import { Pressable, View } from "react-native";

import { colors } from "@/constants/theme";

import { Box } from "./box";
import { Checkbox } from "./checkbox";
import { Icon, type IconName } from "./icon";
import { SwipeToDelete } from "./swipe-to-delete";
import { AppText } from "./text";

type WorkoutRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  done: boolean;
  onToggle?: (done: boolean) => void;
  /** Tapping the icon opens the workout. */
  onIconPress?: () => void;
  /** When set, swiping the row left reveals a red delete button. */
  onRemove?: () => void;
};

export function WorkoutRow({ title, subtitle, icon, done, onToggle, onIconPress, onRemove }: WorkoutRowProps) {
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${title}`}
        disabled={!onIconPress}
        onPress={onIconPress}
        hitSlop={8}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
      >
        {icon ? <Icon name={icon} size={48} /> : <View style={{ width: 48 }} />}
      </Pressable>
      <View style={{ flex: 1 }}>
        <AppText variant="row" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="note" color={colors.placeholder} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Checkbox checked={done} onChange={onToggle} label={title} />
    </Box>
  );

  if (!onRemove) return row;

  return (
    <SwipeToDelete label={title} onDelete={onRemove}>
      {row}
    </SwipeToDelete>
  );
}
