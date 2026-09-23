import { Stack } from "expo-router";

import { colors } from "@/constants/theme";

/** Category list → workouts in that category, stacked inside the sheet. */
export default function AddWorkoutLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />;
}
