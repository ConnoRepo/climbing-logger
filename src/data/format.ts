import type { Prescription, Session, SetValues } from "./types";

export function formatSeconds(total: number) {
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return s ? `${m}:${String(s).padStart(2, "0")}` : `${m} min`;
}

/** Countdown display: "1:05", rounding partial seconds up so 0:00 means done. */
export function formatClock(ms: number) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const signed = (lb: number) => `${lb > 0 ? "+" : ""}${lb}`;

export function formatWeight(lb: number) {
  return `${signed(lb)} lb`;
}

/** A field's planned value for each set. */
function perSet(p: Prescription, key: keyof SetValues) {
  return Array.from({ length: p.sets }, (_, i) => p.setValues?.[i]?.[key] ?? p[key] ?? 0);
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Rough time per set for workouts counted in reps or problems rather than timed. */
const SECONDS_PER_UNTIMED_SET = 20;

/**
 * Roughly how long a workout takes, in seconds: the rests between sets, plus the sets
 * themselves (their full time when timed, a flat 20s each when counted in reps or problems).
 */
export function estimatedSeconds(p: Prescription) {
  const rests = Math.max(0, p.sets - 1) * (p.restSeconds ?? 0);
  switch (p.measure) {
    case "time":
      return rests + sum(perSet(p, "seconds"));
    case "intervals": {
      // Each set is its hangs, with an off break between hangs (as the timer runs it).
      const on = p.seconds ?? 0;
      const off = p.offSeconds ?? 0;
      return rests + sum(perSet(p, "reps").map((hangs) => hangs * on + Math.max(0, hangs - 1) * off));
    }
    case "reps":
    case "climbs":
      return rests + p.sets * SECONDS_PER_UNTIMED_SET;
  }
}

/** "8", or "8/6/4" when the sets differ. */
function joined(values: number[], show: (v: number) => string = String) {
  return values.every((v) => v === values[0]) ? show(values[0] ?? 0) : values.map(show).join("/");
}

/** "~8 min total", or nothing when there's nothing to time. */
function formatTotal(p: Prescription) {
  const total = estimatedSeconds(p);
  return total > 0 ? `~${Math.ceil(total / 60)} min total` : undefined;
}

/**
 * One-line summary, e.g. "4 × 6 reps · +25 lb · 2 min rest · ~8 min total" or
 * "3 sets · 6 × 7s on / 3s off · 20 mm · ~8 min total".
 */
export function formatPrescription(p: Prescription) {
  const side = p.perSide ? " / side" : "";
  const parts: string[] = [];

  switch (p.measure) {
    case "reps":
      parts.push(`${p.sets} × ${joined(perSet(p, "reps"))} reps${side}`);
      break;
    case "time":
      parts.push(`${p.sets} × ${joined(perSet(p, "seconds"), formatSeconds)}${side}`);
      break;
    case "intervals":
      parts.push(`${p.sets} sets`, `${joined(perSet(p, "reps"))} × ${p.seconds ?? 0}s on / ${p.offSeconds ?? 0}s off`);
      if (p.edgeMm) parts.push(`${p.edgeMm} mm`);
      break;
    case "climbs":
      parts.push(`${p.sets} × ${joined(perSet(p, "reps"))} problems`);
      if (p.grade) parts.push(p.grade);
      break;
  }
  const weights = perSet(p, "weightLb");
  if (weights.some((w) => w !== 0)) parts.push(`${joined(weights, signed)} lb`);
  if (p.restSeconds) parts.push(`${formatSeconds(p.restSeconds)} rest`);
  const total = formatTotal(p);
  if (total) parts.push(total);
  return parts.join(" · ");
}

const COUNTED_IN = { reps: "reps", climbs: "problems", intervals: "hangs" } as const;

/**
 * Just the sets, reps and length, short enough for one subtitle line:
 * "4 × 6 reps · ~8 min total", "2 × 30s · ~2 min total", "3 × 6 hangs · ~9 min total".
 */
export function formatSummary(p: Prescription) {
  const side = p.perSide ? " / side" : "";
  const each =
    p.measure === "time"
      ? joined(perSet(p, "seconds"), formatSeconds)
      : `${joined(perSet(p, "reps"))} ${COUNTED_IN[p.measure]}`;
  const total = formatTotal(p);
  return [`${p.sets} × ${each}${side}`, ...(total ? [total] : [])].join(" · ");
}

/** "3/5 sets", or nothing for a workout with no sets. */
export function sessionProgress(s: Session) {
  const sets = s.exercises.flatMap((e) => e.sets);
  if (sets.length === 0) return undefined;
  return `${sets.filter((set) => set.done).length}/${sets.length} sets`;
}
