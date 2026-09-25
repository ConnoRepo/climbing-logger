import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import { AppText, Icon } from "@/components/ui";
import { SHEET_SIDE, SheetRow, SquareButton } from "@/components/workout/sheet-parts";
import { colors, space } from "@/constants/theme";
import { CATEGORIES } from "@/data/categories";

const ICON = 48;

export default function AddWorkoutCategories() {
  // "unscheduled" when opened from the weekly view; passed on to the workout list.
  const { target } = useLocalSearchParams<{ target?: string }>();
  const open = (category: string) =>
    router.push({ pathname: "/add-workout/[category]", params: { category, ...(target ? { target } : {}) } });

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ paddingHorizontal: SHEET_SIDE, paddingTop: 56, paddingBottom: space.xl, gap: space.md }}
    >
      {CATEGORIES.map((c) => (
        <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Open ${c.label}`} onPress={() => open(c.id)}>
          <SheetRow>
            <Icon name={c.icon} size={ICON} />
            <AppText variant="heading" align="center" style={{ flex: 1 }}>
              {c.label}
            </AppText>
            {/* As wide as the icon, so the label is centred in the whole row. */}
            <View style={{ width: ICON, alignItems: "flex-end" }}>
              <SquareButton symbol="›" />
            </View>
          </SheetRow>
        </Pressable>
      ))}
    </ScrollView>
  );
}
