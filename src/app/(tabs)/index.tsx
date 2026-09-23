import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, DayPills, WorkoutRow } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { categoryInfo } from "@/data/categories";
import type { Session } from "@/data/types";
import { formatDayHeader, weekOf } from "@/lib/dates";
import { useLog } from "@/store/log";

export default function Landing() {
  const { selectedDate, selectDate, sessionsFor, setSessionDone, removeSession } = useLog();
  const week = weekOf(selectedDate);
  const sessions = sessionsFor(selectedDate);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ paddingHorizontal: space.md, paddingTop: 9, gap: space.lg }}>
        <AppText variant="header" align="center">
          {formatDayHeader(selectedDate)}
        </AppText>
        <DayPills selected={week.indexOf(selectedDate)} onSelect={(i) => selectDate(week[i])} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 27.5, paddingVertical: space.lg, gap: space.lg }}
      >
        {sessions.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <AppText variant="note" color={colors.placeholder} align="center">
              Nothing logged yet.{"\n"}Tap + Workout to add one.
            </AppText>
          </View>
        ) : (
          sessions.map((s) => (
            <WorkoutRow
              key={s.id}
              title={s.name}
              subtitle={progress(s)}
              icon={categoryInfo(s.category).icon}
              done={s.status === "done"}
              onToggle={(done) => setSessionDone(s.id, done)}
              onIconPress={() => router.push({ pathname: "/session/[id]", params: { id: s.id } })}
              onRemove={() => removeSession(s.id)}
            />
          ))
        )}
      </ScrollView>

      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 27, paddingVertical: 7 }}>
        <Button label="Journal" style={{ width: 100 }} onPress={() => router.push("/journal")} />
        <Button label="+ Workout" style={{ width: 100 }} onPress={() => router.push("/add-workout")} />
      </View>
    </SafeAreaView>
  );
}

/** "3/5 sets", or nothing for a workout with no sets. */
function progress(s: Session) {
  const sets = s.exercises.flatMap((e) => e.sets);
  if (sets.length === 0) return undefined;
  return `${sets.filter((set) => set.done).length}/${sets.length} sets`;
}
