import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import { FLOATING_BAR_HEIGHT, LIST_SIDE } from "@/components/ui";
import { space } from "@/constants/theme";
import { useLog } from "@/store/log";

import { DropLine, LiftedCopy } from "./drag-overlay";
import type { useSessionDrag } from "./use-session-drag";

type DragListProps = {
  drag: ReturnType<typeof useSessionDrag>;
  /** Merged over the list's side padding and the room it leaves for the floating buttons. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * The scrolling list a `useSessionDrag` works over: the viewport it measures, the
 * scroll view it autoscrolls, and the drop line and lifted copy drawn while a workout is held.
 */
export function DragList({ drag, contentContainerStyle, children }: DragListProps) {
  const { viewportRef, scrollRef, scrollY, contentHeight, lineY, ghostX, ghostY, dragging } = drag;
  const log = useLog();
  const lifted = dragging ? log.session(dragging) : undefined;

  return (
    <Animated.View ref={viewportRef} style={{ flex: 1 }} collapsable={false}>
      <GestureDetector gesture={Gesture.Native()}>
        <Animated.ScrollView
          ref={scrollRef}
          scrollEnabled={!dragging}
          onContentSizeChange={(_, h) => contentHeight.set(h)}
          contentContainerStyle={[
            { paddingHorizontal: LIST_SIDE, paddingBottom: FLOATING_BAR_HEIGHT + space.lg },
            contentContainerStyle,
          ]}
        >
          {children}
        </Animated.ScrollView>
      </GestureDetector>

      {lifted && <DropLine y={lineY} scrollY={scrollY} />}
      {lifted && <LiftedCopy session={lifted} x={ghostX} y={ghostY} />}
    </Animated.View>
  );
}
