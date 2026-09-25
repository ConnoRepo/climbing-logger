import { AppText, Box, Stepper } from "@/components/ui";
import { space } from "@/constants/theme";

/** "Rest between sets (s)" with a stepper, in its own box under a workout's set card. */
export function RestBox({ value, onChange }: { value: number | undefined; onChange: (seconds: number) => void }) {
  return (
    <Box
      style={{
        width: "90%",
        alignSelf: "center",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: space.xs,
        paddingHorizontal: space.sm,
      }}
    >
      <AppText variant="button" numberOfLines={1} style={{ flexShrink: 1 }}>
        Rest between sets (s)
      </AppText>
      <Stepper label="rest between sets in seconds" value={value} step={10} min={0} onChange={onChange} />
    </Box>
  );
}
