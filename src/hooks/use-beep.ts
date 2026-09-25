import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useEffect } from "react";

const BEEP = require("@/assets/sounds/beep.wav");

/**
 * A short beep to play on cue. It sounds with the ringer on silent (it's a timer),
 * plays over music rather than pausing it, and keeps sounding with the phone
 * locked (see useBackgroundKeepAlive).
 */
export function useBeep() {
  const player = useAudioPlayer(BEEP);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "mixWithOthers" });
  }, []);

  return () => {
    player.seekTo(0);
    player.play();
  };
}
