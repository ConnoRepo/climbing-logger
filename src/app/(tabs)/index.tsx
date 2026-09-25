import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Button } from "@/components/ui";
import { FloatingBar } from "@/components/ui/floating-bar";
import { DailyView } from "@/components/week/daily-view";
import { WeeklyView } from "@/components/week/weekly-view";
import { colors, space } from "@/constants/theme";
import { formatDayHeader } from "@/lib/dates";
import { useLog } from "@/store/log";

export default function Landing() {
  const { selectedDate } = useLog();
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const weekly = mode === "weekly";

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ paddingHorizontal: space.md, paddingTop: 9, alignItems: "center" }}>
        <AppText variant="header" align="center">
          {formatDayHeader(selectedDate)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMode(weekly ? "daily" : "weekly")}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.4 : 1 })}
        >
          <AppText variant="button" color={colors.inkSoft} style={{ textDecorationLine: "underline" }}>
            {weekly ? "Daily view" : "Weekly view"}
          </AppText>
        </Pressable>
      </View>

      {weekly ? <WeeklyView /> : <DailyView />}

      {/* Floats over the list, which scrolls behind it. */}
      <FloatingBar>
        <Button label="Journal" style={{ width: 100 }} onPress={() => router.push("/journal")} />
        <Button
          label="+ Workout"
          style={{ width: 100 }}
          // From the weekly view, new workouts go to Unscheduled.
          onPress={() => router.push(weekly ? { pathname: "/add-workout", params: { target: "unscheduled" } } : "/add-workout")}
        />
      </FloatingBar>
    </SafeAreaView>
  );
}
