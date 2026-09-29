import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Keyboard, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Box, Button, Icon, LIST_SIDE, Pills, TextField, WorkoutRow } from "@/components/ui";
import { SquareButton } from "@/components/workout/sheet-parts";
import { borders, colors, space } from "@/constants/theme";
import { CATEGORIES, categoryInfo } from "@/data/categories";
import { formatSummary } from "@/data/format";
import { searchTemplates } from "@/data/search";
import { templateExercise } from "@/data/templates";
import type { Category, WorkoutTemplate } from "@/data/types";
import { formatDayHeader } from "@/lib/dates";
import { useLog } from "@/store/log";

const TYPES = CATEGORIES.map((c) => ({ value: c.id, label: c.label }));

/** Sets, reps and length, so the whole thing fits on the row's one subtitle line. */
function summary(t: WorkoutTemplate) {
  const exercise = templateExercise(t);
  return exercise ? formatSummary(exercise) : "";
}

/** Space between rows, as on the home screen. */
function RowGap() {
  return <View style={{ height: space.lg }} />;
}

/** Done and + New: their width, and their gap below the safe area. */
const HEADER_BUTTON = { width: 100 };
const HEADER_TOP = space.xs;

/**
 * The types a new workout can go in, dropping from a held-down "+ New" over the faded screen.
 * `top` is where the header's own "+ New" sits, so this one covers it exactly.
 */
function NewMenu({ top, onPick, onClose }: { top: number; onPick: (category: Category) => void; onClose: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill}>
      {/* Tapping anywhere else closes it. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.paper, opacity: 0.8 }]}
      />
      <View style={{ position: "absolute", top, right: LIST_SIDE, alignItems: "flex-end", gap: space.xs }}>
        <Button label="+ New" style={[HEADER_BUTTON, { backgroundColor: colors.fill }]} onPress={onClose} />
        <Box>
          {CATEGORIES.map((c, i) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`New ${c.label} workout`}
              onPress={() => onPick(c.id)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: space.sm,
                paddingVertical: 10,
                paddingLeft: space.sm,
                paddingRight: space.lg,
                borderTopWidth: i ? borders.thin : 0,
                borderColor: colors.ink,
                backgroundColor: pressed ? colors.fill : colors.paper,
              })}
            >
              <Icon name={c.icon} size={32} />
              <AppText variant="label">{c.label}</AppText>
            </Pressable>
          ))}
        </Box>
      </View>
    </Animated.View>
  );
}

/**
 * Every workout, narrowed by the search and the type pill together. "+" adds one to the day;
 * tapping one opens it to edit.
 */
export default function AddWorkout() {
  // "unscheduled" when opened from the weekly view: workouts go to Unscheduled, to be placed on days afterwards.
  const { target } = useLocalSearchParams<{ target?: string }>();
  const { templates, schedule, createTemplate, selectedDate } = useLog();
  const date = target === "unscheduled" ? null : selectedDate;
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<Category>();
  const [added, setAdded] = useState<Record<string, number>>({});
  const [choosingType, setChoosingType] = useState(false);

  const results = searchTemplates(templates, query, type);
  const searched = query.trim();
  const typeLabel = type && categoryInfo(type).label;

  function open(id: string) {
    Keyboard.dismiss();
    router.push({ pathname: "/template/[id]", params: { id } });
  }

  function add(t: WorkoutTemplate) {
    schedule(t.id, date);
    setAdded((prev) => ({ ...prev, [t.id]: (prev[t.id] ?? 0) + 1 }));
  }

  // A new workout goes in the selected type, named after the search if there is one.
  // With no type selected, the menu asks which.
  function createNew() {
    if (type) return open(createTemplate(type, searched));
    Keyboard.dismiss();
    setChoosingType(true);
  }

  function createIn(category: Category) {
    setChoosingType(false);
    open(createTemplate(category, searched));
  }

  return (
    // Insets from the root: a SafeAreaView inside a full-screen modal doesn't clear the status bar.
    <View style={{ flex: 1, backgroundColor: colors.paper, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: LIST_SIDE, paddingTop: HEADER_TOP, paddingBottom: space.md, gap: space.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Button label="Done" style={HEADER_BUTTON} onPress={() => router.back()} />
          <Button label="+ New" style={HEADER_BUTTON} onPress={createNew} />
        </View>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search workouts"
          accessibilityLabel="Search workouts"
          // Title case, since a search that finds nothing can become the new workout's name.
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="always"
          style={{ paddingVertical: 10 }}
        />
        {/* Tapping the selected type again goes back to every type. */}
        <Pills boxed options={TYPES} selected={type} onSelect={(t) => setType((current) => (current === t ? undefined : t))} />
      </View>

      <FlatList
        data={results}
        extraData={added}
        keyExtractor={(t) => t.id}
        renderItem={({ item: t }) => (
          <WorkoutRow
            title={t.name}
            subtitle={added[t.id] ? `Added to ${date ? formatDayHeader(date) : "Unscheduled"}` : summary(t)}
            icon={categoryInfo(t.category).icon}
            onOpen={() => open(t.id)}
            accessory={<SquareButton label={`Add ${t.name}`} onPress={() => add(t)} />}
          />
        )}
        ItemSeparatorComponent={RowGap}
        ListEmptyComponent={
          <View style={{ alignItems: "center", gap: space.md, paddingTop: space.xl }}>
            <AppText variant="label" color={colors.placeholder} align="center">
              {searched ? "No workouts match" : typeLabel ? `Nothing in ${typeLabel} yet` : "No workouts yet"}
            </AppText>
            <Button
              label={searched ? `+ New "${searched}"` : typeLabel ? `+ New ${typeLabel}` : "+ New"}
              style={{ paddingHorizontal: space.sm }}
              onPress={createNew}
            />
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: LIST_SIDE, paddingBottom: insets.bottom + space.xl }}
        // Rows stay tappable with the keyboard up; scrolling puts it away.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      />

      {choosingType && (
        <NewMenu top={insets.top + HEADER_TOP} onPick={createIn} onClose={() => setChoosingType(false)} />
      )}
    </View>
  );
}
