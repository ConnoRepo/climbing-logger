import { router } from "expo-router";
import { View } from "react-native";
import { GestureDetector, type GestureType } from "react-native-gesture-handler";

import { WorkoutRow } from "@/components/ui";
import { categoryInfo } from "@/data/categories";
import { sessionProgress } from "@/data/format";
import type { Session } from "@/data/types";
import { useLog } from "@/store/log";

type DraggableSessionProps = {
  session: Session;
  /** The long-press drag gesture for this row. */
  gesture: GestureType;
  /** This row is the one being dragged: it stays as a faint placeholder. */
  lifted: boolean;
};

/** A workout row in the week view: open, tick off, swipe to delete, or hold to drag. */
export function DraggableSession({ session, gesture, lifted }: DraggableSessionProps) {
  const { setSessionDone, removeSession } = useLog();

  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false} style={{ opacity: lifted ? 0.25 : 1 }}>
        <SessionRow
          session={session}
          onToggle={(done) => setSessionDone(session.id, done)}
          onRemove={() => removeSession(session.id)}
        />
      </View>
    </GestureDetector>
  );
}

/** The plain row, shared with the lifted copy that follows the finger. */
export function SessionRow({
  session,
  onToggle,
  onRemove,
}: {
  session: Session;
  onToggle?: (done: boolean) => void;
  onRemove?: () => void;
}) {
  return (
    <WorkoutRow
      title={session.name}
      subtitle={sessionProgress(session)}
      icon={categoryInfo(session.category).icon}
      done={session.status === "done"}
      onToggle={onToggle}
      onOpen={() => router.push({ pathname: "/session/[id]", params: { id: session.id } })}
      onRemove={onRemove}
    />
  );
}
