/** `v` limited to the range lo–hi. A worklet, so it also runs on the UI thread. */
export function clamp(v: number, lo: number, hi: number) {
  "worklet";
  return Math.min(Math.max(v, lo), hi);
}
