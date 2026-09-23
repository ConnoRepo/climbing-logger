import { Pressable, Text, View } from "react-native";

import { useCountdown } from "@/hooks/use-countdown";

export default function Timer() {
    const { seconds, isRunning, start, pause, reset } = useCountdown(60)

    return (
        <View>
            <Text>{seconds}</Text>
            <Pressable onPress={isRunning ? pause : start}>
                <Text>{isRunning ? "Pause" : "Start"}</Text>
            </Pressable>
            <Pressable onPress={reset}>
                <Text>Reset</Text>
            </Pressable>
        </View>
    );
}
