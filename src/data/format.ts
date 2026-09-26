import { restsBetweenReps } from "./categories";
import { isStopwatch, stopwatchSet } from "./stopwatch";
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

/** A stopwatch's clock, counting up: "12:34", then "1:02:03" past an hour. */
export function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const mm = String(Math.floor((total % 3600) / 60)).padStart(h ? 2 : 1, "0");
  const ss = String(total % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** How long a session lasted: "45 min", "1 h 25 min", "2 h"; "<1 min" for under a minute. */
export function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "<1 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
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

/** A timed set of `reps` reps: each `on` long, with an `off` break between reps (as the timer runs it). */
const timedSet = (reps: number, on: number, off: number) => reps * on + Math.max(0, reps - 1) * off;

/**
 * Roughly how long a workout takes, in seconds: the rests between sets, plus the sets
 * themselves (their full time when timed, a flat 20s each when counted in reps or problems).
 */
export function estimatedSeconds(p: Prescription) {
  const rests = Math.max(0, p.sets - 1) * (p.restSeconds ?? 0);
  const off = p.offSeconds ?? 0;
  switch (p.measure) {
    case "time": {
      const reps = perSet(p, "reps");
      return rests + sum(perSet(p, "seconds").map((on, i) => timedSet(reps[i], on, off)));
    }
    case "intervals":
      return rests + sum(perSet(p, "reps").map((hangs) => timedSet(hangs, p.seconds ?? 0, off)));
    case "reps":
    case "climbs":
      return rests + p.sets * SECONDS_PER_UNTIMED_SET;
    case "stopwatch":
      return 0;
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
 * One-line summary, e.g. "4 × 6 reps · +25 lb · 2 min rest · ~8 min total",
 * "2 × 30s · 30s rest · ~2 min total" or "3 sets · 6 × 7s on / 3s off · 20 mm · ~8 min total".
 */
export function formatPrescription(p: Prescription) {
  if (p.measure === "stopwatch") return "Open-ended · counts up until you finish";
  const side = p.perSide ? " / side" : "";
  const parts: string[] = [];

  switch (p.measure) {
    case "reps":
      parts.push(`${p.sets} × ${joined(perSet(p, "reps"))} reps${side}`);
      break;
    case "time": {
      const holds = joined(perSet(p, "seconds"), formatSeconds);
      if (restsBetweenReps(p)) {
        const off = formatSeconds(p.offSeconds ?? 0);
        parts.push(`${p.sets} sets`, `${joined(perSet(p, "reps"))} × ${holds} on / ${off} off${side}`);
      } else {
        parts.push(`${p.sets} × ${holds}${side}`);
      }
      break;
    }
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
 * "4 × 6 reps · ~8 min total", "2 × 30s · ~2 min total", "3 × 6 × 7s · ~5 min total",
 * "3 × 6 hangs · ~9 min total".
 */
export function formatSummary(p: Prescription) {
  if (p.measure === "stopwatch") return "Open-ended";
  const side = p.perSide ? " / side" : "";
  let each: string;
  if (p.measure === "time") {
    const holds = joined(perSet(p, "seconds"), formatSeconds);
    each = restsBetweenReps(p) ? `${joined(perSet(p, "reps"))} × ${holds}` : holds;
  } else {
    each = `${joined(perSet(p, "reps"))} ${COUNTED_IN[p.measure]}`;
  }
  const total = formatTotal(p);
  return [`${p.sets} × ${each}${side}`, ...(total ? [total] : [])].join(" · ");
}

/**
 * "3/5 sets", or nothing for a workout with no sets. A stopwatch session shows
 * its time once it has some ("1 h 25 min"), or "In progress" while running.
 */
export function sessionProgress(s: Session) {
  if (isStopwatch(s)) {
    if (s.runningSince) return "In progress";
    const seconds = stopwatchSet(s)?.actual.seconds;
    return seconds ? formatDuration(seconds) : undefined;
  }
  const sets = s.exercises.flatMap((e) => e.sets);
  if (sets.length === 0) return undefined;
  return `${sets.filter((set) => set.done).length}/${sets.length} sets`;
}
