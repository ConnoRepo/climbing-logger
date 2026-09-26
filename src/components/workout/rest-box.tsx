import { AppText, Box, Stepper } from "@/components/ui";
import { space } from "@/constants/theme";

type RestBoxProps = {
  /** reps: the short break between the reps of a set (repeaters: 3s). */
  between?: "sets" | "reps";
  value: number | undefined;
  onChange: (seconds: number) => void;
};

/** "Rest between sets (s)" with a stepper, in its own box under a workout's set card. */
export function RestBox({ between = "sets", value, onChange }: RestBoxProps) {
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
        Rest between {between} (s)
      </AppText>
      <Stepper
        label={`rest between ${between} in seconds`}
        value={value}
        step={between === "sets" ? 10 : 1}
        min={0}
        onChange={onChange}
      />
    </Box>
  );
}
