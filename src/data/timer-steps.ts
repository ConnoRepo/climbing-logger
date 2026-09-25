import type { FieldSpec } from "./categories";
import { formatWeight } from "./format";
import type { SessionExercise, SetLog, SetValues } from "./types";

/**
 * One thing the workout timer walks through: a set, a repeater hang, or a rest.
 * `key` stays the same while sets are edited, added or removed, so the timer
 * can keep its place.
 */
export type TimerStep = {
  key: string;
  kind: "work" | "rest";
  /** work: this set · rest: the set just finished */
  setId: string;
  setNumber: number;
  /** Countdown length; undefined for untimed sets, which wait for Next. */
  seconds?: number;
  /** Repeaters: which hang of the set, and whether it's the on or off part. */
  hang?: { index: number; of: number; phase: "on" | "off" };
};

/** A line in the timer's Set / Rest list: consecutive steps of the same set and kind. */
export type StepRow = {
  key: string;
  kind: "work" | "rest";
  setId: string;
  setNumber: number;
  stepKeys: string[];
};

export function buildSteps(exercise: SessionExercise): TimerStep[] {
  const p = exercise.prescription;
  const steps: TimerStep[] = [];

  exercise.sets.forEach((set, i) => {
    const base = { kind: "work" as const, setId: set.id, setNumber: i + 1 };

    switch (p.measure) {
      case "reps":
      case "climbs":
        steps.push({ ...base, key: `work:${set.id}` });
        break;
      case "time":
        steps.push({ ...base, key: `work:${set.id}`, seconds: set.actual.seconds ?? p.seconds ?? 0 });
        break;
      case "intervals": {
        // Timing follows the plan; the logged hang count is edited separately.
        const of = Math.max(1, set.planned.reps ?? p.reps ?? 1);
        for (let h = 1; h <= of; h++) {
          steps.push({ ...base, key: `work:${set.id}:on:${h}`, seconds: p.seconds ?? 0, hang: { index: h, of, phase: "on" } });
          if (h < of && p.offSeconds) {
            steps.push({ ...base, key: `work:${set.id}:off:${h}`, seconds: p.offSeconds, hang: { index: h, of, phase: "off" } });
          }
        }
        break;
      }
    }

    if (i < exercise.sets.length - 1 && p.restSeconds) {
      steps.push({ kind: "rest", key: `rest:${set.id}`, setId: set.id, setNumber: i + 1, seconds: p.restSeconds });
    }
  });

  return steps;
}

export function stepRows(steps: TimerStep[]): StepRow[] {
  const rows: StepRow[] = [];
  for (const s of steps) {
    const last = rows.at(-1);
    if (last && last.kind === s.kind && last.setId === s.setId) last.stepKeys.push(s.key);
    else rows.push({ key: `${s.kind}:${s.setId}`, kind: s.kind, setId: s.setId, setNumber: s.setNumber, stepKeys: [s.key] });
  }
  return rows;
}

/** Line under the clock: "Set 2 · 6 reps · +25 lb", "Set 1 · Hang 3/6 · On", "Rest · Set 3 next". */
export function stepCaption(step: TimerStep, set: SetLog, fields: FieldSpec[]) {
  if (step.kind === "rest") return `Rest · Set ${step.setNumber + 1} next`;
  const parts = [`Set ${step.setNumber}`];
  if (step.hang) {
    parts.push(`Hang ${step.hang.index}/${step.hang.of}`, step.hang.phase === "on" ? "On" : "Off");
  } else {
    for (const f of fields) {
      const key = f.key as keyof SetValues;
      const v = set.planned[key] ?? set.actual[key];
      if (!v) continue;
      parts.push(key === "weightLb" ? formatWeight(v) : key === "seconds" ? "Hold" : `${v} ${f.unit}`);
    }
  }
  return parts.join(" · ");
}
