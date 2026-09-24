import { useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExpandedBlock, type Rect } from "@/components/calendar/expanded-block";
import { AppText, Box } from "@/components/ui";
import { colors, space } from "@/constants/theme";

const BLOCKS = ["Block 1", "Block 2", "Block 3"];
const WEEKS_PER_BLOCK = 4;

/** Block 2 → "Week 5" … "Week 8". */
const weeksOf = (block: number) =>
  Array.from({ length: WEEKS_PER_BLOCK }, (_, i) => `Week ${block * WEEKS_PER_BLOCK + i + 1}`);

export default function Calendar() {
  const cards = useRef<(View | null)[]>([]);
  const [open, setOpen] = useState<{ block: number; from: Rect } | null>(null);

  // Measure where the card sits on screen so the expanded frame can grow out of it.
  const expand = (block: number) =>
    cards.current[block]?.measureInWindow((x, y, width, height) => setOpen({ block, from: { x, y, width, height } }));

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingHorizontal: space.md, paddingTop: 13, gap: space.xl }}>
        <AppText variant="header" align="center">
          12-Week Calendar
        </AppText>
        {BLOCKS.map((block, i) => (
          <Pressable
            key={block}
            ref={(el) => {
              cards.current[i] = el;
            }}
            accessibilityRole="button"
            accessibilityLabel={`Open ${block}`}
            onPress={() => expand(i)}
          >
            {({ pressed }) => (
              <Box fill={pressed ? "fillFaint" : "paper"} style={{ width: 305, height: 164 }}>
                <AppText variant="label" align="center" style={{ marginTop: 4 }}>
                  {block}
                </AppText>
              </Box>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {open && (
        <ExpandedBlock
          title={BLOCKS[open.block]}
          weeks={weeksOf(open.block)}
          from={open.from}
          onClosed={() => setOpen(null)}
        />
      )}
    </SafeAreaView>
  );
}
