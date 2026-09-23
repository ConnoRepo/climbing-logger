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
  /** Tapping the icon or the name opens the workout. */
  onOpen?: () => void;
  /** When set, swiping the row left reveals a red delete button. */
  onRemove?: () => void;
};

/** Every row is the same size: fixed height, one-line title, subtitle line always reserved. */
export const WORKOUT_ROW_HEIGHT = 78;

export function WorkoutRow({ title, subtitle, icon, done, onToggle, onOpen, onRemove }: WorkoutRowProps) {
  const row = (
    <Box
      style={{
        height: WORKOUT_ROW_HEIGHT,
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
        disabled={!onOpen}
        onPress={onOpen}
        style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", gap: 14, opacity: pressed ? 0.5 : 1 })}
      >
        {icon ? <Icon name={icon} size={48} /> : <View style={{ width: 48 }} />}
        <View style={{ flex: 1 }}>
          <AppText variant="row" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {title}
          </AppText>
          <AppText variant="note" color={colors.placeholder} numberOfLines={1}>
            {subtitle ?? " "}
          </AppText>
        </View>
      </Pressable>
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
