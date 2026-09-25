import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { AppText } from "@/components/ui";
import { borders, colors, space } from "@/constants/theme";
import type { Session } from "@/data/types";
import { formatDayHeader, type DateKey } from "@/lib/dates";

type DaySectionProps = {
  date: DateKey;
  sessions: Session[];
  isToday: boolean;
  expanded: boolean;
  onToggle: () => void;
  /** Renders one of this day's workouts (draggable). */
  renderSession: (session: Session) => ReactNode;
};

/** "Sunday, 21st · 2 workouts"; tap to show or hide that day's workouts. Today has a thick outline. */
export function DaySection({ date, sessions, isToday, expanded, onToggle, renderSession }: DaySectionProps) {
  const count = sessions.length;

  return (
    <View style={{ gap: space.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${formatDayHeader(date)}, ${count} ${count === 1 ? "workout" : "workouts"}`}
        onPress={onToggle}
        style={({ pressed }) => ({
          minHeight: 48,
          flexDirection: "row",
          alignItems: "center",
          gap: space.xs,
          paddingHorizontal: space.sm,
          borderWidth: isToday ? borders.thick : borders.thin,
          borderColor: colors.ink,
          backgroundColor: pressed ? colors.fillFaint : colors.paper,
        })}
      >
        <AppText variant="label" style={{ flex: 1 }} numberOfLines={1}>
          {formatDayHeader(date)}
        </AppText>
        <AppText variant="note" color={count ? colors.ink : colors.placeholder}>
          {count} {count === 1 ? "workout" : "workouts"}
        </AppText>
        <AppText variant="label" style={{ width: 16, textAlign: "center" }}>
          {expanded ? "⌄" : "›"}
        </AppText>
      </Pressable>

      {expanded &&
        (count ? (
          sessions.map(renderSession)
        ) : (
          <AppText variant="note" color={colors.placeholder} align="center">
            Nothing scheduled. Drag a workout here.
          </AppText>
        ))}
    </View>
  );
}
