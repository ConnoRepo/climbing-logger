import { router } from "expo-router";
import { ScrollView } from "react-native";

import { AppText, Box, Button, NotebookInput } from "@/components/ui";
import { colors, space } from "@/constants/theme";
import { formatShortDate } from "@/lib/dates";
import { useLog } from "@/store/log";

export default function Journal() {
  const { selectedDate, journalFor, setJournal } = useLog();

  return (
    <ScrollView
      style={{ backgroundColor: colors.paper }}
      contentContainerStyle={{ paddingHorizontal: 37, paddingTop: space.xl, paddingBottom: space.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="title" align="center">
        Journal
      </AppText>
      <AppText variant="label" align="center" style={{ marginBottom: 16 }}>
        {formatShortDate(selectedDate)}
      </AppText>
      <NotebookInput value={journalFor(selectedDate)} onChangeText={(text) => setJournal(selectedDate, text)} />
      <Box
        border="thin"
        fill="fillLight"
        style={{ marginTop: 43, marginHorizontal: 7, minHeight: 97, padding: space.sm, justifyContent: "center" }}
      >
        <AppText variant="note" align="center">
          Write a brief journal entry describing your climbing today.
        </AppText>
      </Box>
      <Button label="Done" style={{ alignSelf: "center", width: 100, marginTop: space.lg }} onPress={() => router.back()} />
    </ScrollView>
  );
}
