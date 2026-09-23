import { router } from "expo-router";
import { Pressable, ScrollView } from "react-native";

import { AppText, Button, Icon } from "@/components/ui";
import { SheetRow, SquareButton } from "@/components/workout/sheet-parts";
import { colors, space } from "@/constants/theme";
import { CATEGORIES } from "@/data/categories";

export default function AddWorkoutCategories() {
  const open = (category: string) => router.push({ pathname: "/add-workout/[category]", params: { category } });

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ paddingHorizontal: 39, paddingTop: 56, paddingBottom: space.xl, gap: space.md }}
    >
      <AppText variant="header" align="center">
        + Workout
      </AppText>
      {CATEGORIES.map((c) => (
        <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Open ${c.label}`} onPress={() => open(c.id)}>
          <SheetRow>
            <Icon name={c.icon} size={48} />
            <AppText variant="heading" style={{ flex: 1 }}>
              {c.label}
            </AppText>
            <SquareButton symbol="›" />
          </SheetRow>
        </Pressable>
      ))}
      <Button label="Done" style={{ alignSelf: "center", width: 100, marginTop: space.sm }} onPress={() => router.dismiss()} />
    </ScrollView>
  );
}
