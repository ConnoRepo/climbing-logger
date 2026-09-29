import { useState } from "react";
import { View } from "react-native";

import { space } from "@/constants/theme";
import { MEASURES } from "@/data/categories";
import type { Measure } from "@/data/types";
import type { DateKey } from "@/lib/dates";
import { useLog } from "@/store/log";

import { HistoryGraph, SCALES } from "./history-graph";
import { PastNotes } from "./past-notes";

/**
 * Never shorter than this, so a short first page (a stopwatch's time card) doesn't
 * squeeze the graph and notes; a workout's sets page is taller anyway.
 */
const MIN_HEIGHT = 360;

/** How the page's height is shared: the graph gets two parts to the notes' one. */
const GRAPH_SHARE = 2;
const NOTES_SHARE = 1;

/**
 * A workout's second page, the same for every kind: its graph over time, then the notes
 * from its past sessions. They share one picked day: tapping a point highlights and
 * scrolls to that day's notes, and tapping a note picks its point, showing its value.
 * Neither part adds height of its own, so the page is as tall as the first one.
 */
export function HistoryWithNotes({ templateId, measure }: { templateId: string; measure: Measure }) {
  const log = useLog();
  const [selected, setSelected] = useState<DateKey | null>(null);
  const kind = MEASURES[measure].history;

  return (
    <View style={{ flex: 1, minHeight: MIN_HEIGHT, gap: space.sm }}>
      {/* Full page width: the axis marks sit in the room the pages reach into. */}
      <View style={{ flex: GRAPH_SHARE }}>
        <HistoryGraph
          points={log.history(templateId, kind)}
          scale={SCALES[kind]}
          selected={selected}
          onSelect={setSelected}
        />
      </View>
      <View style={{ flex: NOTES_SHARE, paddingHorizontal: space.md }}>
        <PastNotes entries={log.notesHistory(templateId)} selected={selected} onSelect={setSelected} />
      </View>
    </View>
  );
}
