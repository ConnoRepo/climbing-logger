import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui";
import { borders, colors } from "@/constants/theme";
import { DAY_LETTERS, weekdayName, type DateKey } from "@/lib/dates";

const SIZE = 32;

/** S M T W T F S under an unscheduled workout: tap a letter to put it on that day. */
export function DayMarkers({ week, onPick }: { week: DateKey[]; onPick: (date: DateKey) => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      {week.map((date, i) => (
        <Pressable
          key={date}
          accessibilityRole="button"
          accessibilityLabel={`Move to ${weekdayName(date)}`}
          onPress={() => onPick(date)}
          hitSlop={4}
          style={({ pressed }) => ({
            width: SIZE,
            height: SIZE,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: borders.thin,
            borderColor: colors.ink,
            backgroundColor: pressed ? colors.fill : colors.paper,
          })}
        >
          <AppText variant="button">{DAY_LETTERS[i]}</AppText>
        </Pressable>
      ))}
    </View>
  );
}
