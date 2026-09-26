import { View } from "react-native";

import { AppText, Box, Stepper } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { formatElapsed } from "@/data/format";
import type { Session } from "@/data/types";
import { useStopwatch } from "@/hooks/use-stopwatch";

type StopwatchCardProps = {
  session: Session;
  /** Sets the logged time, in seconds. */
  onChangeSeconds: (seconds: number) => void;
};

/**
 * A stopwatch session's logged time, with a minutes stepper to fix it (say the
 * clock was left running). The stepper is hidden while the clock runs.
 */
export function StopwatchCard({ session, onChangeSeconds }: StopwatchCardProps) {
  const { running, elapsedMs } = useStopwatch(session);

  return (
    <Box style={{ padding: space.sm, gap: space.sm, alignItems: "center" }}>
      <AppText variant="note" color={colors.placeholder} align="center">
        {running ? "Running" : session.status === "done" ? "Logged" : "Counts up until you finish"}
      </AppText>
      <AppText variant="display" style={{ fontVariant: ["tabular-nums"] }}>
        {formatElapsed(elapsedMs)}
      </AppText>
      {!running && (
        <View style={{ gap: 4, alignItems: "center" }}>
          <AppText variant="note">Time (min)</AppText>
          <Stepper
            label="Session length in minutes"
            value={Math.round(elapsedMs / 60000)}
            step={5}
            min={0}
            onChange={(minutes) => onChangeSeconds(Math.round(minutes * 60))}
          />
        </View>
      )}
    </Box>
  );
}
