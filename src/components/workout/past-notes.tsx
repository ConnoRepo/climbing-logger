import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText, Box } from "@/components/ui";
import { borders, colors, space } from "@/constants/theme";
import type { NotesEntry } from "@/data/progress";
import { formatShortDate, type DateKey } from "@/lib/dates";

type PastNotesProps = {
  entries: NotesEntry[];
  /** The day picked here or on the graph: its notes are highlighted and scrolled to. */
  selected: DateKey | null;
  onSelect: (date: DateKey | null) => void;
};

/**
 * Notes from past sessions of a workout, newest first, to read before starting it again.
 * Tapping one picks its day (and so its point on the graph). Takes the height the pages
 * beside it set and scrolls within it.
 */
export function PastNotes({ entries, selected, onSelect }: PastNotesProps) {
  const scrollRef = useRef<ScrollView>(null);
  const entryY = useRef<Record<string, number>>({});
  // For the furthest the list can scroll: its content's height less its own.
  const heights = useRef({ content: 0, view: 0 });
  const first = selected ? entries.find((e) => e.date === selected) : undefined;

  // Bring the picked day's first note to the top (or as near as the list goes), e.g. when
  // its point was tapped on the graph.
  useEffect(() => {
    const y = first && entryY.current[first.id];
    if (y === undefined) return;
    const { content, view } = heights.current;
    scrollRef.current?.scrollTo({ y: Math.max(0, Math.min(y, content - view)), animated: true });
  }, [first?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box style={{ flex: 1 }}>
      {entries.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: space.md }}>
          <AppText variant="note" color={colors.placeholder} align="center">
            Notes you write after finishing this workout show up here.
          </AppText>
        </View>
      ) : (
        // Absolutely placed, so the list adds no height of its own to the pager.
        <ScrollView
          ref={scrollRef}
          style={StyleSheet.absoluteFill}
          nestedScrollEnabled
          onLayout={(e) => {
            heights.current.view = e.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_, h) => {
            heights.current.content = h;
          }}
        >
          {entries.map((entry, i) => {
            const { date } = entry;
            const picked = !!date && date === selected;
            return (
              <Pressable
                key={entry.id}
                // Unscheduled notes have no day, so no point on the graph to go with them.
                disabled={!date}
                accessibilityRole="button"
                accessibilityState={{ selected: picked }}
                onPress={() => onSelect(picked ? null : date)}
                onLayout={(e) => {
                  entryY.current[entry.id] = e.nativeEvent.layout.y;
                }}
                // Padding on each note rather than the list, so a highlight spans the box.
                style={{
                  gap: 4,
                  paddingVertical: space.xs,
                  paddingHorizontal: space.sm,
                  backgroundColor: picked ? colors.fillLight : undefined,
                  borderTopWidth: i > 0 ? borders.hairline : 0,
                  borderTopColor: colors.placeholder,
                }}
              >
                <AppText variant="label">{date ? formatShortDate(date) : "Unscheduled"}</AppText>
                <AppText variant="note">{entry.notes}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </Box>
  );
}
