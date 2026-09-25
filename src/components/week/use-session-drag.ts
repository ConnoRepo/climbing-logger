import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import type { LayoutRectangle } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  measure,
  scrollTo,
  useAnimatedRef,
  useFrameCallback,
  useScrollOffset,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { FLOATING_BAR_HEIGHT } from "@/components/ui";
import { space } from "@/constants/theme";
import { clamp } from "@/lib/math";

import { DROP_ZONE_INSET } from "./drop-zone";

/** How long to hold a workout before it lifts. */
const LONG_PRESS_MS = 300;
/** Autoscroll kicks in this close to the top or bottom (above the floating buttons). */
const EDGE = 56;
const MAX_SCROLL_PER_FRAME = 12;
/**
 * How far into the next row the finger goes before the drop line jumps past it,
 * in the direction of travel. Lower feels quicker to respond.
 */
const SWITCH_AT = 1 / 3;

/** A drop zone, or a row within one. `inset` is where a zone's rows start inside it. */
type Zone = { y: number; height: number; inset?: number };
type Slot = { index: number; lineY: number };

/** The drop zone at content position `y`: the one containing it, else the nearest. -1 if none. */
function hitTest(zones: Zone[], y: number) {
  "worklet";
  let best = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    if (!z) continue;
    const distance = y < z.y ? z.y - y : y > z.y + z.height ? y - (z.y + z.height) : 0;
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Where in a section a workout would land: its index among the section's other rows,
 * and the content y to draw the drop line at (centred in the gap between rows).
 * The finger passes a row once it's SWITCH_AT of the way in, from whichever side it's
 * coming. Index -1 (no line) means "at the end", for sections showing no rows.
 */
function slotAt(
  zone: Zone,
  rowIds: string[],
  rows: Record<string, Zone>,
  movingId: string,
  y: number,
  downward: boolean,
  rowGap: number,
): Slot {
  "worklet";
  const others = rowIds.filter((id) => id !== movingId && rows[id]);
  if (others.length === 0) return { index: -1, lineY: -1 };
  const top = zone.y + (zone.inset ?? 0);
  const through = downward ? SWITCH_AT : 1 - SWITCH_AT;
  let index = others.length;
  for (let i = 0; i < others.length; i++) {
    const row = rows[others[i]];
    if (y < top + row.y + row.height * through) {
      index = i;
      break;
    }
  }
  const last = rows[others[others.length - 1]];
  const lineY =
    index < others.length ? top + rows[others[index]].y - rowGap / 2 : top + last.y + last.height + rowGap / 2;
  return { index, lineY };
}

/**
 * Long-press-and-drag for moving workouts between sections (the week's days) and
 * reordering them within one. Also used by the daily view, as a single section.
 *
 * Sections register as drop zones by index (their `onLayout`, in scroll-content
 * coordinates). Each row gets a pan gesture that activates after a long press; while
 * it's held, a lifted copy follows the finger in the viewport, the zone under the
 * finger is `hover`, and the list autoscrolls near the edges. Rows register their layout too,
 * so within a section showing rows a line marks the slot the workout would drop into.
 * Letting go calls `onDrop` with the zone and slot (undefined: the end); letting go outside
 * the list (over the header) floats the copy back.
 *
 * `rowIds` lists, per zone, the ids of the rows it's showing, in order. `rowGap` is the
 * space between those rows, to centre the drop line in.
 */
export function useSessionDrag(
  rowIds: string[][],
  onDrop: (sessionId: string, zone: number, index: number | undefined) => void,
  { rowGap = space.sm }: { rowGap?: number } = {},
) {
  const viewportRef = useAnimatedRef<Animated.View>();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollOffset(scrollRef);

  const zones = useSharedValue<Zone[]>([]);
  const zoneList = useRef<Zone[]>([]);
  const rows = useSharedValue<Record<string, Zone>>({});
  const rowList = useRef<Record<string, Zone>>({});
  const zoneRows = useSharedValue<string[][]>([]);
  const movingId = useSharedValue("");
  /** Which way the finger last moved, and where it was (content y), to switch slots on the leading side. */
  const downward = useSharedValue(true);
  const lastY = useSharedValue(0);
  const slot = useSharedValue(-1);
  /** Content y of the drop line; -1 hides it. */
  const lineY = useSharedValue(-1);
  const contentHeight = useSharedValue(0);
  const hover = useSharedValue(-1);
  const active = useSharedValue(false);
  const viewTop = useSharedValue(0);
  const viewHeight = useSharedValue(0);
  const grabX = useSharedValue(0);
  const grabY = useSharedValue(0);
  /** 0 → 1 as a row lifts off the page; back to 0 as it floats home. */
  const lift = useSharedValue(0);
  /** Where the picked-up row's top was, in content coordinates, to float back to. */
  const originY = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const ghostX = useSharedValue(0);
  const ghostY = useSharedValue(0);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    zoneRows.set(rowIds);
  }, [rowIds, zoneRows]);

  /** Updates the target zone, slot and drop line for a finger at viewport y. */
  const track = (y: number, scroll: number) => {
    "worklet";
    // Over the header (or below the screen) there's nowhere to drop.
    const contentY = y + scroll;
    if (contentY > lastY.value + 1) downward.set(true);
    else if (contentY < lastY.value - 1) downward.set(false);
    lastY.set(contentY);
    const zone = y < 0 || y > viewHeight.value ? -1 : hitTest(zones.value, contentY);
    hover.set(zone);
    const target =
      zone < 0
        ? { index: -1, lineY: -1 }
        : slotAt(
            zones.value[zone],
            zoneRows.value[zone] ?? [],
            rows.value,
            movingId.value,
            contentY,
            downward.value,
            rowGap,
          );
    slot.set(target.index);
    lineY.set(target.lineY);
  };

  const autoscroll = useFrameCallback(() => {
    if (!active.value) return;
    const y = fingerY.value;
    const h = viewHeight.value;
    const bottomEdge = h - FLOATING_BAR_HEIGHT - EDGE;
    let speed = 0;
    if (y >= 0 && y < EDGE) speed = -MAX_SCROLL_PER_FRAME * (1 - y / EDGE);
    else if (y > bottomEdge && y <= h) speed = MAX_SCROLL_PER_FRAME * Math.min(1, (y - bottomEdge) / EDGE);
    if (speed === 0) return;
    const next = clamp(scrollY.value + speed, 0, Math.max(0, contentHeight.value - h));
    if (next === scrollY.value) return;
    scrollTo(scrollRef, 0, next, false);
    track(y, next);
  }, false);

  // A firm tap as a workout lifts off the page, and a softer one as it lands:
  // dropped in place, or back where it came from.
  const begin = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDragging(id);
    autoscroll.setActive(true);
  };
  const end = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    autoscroll.setActive(false);
    setDragging(null);
  };
  const drop = (id: string, zone: number, index: number) => {
    end();
    onDrop(id, zone, index < 0 ? undefined : index);
  };

  /**
   * Registers section `index` as a drop zone; pass to that section's `onLayout`.
   * `inset` is how far in its rows start (a DropZone's outline margin by default).
   */
  const registerZone = (index: number, layout: LayoutRectangle, inset = DROP_ZONE_INSET) => {
    zoneList.current[index] = { y: layout.y, height: layout.height, inset };
    zones.set([...zoneList.current]);
  };

  /** Registers a workout row's layout within its section; pass to the row's `onLayout`. */
  const registerRow = (sessionId: string, layout: LayoutRectangle) => {
    rowList.current[sessionId] = { y: layout.y, height: layout.height };
    rows.set({ ...rowList.current });
  };

  /** The long-press drag gesture for one workout row. */
  const gestureFor = (sessionId: string) =>
    Gesture.Pan()
      .activateAfterLongPress(LONG_PRESS_MS)
      .onStart((e) => {
        const view = measure(viewportRef);
        if (!view) return;
        const y = e.absoluteY - view.pageY;
        viewTop.set(view.pageY);
        viewHeight.set(view.height);
        grabX.set(e.x);
        grabY.set(e.y);
        lift.set(0);
        lift.set(withTiming(1, { duration: 150 }));
        fingerY.set(y);
        ghostX.set(0);
        ghostY.set(y - e.y);
        originY.set(y - e.y + scrollY.value);
        movingId.set(sessionId);
        lastY.set(y + scrollY.value);
        track(y, scrollY.value);
        active.set(true);
        scheduleOnRN(begin, sessionId);
      })
      .onUpdate((e) => {
        if (!active.value) return;
        const y = e.absoluteY - viewTop.value;
        fingerY.set(y);
        ghostX.set(e.translationX * 0.25);
        ghostY.set(y - grabY.value);
        track(y, scrollY.value);
      })
      .onFinalize(() => {
        if (!active.value) return;
        active.set(false);
        const zone = hover.value;
        const index = slot.value;
        hover.set(-1);
        lineY.set(-1);
        if (zone >= 0) {
          scheduleOnRN(drop, sessionId, zone, index);
        } else {
          // Nowhere to drop: float back to where it was picked up.
          ghostX.set(withTiming(0, { duration: 200 }));
          lift.set(withTiming(0, { duration: 200 }));
          ghostY.set(withTiming(originY.value - scrollY.value, { duration: 200 }, () => scheduleOnRN(end)));
        }
      });

  return {
    viewportRef,
    scrollRef,
    scrollY,
    contentHeight,
    lineY,
    hover,
    ghostX,
    ghostY,
    grabX,
    grabY,
    lift,
    dragging,
    registerZone,
    registerRow,
    gestureFor,
  };
}
