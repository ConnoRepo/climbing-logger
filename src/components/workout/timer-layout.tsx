import { router, Stack } from "expo-router";
import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Box, Button, NotebookInput, Pager } from "@/components/ui";
import { borders, colors, space } from "@/constants/theme";
import type { Session } from "@/data/types";
import { useKeyboardHeight } from "@/hooks/use-keyboard-height";
import { useLog } from "@/store/log";

/** What every kind's timer is given: the session it runs. */
export type TimerProps = { session: Session };

/** What the big clock at the top shows. */
type ClockPanelProps = { fill: keyof typeof colors; clock: string; caption?: string };

/** A button in the row along the bottom. */
type TimerControl = { label: string; onPress: () => void; disabled?: boolean };

type TimerLayoutProps = {
  session: Session;
  /** What the log holds ("sets", "time"): names its page's dot, and the review's hint. */
  logLabel: string;
  panel: ClockPanelProps;
  /** Under the clock: what's being done (the sets), if anything. Once finished, the log to look over. */
  body?: ReactNode;
  /** Left to right. The last one moves things on (Next, Finish), and becomes Done in the review. */
  controls: TimerControl[];
  /** Past the end: the review, where the log can be tidied up and notes written before Done. */
  finished: boolean;
};

const PANEL_HEIGHT = 169;

/**
 * The timer screen's bones, the same for every kind of session: the big clock, what's being
 * done under it, and a row of controls. Once finished it becomes the review: the log swipes
 * itself across to a notes box, and Done goes home.
 */
export function TimerLayout({ session, logLabel, panel, body, controls, finished }: TimerLayoutProps) {
  const log = useLog();
  const { bottom } = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const padBottom = Math.max(bottom, space.md);
  const gap = space.md;

  // Typing in the review: the screen rises above the keyboard and the clock folds away to
  // make room, both sliding with the keyboard itself. Until the review, the set steppers'
  // keypad is handled by the set list's own scrolling, so nothing here moves.
  const screenStyle = useAnimatedStyle(() => ({
    paddingBottom: finished ? Math.max(padBottom, keyboard.height.value + gap) : padBottom,
  }));
  const panelStyle = useAnimatedStyle(() => {
    const up = finished && keyboard.full.value > 0 ? Math.min(1, keyboard.height.value / keyboard.full.value) : 0;
    // Folding to nothing takes the gap under it too.
    return { height: PANEL_HEIGHT * (1 - up), marginBottom: -gap * up, opacity: 1 - up };
  });

  // In the review only Done does anything; the rest stay put, faded, so nothing shifts.
  const buttons: TimerControl[] = finished
    ? controls.map((c, i) =>
        i === controls.length - 1 ? { label: "Done", onPress: () => router.dismissTo("/") } : { ...c, disabled: true },
      )
    : controls;
  // Three to a row spread to the edges; two sit evenly, with more room each.
  const three = buttons.length > 2;

  return (
    <Animated.View style={[{ flex: 1, paddingHorizontal: 15, gap }, screenStyle]}>
      <Stack.Screen options={{ title: session.name }} />

      <Animated.View style={[{ overflow: "hidden" }, panelStyle]}>
        {!finished ? (
          <ClockPanel {...panel} />
        ) : (
          <ClockPanel fill="fill" clock="Done" caption={`Swipe back to check your ${logLabel}`} />
        )}
      </Animated.View>

      {finished ? (
        // Opens on the log, then swipes itself across to the notes.
        <Pager labels={[logLabel, "notes"]} fill startPage={1}>
          {body}
          <NotebookInput
            value={session.notes}
            onChangeText={(notes) => log.setSessionNotes(session.id, notes)}
            placeholder="How did it go? Notes for next time..."
            style={{ flex: 1, minHeight: 0 }}
          />
        </Pager>
      ) : (
        (body ?? <View style={{ flex: 1 }} />)
      )}

      <View style={{ flexDirection: "row", justifyContent: three ? "space-between" : "space-evenly", paddingHorizontal: 12 }}>
        {buttons.map((b, i) => (
          <Button
            key={i}
            label={b.label}
            variant="fill"
            textVariant="label"
            disabled={b.disabled}
            style={[CONTROL, { width: three ? 110 : 140, opacity: b.disabled ? 0.35 : 1 }]}
            onPress={b.onPress}
          />
        ))}
      </View>
    </Animated.View>
  );
}

/** The big clock at the top: green while working, darker grey while paused. */
function ClockPanel({ fill, clock, caption }: ClockPanelProps) {
  return (
    <Box
      fill={fill}
      style={{ height: PANEL_HEIGHT, alignItems: "center", justifyContent: "center", paddingHorizontal: space.sm }}
    >
      {/* Shrinks to fit past an hour ("1:02:03"). The negative margins eat into the empty space above
          and below the digits (a smaller lineHeight breaks the shrinking), lifting the caption off the edge. */}
      <AppText
        variant="clock"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontVariant: ["tabular-nums"], marginVertical: -8 }}
      >
        {clock}
      </AppText>
      {caption && (
        <AppText variant="label" align="center">
          {caption}
        </AppText>
      )}
    </Box>
  );
}

/** The bottom row's buttons, outlined like the workout screen's Start button. */
const CONTROL = { height: 48, borderWidth: borders.thick, borderColor: colors.ink };
