import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

import { AppText, Button, LIST_SIDE, WorkoutRow } from "@/components/ui";
import { SHEET_SIDE, SheetBack, SquareButton } from "@/components/workout/sheet-parts";
import { colors, space } from "@/constants/theme";
import { categoryInfo, isCategory } from "@/data/categories";
import { formatPrescription } from "@/data/format";
import { templateExercise } from "@/data/templates";
import type { WorkoutTemplate } from "@/data/types";
import { formatDayHeader } from "@/lib/dates";
import { useLog } from "@/store/log";

function summary(t: WorkoutTemplate) {
  const exercise = templateExercise(t);
  return exercise ? formatPrescription(exercise) : "";
}

export default function CategoryTemplates() {
  const { category, target } = useLocalSearchParams<{ category: string; target?: string }>();
  const { templatesIn, schedule, createTemplate, selectedDate } = useLog();
  // From the weekly view, workouts go to Unscheduled to be placed on days afterwards.
  const date = target === "unscheduled" ? null : selectedDate;
  const [added, setAdded] = useState<Record<string, number>>({});

  if (!isCategory(category)) return null;
  const info = categoryInfo(category);

  const openTemplate = (id: string) => router.push({ pathname: "/template/[id]", params: { id } });

  function add(t: WorkoutTemplate) {
    schedule(t.id, date);
    setAdded((prev) => ({ ...prev, [t.id]: (prev[t.id] ?? 0) + 1 }));
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ paddingHorizontal: SHEET_SIDE, paddingTop: 40, paddingBottom: space.xl, gap: space.md }}
    >
      <SheetBack />
      <AppText variant="header" align="center">
        {info.label}
      </AppText>

      {/* Rows are the home screen's workout rows, spaced the same, with a "+" where the checkbox goes. */}
      <View style={{ gap: space.lg, marginHorizontal: LIST_SIDE - SHEET_SIDE }}>
        {templatesIn(category).map((t) => (
          <WorkoutRow
            key={t.id}
            title={t.name}
            subtitle={added[t.id] ? `Added to ${date ? formatDayHeader(date) : "Unscheduled"}` : summary(t)}
            icon={info.icon}
            onOpen={() => openTemplate(t.id)}
            accessory={<SquareButton symbol="+" size={30} label={`Add ${t.name}`} onPress={() => add(t)} />}
          />
        ))}
      </View>

      <Button
        label={`+ New ${info.label}`}
        style={{ alignSelf: "center", marginTop: space.sm, paddingHorizontal: space.sm }}
        onPress={() => openTemplate(createTemplate(category))}
      />
    </ScrollView>
  );
}
