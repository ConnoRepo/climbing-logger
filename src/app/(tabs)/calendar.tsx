import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText, Box } from "@/components/ui";
import { colors, space } from "@/constants/theme";

const BLOCKS = ["Block 1", "Block 2", "Block 3"];

export default function Calendar() {
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingHorizontal: space.md, paddingTop: 13, gap: space.xl }}>
        <AppText variant="header" align="center">
          12-Week Calendar
        </AppText>
        {BLOCKS.map((block) => (
          <Box key={block} style={{ width: 305, height: 164 }}>
            <AppText variant="label" align="center" style={{ marginTop: 4 }}>
              {block}
            </AppText>
          </Box>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
