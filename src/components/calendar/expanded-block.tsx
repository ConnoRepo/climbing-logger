import { useEffect, type ReactNode } from "react";
import { Modal, Pressable, useWindowDimensions, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { AppText, Box } from "@/components/ui";
import { borders, colors, space, type } from "@/constants/theme";

export type Rect = { x: number; y: number; width: number; height: number };

/** Fast then slow: the frame shoots out and settles into place. */
const TIMING = { duration: 200, easing: Easing.out(Easing.cubic) };
/** Once open, the weeks cascade in top to bottom, one this long after the other. */
const WEEK_STAGGER_MS = 110;
/** Each week drops this far into place as it fades in. */
const WEEK_DROP = 12;
const B = borders.thick;
/** Matches the block card's title, so the grow starts seamlessly. */
const TITLE_TOP = 4;
/** Gap between the open frame and the screen's sides, clear of the rounded corners. */
const SIDE = space.xs;

type ExpandedBlockProps = {
  title: string;
  weeks: string[];
  /** Where the block card sits on screen; the frame grows out from here. */
  from: Rect;
  /** Called once the collapse has finished, to unmount. */
  onClosed: () => void;
};

/** The frame's rectangle at `t` (0 = the block card, 1 = open). */
function frameAt(t: number, from: Rect, to: Rect) {
  "worklet";
  return {
    x: interpolate(t, [0, 1], [from.x, to.x]),
    y: interpolate(t, [0, 1], [from.y, to.y]),
    w: interpolate(t, [0, 1], [from.width, to.width]),
    h: interpolate(t, [0, 1], [from.height, to.height]),
  };
}

const layer: ViewStyle = { position: "absolute", left: 0, top: 0, transformOrigin: "left top" };

/**
 * A calendar block opened full screen: its ink border grows out over everything
 * until it frames the whole page, then its weeks cascade in. Closing plays it back.
 * The open frame stops inside the safe area, so its border never slides under the
 * status bar, home indicator or rounded screen corners; paper fades in around it.
 *
 * Everything moves with transforms only (no per-frame layout), so it stays smooth:
 * the paper is a full-screen sheet scaled down to the frame, the page inside it is
 * scaled back up so it holds still on screen, and each border edge is its own bar.
 */
export function ExpandedBlock({ title, weeks, from, onClosed }: ExpandedBlockProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  // Counts up through the weeks after the frame opens: week i shows as it goes from i to i + 1.
  const cascade = useSharedValue(0);
  const to: Rect = {
    x: SIDE,
    y: insets.top,
    width: width - SIDE * 2,
    height: height - insets.top - insets.bottom,
  };

  useEffect(() => {
    progress.set(withTiming(1, TIMING));
    cascade.set(
      withDelay(
        TIMING.duration,
        withTiming(weeks.length, { duration: weeks.length * WEEK_STAGGER_MS, easing: Easing.linear }),
      ),
    );
  }, [progress, cascade, weeks.length]);

  const close = () => {
    cascade.set(withTiming(0, { duration: 150 }));
    progress.set(
      withTiming(0, TIMING, (finished) => {
        if (finished) scheduleOnRN(onClosed);
      }),
    );
  };

  const sheet = useAnimatedStyle(() => {
    const f = frameAt(progress.value, from, to);
    return {
      transform: [{ translateX: f.x }, { translateY: f.y }, { scaleX: f.w / width }, { scaleY: f.h / height }],
    };
  });
  // Exactly undoes the sheet's transform, so the page stays put and the sheet's edges reveal it.
  const page = useAnimatedStyle(() => {
    const f = frameAt(progress.value, from, to);
    return {
      transform: [{ scaleX: width / f.w }, { scaleY: height / f.h }, { translateX: -f.x }, { translateY: -f.y }],
    };
  });
  const top = useAnimatedStyle(() => {
    const f = frameAt(progress.value, from, to);
    return { transform: [{ translateX: f.x }, { translateY: f.y }, { scaleX: f.w / width }] };
  });
  const bottom = useAnimatedStyle(() => {
    const f = frameAt(progress.value, from, to);
    return { transform: [{ translateX: f.x }, { translateY: f.y + f.h - B }, { scaleX: f.w / width }] };
  });
  const left = useAnimatedStyle(() => {
    const f = frameAt(progress.value, from, to);
    return { transform: [{ translateX: f.x }, { translateY: f.y }, { scaleY: f.h / height }] };
  });
  const right = useAnimatedStyle(() => {
    const f = frameAt(progress.value, from, to);
    return { transform: [{ translateX: f.x + f.w - B }, { translateY: f.y }, { scaleY: f.h / height }] };
  });
  // The title rides along at the top of the frame, ending just under the status bar.
  const heading = useAnimatedStyle(() => {
    const f = frameAt(progress.value, from, to);
    return {
      transform: [
        { translateX: f.x + f.w / 2 - width / 2 },
        { translateY: f.y + B + interpolate(progress.value, [0, 1], [TITLE_TOP, space.xs]) },
      ],
    };
  });

  // Covers the calendar outside the frame once it's open.
  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));

  const headerTop = to.y + B + space.xs;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
      <Animated.View style={[layer, { width, height, backgroundColor: colors.paper }, backdrop]} />
      <Animated.View style={[layer, { width, height, overflow: "hidden", backgroundColor: colors.paper }, sheet]}>
        <Animated.View style={[layer, { width, height }, page]}>
          <View
            style={{
              flex: 1,
              paddingTop: headerTop + type.label.lineHeight + space.md,
              paddingBottom: height - (to.y + to.height) + B + space.md,
              paddingHorizontal: SIDE + B + space.sm,
              gap: space.md,
            }}
          >
            {weeks.map((label, i) => (
              <Week key={label} label={label} index={i} cascade={cascade} />
            ))}
          </View>

          <FadeIn progress={progress} from={0.6} style={{ position: "absolute", left: SIDE + B + space.sm, top: headerTop }}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Close ${title}`} onPress={close} hitSlop={12}>
              <AppText variant="label">‹ Back</AppText>
            </Pressable>
          </FadeIn>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[layer, { width, height: B, backgroundColor: colors.ink }, top]} />
      <Animated.View style={[layer, { width, height: B, backgroundColor: colors.ink }, bottom]} />
      <Animated.View style={[layer, { width: B, height, backgroundColor: colors.ink }, left]} />
      <Animated.View style={[layer, { width: B, height, backgroundColor: colors.ink }, right]} />

      <Animated.View style={[layer, { width, pointerEvents: "none" }, heading]}>
        <AppText variant="label" align="center">
          {title}
        </AppText>
      </Animated.View>
    </Modal>
  );
}

function FadeIn({
  progress,
  from,
  style,
  children,
}: {
  progress: SharedValue<number>;
  from: number;
  style?: ViewStyle;
  children: ReactNode;
}) {
  const fade = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [from, 1], [0, 1], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[style, fade]}>{children}</Animated.View>;
}

/** One week's rectangle; fades in and drops into place when the cascade reaches it. */
function Week({ label, index, cascade }: { label: string; index: number; cascade: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const t = interpolate(cascade.value, [index, index + 1], [0, 1], Extrapolation.CLAMP);
    return { opacity: t, transform: [{ translateY: (t - 1) * WEEK_DROP }] };
  });

  return (
    <Animated.View style={[{ flex: 1 }, style]}>
      <Box style={{ flex: 1 }}>
        <AppText variant="label" align="center" style={{ marginTop: TITLE_TOP }}>
          {label}
        </AppText>
      </Box>
    </Animated.View>
  );
}
