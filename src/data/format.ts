import type { Prescription, Session } from "./types";

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

export function formatWeight(lb: number) {
  return `${lb > 0 ? "+" : ""}${lb} lb`;
}

/** One-line summary, e.g. "4 × 6 reps · +25 lb" or "3 sets · 6 × 7s on / 3s off · 20 mm". */
export function formatPrescription(p: Prescription) {
  const side = p.perSide ? " / side" : "";
  const parts: string[] = [];

  switch (p.measure) {
    case "reps":
      parts.push(`${p.sets} × ${p.reps ?? 0} reps${side}`);
      break;
    case "time":
      parts.push(`${p.sets} × ${formatSeconds(p.seconds ?? 0)}${side}`);
      break;
    case "intervals":
      parts.push(`${p.sets} sets`, `${p.reps ?? 0} × ${p.seconds ?? 0}s on / ${p.offSeconds ?? 0}s off`);
      if (p.edgeMm) parts.push(`${p.edgeMm} mm`);
      break;
    case "climbs":
      parts.push(`${p.sets} × ${p.reps ?? 0} problems`);
      if (p.grade) parts.push(p.grade);
      break;
  }
  if (p.weightLb) parts.push(formatWeight(p.weightLb));
  if (p.restSeconds) parts.push(`${formatSeconds(p.restSeconds)} rest`);
  return parts.join(" · ");
}

/** "3/5 sets", or nothing for a workout with no sets. */
export function sessionProgress(s: Session) {
  const sets = s.exercises.flatMap((e) => e.sets);
  if (sets.length === 0) return undefined;
  return `${sets.filter((set) => set.done).length}/${sets.length} sets`;
}
