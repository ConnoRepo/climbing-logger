import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import { AppText, DayPills } from "@/components/ui";
import { FLOATING_BAR_HEIGHT } from "@/components/ui/floating-bar";
import { colors, space } from "@/constants/theme";
import { weekOf } from "@/lib/dates";
import { useLog } from "@/store/log";

import { DropLine, LIST_SIDE, LiftedCopy } from "./drag-overlay";
import { DraggableSession } from "./draggable-session";
import { useSessionDrag } from "./use-session-drag";

/** The selected day: its pills and its workouts. Hold a workout and drag to reorder the day. */
export function DailyView() {
  const log = useLog();
  const week = weekOf(log.selectedDate);
  const sessions = log.sessionsFor(log.selectedDate);

  // The whole list is one drop zone; dropping reorders the day.
  const {
    viewportRef,
    scrollRef,
    scrollY,
    contentHeight,
    lineY,
    ghostX,
    ghostY,
    dragging,
    registerZone,
    registerRow,
    gestureFor,
  } = useSessionDrag(
    [sessions.map((s) => s.id)],
    (id, _zone, index) => log.moveSession(id, log.selectedDate, index),
    { rowGap: space.lg },
  );
  const lifted = dragging ? log.session(dragging) : undefined;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: space.md, paddingTop: space.lg }}>
        <DayPills selected={week.indexOf(log.selectedDate)} onSelect={(i) => log.selectDate(week[i])} />
      </View>

      <Animated.View ref={viewportRef} style={{ flex: 1 }} collapsable={false}>
        <GestureDetector gesture={Gesture.Native()}>
          <Animated.ScrollView
            ref={scrollRef}
            scrollEnabled={!dragging}
            onContentSizeChange={(_, h) => contentHeight.set(h)}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: LIST_SIDE,
              paddingTop: space.lg,
              paddingBottom: FLOATING_BAR_HEIGHT + space.lg,
            }}
          >
            {sessions.length === 0 ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <AppText variant="note" color={colors.placeholder} align="center">
                  Nothing logged yet.{"\n"}Tap + Workout to add one.
                </AppText>
              </View>
            ) : (
              <View style={{ gap: space.lg }} onLayout={(e) => registerZone(0, e.nativeEvent.layout, 0)}>
                {sessions.map((s) => (
                  <View key={s.id} onLayout={(e) => registerRow(s.id, e.nativeEvent.layout)}>
                    <DraggableSession session={s} gesture={gestureFor(s.id)} lifted={s.id === dragging} />
                  </View>
                ))}
              </View>
            )}
          </Animated.ScrollView>
        </GestureDetector>

        {lifted && <DropLine y={lineY} scrollY={scrollY} />}
        {lifted && <LiftedCopy session={lifted} x={ghostX} y={ghostY} />}
      </Animated.View>
    </View>
  );
}
