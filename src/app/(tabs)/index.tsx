import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button, DayPills, WorkoutRow } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { formatDayHeader, weekOf } from "@/lib/dates";
import { useLog } from "@/store/log";

export default function Landing() {
  const { selectedDate, selectDate, workoutsFor, toggleWorkout, removeWorkout } = useLog();
  const week = weekOf(selectedDate);
  const workouts = workoutsFor(selectedDate);

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
        {workouts.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <AppText variant="note" color={colors.placeholder} align="center">
              Nothing logged yet.{"\n"}Tap + Workout to add one.
            </AppText>
          </View>
        ) : (
          workouts.map((w) => (
            <WorkoutRow
              key={w.id}
              title={w.name}
              icon={w.icon}
              done={w.done}
              onToggle={() => toggleWorkout(selectedDate, w.id)}
              onRemove={() => removeWorkout(selectedDate, w.id)}
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
