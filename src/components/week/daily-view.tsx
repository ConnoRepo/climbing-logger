import { View } from "react-native";

import { AppText, DayPills } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { weekOf } from "@/lib/dates";
import { useLog } from "@/store/log";

import { DragList } from "./drag-list";
import { DraggableSession } from "./draggable-session";
import { useSessionDrag } from "./use-session-drag";

/** The selected day: its pills and its workouts. Hold a workout and drag to reorder the day. */
export function DailyView() {
  const log = useLog();
  const week = weekOf(log.selectedDate);
  const sessions = log.sessionsFor(log.selectedDate);

  // The whole list is one drop zone; dropping reorders the day.
  const drag = useSessionDrag(
    [sessions.map((s) => s.id)],
    (id, _zone, index) => log.moveSession(id, log.selectedDate, index),
    { rowGap: space.lg },
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: space.md, paddingTop: space.lg }}>
        <DayPills selected={week.indexOf(log.selectedDate)} onSelect={(i) => log.selectDate(week[i])} />
      </View>

      <DragList drag={drag} contentContainerStyle={{ flexGrow: 1, paddingTop: space.lg }}>
        {sessions.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <AppText variant="note" color={colors.placeholder} align="center">
              Nothing logged yet.{"\n"}Tap + Workout to add one.
            </AppText>
          </View>
        ) : (
          <View style={{ gap: space.lg }} onLayout={(e) => drag.registerZone(0, e.nativeEvent.layout, 0)}>
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
