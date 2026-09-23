import type { Prescription } from "./types";

export function formatSeconds(total: number) {
  if (total < 60) return `${total}s`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return s ? `${m}:${String(s).padStart(2, "0")}` : `${m} min`;
}

export function formatWeight(kg: number) {
  return `${kg > 0 ? "+" : ""}${kg} kg`;
}

/** One-line summary, e.g. "4 × 6 reps · +10 kg" or "3 sets · 6 × 7s on / 3s off · 20 mm". */
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
  if (p.weightKg) parts.push(formatWeight(p.weightKg));
  if (p.restSeconds) parts.push(`${formatSeconds(p.restSeconds)} rest`);
  return parts.join(" · ");
}

/** Short list for a whole template, e.g. "Pull Ups, Dips +1". */
export function formatExerciseNames(exercises: { name: string }[]) {
  if (exercises.length === 0) return "No exercises yet";
  const [first, second, ...rest] = exercises.map((e) => e.name);
  return [first, second].filter(Boolean).join(", ") + (rest.length ? ` +${rest.length}` : "");
}
