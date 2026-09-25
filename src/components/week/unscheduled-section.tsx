import type { ReactNode } from "react";
import { View } from "react-native";

import { AppText } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import type { Session } from "@/data/types";

type UnscheduledSectionProps = {
  sessions: Session[];
  /** Renders one unscheduled workout (its row plus day markers). */
  renderSession: (session: Session) => ReactNode;
};

/** Workouts added from the week view land here, waiting to be put on a day. */
export function UnscheduledSection({ sessions, renderSession }: UnscheduledSectionProps) {
  return (
    <View style={{ gap: space.sm, minHeight: 80 }}>
      <AppText variant="label">Unscheduled</AppText>
      {sessions.length ? (
        sessions.map(renderSession)
      ) : (
        <AppText variant="note" color={colors.placeholder} align="center" style={{ marginTop: space.xs }}>
          Tap + Workout to add one, or drag one here.
        </AppText>
      )}
    </View>
  );
}
