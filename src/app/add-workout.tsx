import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";

import { AppText, Box, Button } from "@/components/ui";
import { borders, colors, space, type } from "@/constants/theme";
import { useLog, WORKOUT_CATALOG } from "@/store/log";

export default function AddWorkout() {
  const { selectedDate, addWorkout } = useLog();
  const [custom, setCustom] = useState("");

  function addCustom() {
    const name = custom.trim();
    if (!name) return;
    addWorkout(selectedDate, { name, icon: "link" });
    setCustom("");
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ paddingHorizontal: 39, paddingTop: 72, paddingBottom: space.xl, gap: space.md }}
      keyboardShouldPersistTaps="handled"
    >
      {WORKOUT_CATALOG.map((w) => (
        <AddRow key={w.name} label={w.name} onAdd={() => addWorkout(selectedDate, w)} />
      ))}

      <Box style={{ minHeight: 93, flexDirection: "row", alignItems: "center", paddingLeft: 15, paddingRight: 9, gap: 8 }}>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          onSubmitEditing={addCustom}
          placeholder="Other..."
          placeholderTextColor={colors.placeholder}
          returnKeyType="done"
          style={[type.heading, { flex: 1, minWidth: 0, color: colors.ink, padding: 0 }]}
        />
        <PlusBox label="Add custom workout" onPress={addCustom} />
      </Box>

      <Button label="Done" style={{ alignSelf: "center", width: 100, marginTop: space.sm }} onPress={() => router.back()} />
    </ScrollView>
  );
}

function AddRow({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <Box style={{ minHeight: 93, flexDirection: "row", alignItems: "center", paddingLeft: 15, paddingRight: 9, gap: 8 }}>
      <AppText variant="heading" style={{ flex: 1 }} numberOfLines={2}>
        {label}
      </AppText>
      <PlusBox label={`Add ${label}`} onPress={onAdd} />
    </Box>
  );
}

/** The thin-outlined "+" square from the Add Workout sheet. */
function PlusBox({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 37,
        height: 37,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: borders.hairline,
        borderColor: colors.ink,
        backgroundColor: pressed ? colors.fill : colors.paper,
      })}
    >
      <View style={{ marginTop: -4 }}>
        <AppText variant="title" style={{ lineHeight: 44 }}>
          +
        </AppText>
      </View>
    </Pressable>
  );
}
