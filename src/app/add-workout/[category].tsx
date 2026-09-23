import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { AppText, Button, Icon } from "@/components/ui";
import { SheetBack, SheetRow, SquareButton } from "@/components/workout/sheet-parts";
import { colors, space } from "@/constants/theme";
import { categoryInfo, isCategory } from "@/data/categories";
import { formatExerciseNames, formatPrescription } from "@/data/format";
import type { WorkoutTemplate } from "@/data/types";
import { formatDayHeader } from "@/lib/dates";
import { useLog } from "@/store/log";

function summary(t: WorkoutTemplate) {
  return t.exercises.length === 1 ? formatPrescription(t.exercises[0]) : formatExerciseNames(t.exercises);
}

export default function CategoryTemplates() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { templatesIn, schedule, createTemplate, selectedDate } = useLog();
  const [added, setAdded] = useState<Record<string, number>>({});

  if (!isCategory(category)) return null;
  const info = categoryInfo(category);

  const openTemplate = (id: string) => router.push({ pathname: "/template/[id]", params: { id } });

  function add(t: WorkoutTemplate) {
    schedule(t.id, selectedDate);
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
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Icon name={info.icon} size={48} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="row" numberOfLines={2}>
              {t.name}
            </AppText>
            <AppText variant="note" color={colors.placeholder} numberOfLines={2}>
              {added[t.id] ? `Added to ${formatDayHeader(selectedDate)}` : summary(t)}
            </AppText>
          </View>
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
