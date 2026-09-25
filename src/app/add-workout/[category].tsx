import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { AppText, Button, Icon } from "@/components/ui";
import { SheetBack, SheetRow, SquareButton } from "@/components/workout/sheet-parts";
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
      contentContainerStyle={{ paddingHorizontal: 39, paddingTop: 40, paddingBottom: space.xl, gap: space.md }}
    >
      <SheetBack />
      <AppText variant="header" align="center">
        {info.label}
      </AppText>

      {templatesIn(category).map((t) => (
        <SheetRow key={t.id}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${t.name}`}
            onPress={() => openTemplate(t.id)}
            style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, opacity: pressed ? 0.5 : 1 })}
          >
            <Icon name={info.icon} size={48} />
            <View style={{ flex: 1 }}>
              <AppText variant="row" numberOfLines={2}>
                {t.name}
              </AppText>
              <AppText variant="note" color={colors.placeholder} numberOfLines={2}>
                {added[t.id] ? `Added to ${date ? formatDayHeader(date) : "Unscheduled"}` : summary(t)}
              </AppText>
            </View>
          </Pressable>
          <SquareButton symbol="+" label={`Add ${t.name}`} onPress={() => add(t)} />
        </SheetRow>
      ))}

      <Button
        label={`+ New ${info.label}`}
        style={{ alignSelf: "center", marginTop: space.sm, paddingHorizontal: space.sm }}
        onPress={() => openTemplate(createTemplate(category))}
      />
    </ScrollView>
  );
}
