import { useState } from "react";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import { AppText } from "@/components/ui";
import { FLOATING_BAR_HEIGHT } from "@/components/ui/floating-bar";
import { space } from "@/constants/theme";
import type { Session } from "@/data/types";
import { addDays, formatWeekRange, toKey, weekOf, type DateKey } from "@/lib/dates";
import { useLog } from "@/store/log";

import { DayMarkers } from "./day-markers";
import { DaySection } from "./day-section";
import { DropLine, LIST_SIDE, LiftedCopy } from "./drag-overlay";
import { DraggableSession } from "./draggable-session";
import { DropZone } from "./drop-zone";
import { UnscheduledSection } from "./unscheduled-section";
import { useSessionDrag } from "./use-session-drag";

/** Drop zone 0 is Unscheduled; 1–7 are Sunday–Saturday. */
const UNSCHEDULED = 0;

/**
 * The whole week at once, Sunday to Saturday, with Unscheduled workouts on top.
 * Days start collapsed; tap one to see its workouts. Put a workout on a day with its
 * day markers, or hold any workout and drag it to another day.
 */
export function WeeklyView() {
  const log = useLog();
  const week = weekOf(log.selectedDate);
  const today = toKey(new Date());
  const [expanded, setExpanded] = useState<ReadonlySet<DateKey>>(new Set());

  const expand = (date: DateKey) => setExpanded((prev) => new Set(prev).add(date));
  const toggle = (date: DateKey) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(date)) next.add(date);
      return next;
    });

  /**
   * Puts a workout on a day (expanding it, so you can see where it went) or back in
   * Unscheduled, at `index` among that day's other workouts or at the end.
   */
  const place = (id: string, date: DateKey | null, index?: number) => {
    if (index === undefined && log.session(id)?.date === date) return;
    log.moveSession(id, date, index);
    if (date) expand(date);
  };

  const days = week.map((date) => log.sessionsFor(date));
  // The rows each drop zone is showing, in order: collapsed days show none.
  const rowIds = [
    log.unscheduled.map((s) => s.id),
    ...week.map((date, i) => (expanded.has(date) ? days[i].map((s) => s.id) : [])),
  ];

  const {
    viewportRef,
    scrollRef,
    scrollY,
    contentHeight,
    hover,
    lineY,
    ghostX,
    ghostY,
    dragging,
    registerZone,
    registerRow,
    gestureFor,
  } = useSessionDrag(rowIds, (id, zone, index) => place(id, zone === UNSCHEDULED ? null : week[zone - 1], index));
  const lifted = dragging ? log.session(dragging) : undefined;

  const draggable = (s: Session) => (
    <DraggableSession session={s} gesture={gestureFor(s.id)} lifted={s.id === dragging} />
  );

  return (
    <View style={{ flex: 1 }}>
      <WeekNav
        label={formatWeekRange(week)}
        onPrevious={() => log.selectDate(addDays(log.selectedDate, -7))}
        onNext={() => log.selectDate(addDays(log.selectedDate, 7))}
      />

      <Animated.View ref={viewportRef} style={{ flex: 1 }} collapsable={false}>
        <GestureDetector gesture={Gesture.Native()}>
          <Animated.ScrollView
            ref={scrollRef}
            scrollEnabled={!dragging}
            onContentSizeChange={(_, h) => contentHeight.set(h)}
            contentContainerStyle={{
              paddingHorizontal: LIST_SIDE,
              paddingTop: space.md,
              paddingBottom: FLOATING_BAR_HEIGHT + space.lg,
              gap: space.md,
            }}
          >
            <DropZone index={UNSCHEDULED} hover={hover} onLayout={registerZone}>
              <UnscheduledSection
                sessions={log.unscheduled}
                renderSession={(s) => (
                  <View key={s.id} style={{ gap: space.xs }} onLayout={(e) => registerRow(s.id, e.nativeEvent.layout)}>
                    {draggable(s)}
                    <DayMarkers week={week} onPick={(date) => place(s.id, date)} />
                  </View>
                )}
              />
            </DropZone>

            {week.map((date, i) => (
              <DropZone key={i} index={i + 1} hover={hover} onLayout={registerZone}>
                <DaySection
                  date={date}
                  sessions={days[i]}
                  isToday={date === today}
                  expanded={expanded.has(date)}
                  onToggle={() => toggle(date)}
                  renderSession={(s) => (
                    <View key={s.id} onLayout={(e) => registerRow(s.id, e.nativeEvent.layout)}>
                      {draggable(s)}
                    </View>
                  )}
                />
              </DropZone>
            ))}
          </Animated.ScrollView>
        </GestureDetector>

        {lifted && <DropLine y={lineY} scrollY={scrollY} />}
        {lifted && <LiftedCopy session={lifted} x={ghostX} y={ghostY} />}
      </Animated.View>
    </View>
  );
}

/** ‹ Sep 20 – 26 › */
function WeekNav({ label, onPrevious, onNext }: { label: string; onPrevious: () => void; onNext: () => void }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: LIST_SIDE,
        paddingTop: space.md,
      }}
    >
      <NavArrow symbol="‹" label="Previous week" onPress={onPrevious} />
      <AppText variant="label">{label}</AppText>
      <NavArrow symbol="›" label="Next week" onPress={onNext} />
    </View>
  );
}

function NavArrow({ symbol, label, onPress }: { symbol: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => ({ paddingHorizontal: space.xs, opacity: pressed ? 0.4 : 1 })}
    >
      <AppText variant="heading">{symbol}</AppText>
    </Pressable>
  );
}
