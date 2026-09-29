import { View } from "react-native";

import { AppText, DayPills, LIST_SIDE } from "@/components/ui";
import { borders, colors, space } from "@/constants/theme";
import { formatDayTotal } from "@/data/format";
import { weekOf } from "@/lib/dates";
import { useLog } from "@/store/log";

import { DragList } from "./drag-list";
import { DraggableSession } from "./draggable-session";
import { useSessionDrag } from "./use-session-drag";

/** Between workouts, as in the weekly view. */
const ROW_GAP = space.sm;

/** The selected day: its pills and its workouts. Hold a workout and drag to reorder the day. */
export function DailyView() {
  const log = useLog();
  const week = weekOf(log.selectedDate);
  const sessions = log.sessionsFor(log.selectedDate);

  // The whole list is one drop zone; dropping reorders the day.
  const drag = useSessionDrag(
    [sessions.map((s) => s.id)],
    (id, _zone, index) => log.moveSession(id, log.selectedDate, index),
    { rowGap: ROW_GAP },
  );

  return (
    <View style={{ flex: 1 }}>
      {/* The day names sit space.sm under the view toggle, with the pills' own padding (space.xs) as part of it. */}
      <View style={{ paddingHorizontal: space.md, paddingTop: space.sm - space.xs }}>
        <DayPills selected={week.indexOf(log.selectedDate)} onSelect={(i) => log.selectDate(week[i])} />
      </View>

      {/* A rule under the days, and how long the day's workouts take under it, lined up with the rows. */}
      <View style={{ marginTop: space.xs }}>
        {/* Past Sun and Sat on every phone (they're centred, so sit wider on small ones), short of the edges. */}
        <View style={{ marginHorizontal: space.xs, height: borders.thin, backgroundColor: colors.ink }} />
        <AppText
          variant="note"
          color={colors.inkSoft}
          align="right"
          style={{ marginTop: space.xs, marginHorizontal: LIST_SIDE }}
        >
          {/* A blank line when there's nothing to time, so the list doesn't jump when there is. */}
          {formatDayTotal(sessions) ?? " "}
        </AppText>
      </View>

      <DragList drag={drag} contentContainerStyle={{ flexGrow: 1, paddingTop: space.sm }}>
        {sessions.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <AppText variant="note" color={colors.placeholder} align="center">
              Nothing logged yet.{"\n"}Tap + Workout to add one.
            </AppText>
          </View>
        ) : (
          <View style={{ gap: ROW_GAP }} onLayout={(e) => drag.registerZone(0, e.nativeEvent.layout, 0)}>
            {sessions.map((s) => (
              <View key={s.id} onLayout={(e) => drag.registerRow(s.id, e.nativeEvent.layout)}>
                <DraggableSession session={s} gesture={drag.gestureFor(s.id)} lifted={s.id === drag.dragging} />
              </View>
            ))}
          </View>
        )}
      </DragList>
    </View>
  );
}
