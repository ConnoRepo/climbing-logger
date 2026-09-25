import { createAudioPlayer } from "expo-audio";
import { useEffect } from "react";
import { AppState } from "react-native";

const SILENCE = require("@/assets/sounds/silence.wav");

/**
 * Keeps the app running while the phone is locked by looping a silent track:
 * iOS doesn't suspend an app that's playing audio, so JS timers keep firing and
 * beeps keep sounding. Needs expo-audio's background playback (app.json) and
 * `shouldPlayInBackground` (set in useBeep).
 */
export function useBackgroundKeepAlive(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const player = createAudioPlayer(SILENCE);
    player.loop = true;
    player.play();
    // A call or Siri stops our audio without restarting it; pick it back up on
    // return so the next lock doesn't suspend the app.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") player.play();
    });
    return () => {
      sub.remove();
      player.remove();
    };
  }, [active]);
}
