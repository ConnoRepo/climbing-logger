import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { useEffect } from "react";

type Tone = "high" | "low";

const SOUNDS: Record<Tone, number> = {
  high: require("@/assets/sounds/beep.wav"),
  // An octave lower and longer: the one after 3, 2, 1, as a step starts or ends.
  low: require("@/assets/sounds/beep-low.wav"),
};

// Kept for the app's lifetime rather than the screen's: the low beep as the last set ends
// fires just as the timer screen closes, and a player released with the screen would cut
// it off (or throw, if the release lands while the beep is still seeking).
const players: Partial<Record<Tone, AudioPlayer>> = {};

/**
 * A short beep to play on cue. It sounds with the ringer on silent (it's a timer),
 * plays over music rather than pausing it, and keeps sounding with the phone
 * locked (see useBackgroundKeepAlive).
 */
export function useBeep(tone: Tone = "high") {
  useEffect(() => {
    // Loaded up front, so the first beep isn't late.
    players[tone] ??= createAudioPlayer(SOUNDS[tone]);
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "mixWithOthers" });
  }, [tone]);

  // The seek is async: playing before it lands starts at the end of the last beep, which
  // stops at once (then the seek lands paused), so every other beep went silent.
  return () => {
    const player = (players[tone] ??= createAudioPlayer(SOUNDS[tone]));
    player.seekTo(0).then(() => player.play());
  };
}
