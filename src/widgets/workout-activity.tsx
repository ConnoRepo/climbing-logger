import { HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { font, foregroundStyle, frame, lineLimit, monospacedDigit, padding } from "@expo/ui/swift-ui/modifiers";
import { createLiveActivity, type LiveActivityEnvironment } from "expo-widgets";

/** Sent as JSON, so times are ms numbers rather than Dates. */
export type WorkoutActivityProps = {
  title: string;
  /** "Set 2 · Hang 3/6 · On", "Rest · Set 3 next" */
  caption: string;
  /** Timed steps: the step's full length. Untimed sets leave the clock fields out and show "GO". */
  stepMs?: number;
  /** Running: when the step's countdown reaches 0. */
  endsAt?: number;
  /** Paused: time left, frozen on the clock. */
  pausedLeftMs?: number;
};

/**
 * The running workout on the Lock Screen and in the Dynamic Island. iOS draws the
 * countdown itself, so the app only updates it when the step changes or pauses.
 *
 * This function is compiled to a string and run by the widget extension: it can
 * only use its props and the @expo/ui components and modifiers, nothing else
 * from this file.
 */
const WorkoutActivity = (props: WorkoutActivityProps, environment: LiveActivityEnvironment) => {
  "widget";
  const accent = environment.isLuminanceReduced ? "#FFFFFF" : "#208AEF";

  let interval: { lower: Date; upper: Date } | undefined;
  let pauseTime: Date | undefined;
  if (props.stepMs !== undefined && props.pausedLeftMs !== undefined) {
    // Frozen: the clock shows upper − pauseTime.
    pauseTime = new Date();
    const upper = pauseTime.getTime() + props.pausedLeftMs;
    interval = { lower: new Date(upper - props.stepMs), upper: new Date(upper) };
  } else if (props.stepMs !== undefined && props.endsAt !== undefined) {
    interval = { lower: new Date(props.endsAt - props.stepMs), upper: new Date(props.endsAt) };
  }

  const clock = (size: number, maxWidth?: number) =>
    interval ? (
      <Text
        timerInterval={interval}
        countsDown
        pauseTime={pauseTime}
        modifiers={[font({ size, weight: "bold" }), monospacedDigit(), ...(maxWidth ? [frame({ maxWidth })] : [])]}
      />
    ) : (
      <Text modifiers={[font({ size, weight: "bold" }), foregroundStyle(accent)]}>GO</Text>
    );

  const icon = <Image systemName="figure.climbing" color={accent} />;

  return {
    banner: (
      <HStack spacing={12} modifiers={[padding({ all: 16 })]}>
        <VStack alignment="leading" spacing={4}>
          <Text modifiers={[font({ size: 15, weight: "semibold" }), lineLimit(1)]}>{props.title}</Text>
          <Text modifiers={[font({ size: 13 }), foregroundStyle("secondary"), lineLimit(1)]}>{props.caption}</Text>
        </VStack>
        <Spacer />
        {clock(34)}
      </HStack>
    ),
    compactLeading: icon,
    compactTrailing: clock(14, 44),
    minimal: clock(12, 36),
    expandedLeading: icon,
    expandedTrailing: clock(22, 80),
    expandedBottom: (
      <VStack alignment="leading" spacing={2}>
        <Text modifiers={[font({ size: 15, weight: "semibold" }), lineLimit(1)]}>{props.title}</Text>
        <Text modifiers={[font({ size: 13 }), foregroundStyle("secondary"), lineLimit(1)]}>{props.caption}</Text>
      </VStack>
    ),
  };
};

export default createLiveActivity("WorkoutActivity", WorkoutActivity);
