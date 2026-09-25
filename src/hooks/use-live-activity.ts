import { requireOptionalNativeModule } from "expo";
import type { LiveActivity, LiveActivityFactory } from "expo-widgets";
import { useEffect, useRef } from "react";

import type { WorkoutActivityProps } from "@/widgets/workout-activity";

// Only loaded when the native module is in the build: Expo Go and builds made
// before expo-widgets was added don't have it, and importing it there throws.
const WorkoutActivity: LiveActivityFactory<WorkoutActivityProps> | null = requireOptionalNativeModule("ExpoWidgets")
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/widgets/workout-activity").default
  : null;

/**
 * Mirrors the workout onto the Lock Screen / Dynamic Island (iOS dev builds; a
 * no-op elsewhere). Starts on mount (or picks up one left running), updates
 * when `props` change, and ends on unmount. Tapping it opens `url`.
 */
export function useLiveActivity(props: WorkoutActivityProps | undefined, url: string) {
  const activity = useRef<LiveActivity<WorkoutActivityProps> | null>(null);
  const key = props && JSON.stringify(props);

  useEffect(() => {
    if (!props || !WorkoutActivity) return;
    try {
      if (!activity.current) {
        // Picked-up activities still need this step's props, so they get the update below.
        activity.current = WorkoutActivity.getInstances()[0] ?? null;
        if (!activity.current) {
          activity.current = WorkoutActivity.start(props, url);
          return;
        }
      }
      activity.current.update(props).catch(() => {});
    } catch {
      // Live Activities turned off in Settings, or unsupported: the timer works without it.
    }
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      activity.current?.end("immediate").catch(() => {});
      activity.current = null;
    },
    [],
  );
}
