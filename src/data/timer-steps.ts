import { formatWeight } from "./format";
import type { FieldSpec } from "./measures";
import type { Session, SetLog, SetValues } from "./types";

/**
 * One thing the workout timer walks through: a set, one rep of a set (a repeater hang), or a rest.
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
  /** Sets of several timed reps (repeaters): which rep of the set, and whether it's the on or off part. */
  rep?: { name: "Hang" | "Rep"; index: number; of: number; phase: "on" | "off" };
};

/** A line in the timer's Set / Rest list: consecutive steps of the same set and kind. */
type StepRow = {
  key: string;
  kind: "work" | "rest";
  setId: string;
  setNumber: number;
  stepKeys: string[];
};

export function buildSteps(session: Session): TimerStep[] {
  const p = session.prescription;
  const steps: TimerStep[] = [];

  session.sets.forEach((set, i) => {
    const base = { kind: "work" as const, setId: set.id, setNumber: i + 1 };

    switch (p.measure) {
      case "reps":
      case "climbs":
        steps.push({ ...base, key: `work:${set.id}` });
        break;
      case "time": {
        // Follows the set as it's edited, so its time and reps can be changed before starting it.
        const of = Math.max(1, set.reps ?? 1);
        if (of === 1) steps.push({ ...base, key: `work:${set.id}`, seconds: set.seconds ?? 0 });
        else steps.push(...repSteps(base, "Rep", of, set.seconds ?? 0, p.offSeconds));
        break;
      }
      case "intervals":
        // Timing follows the plan; the logged hang count is edited separately. A set added on
        // the day has no plan, so it times the hangs it was given.
        steps.push(...repSteps(base, "Hang", Math.max(1, p.sets[i]?.reps ?? set.reps ?? 1), p.onSeconds ?? 0, p.offSeconds));
        break;
      case "stopwatch":
        // Counts up on its own screen instead (see StopwatchTimer).
        break;
      default:
        p.measure satisfies never;
    }

    if (i < session.sets.length - 1 && p.restSeconds) {
      steps.push({ kind: "rest", key: `rest:${set.id}`, setId: set.id, setNumber: i + 1, seconds: p.restSeconds });
    }
  });

  return steps;
}

/** A set of `of` reps, each `on` seconds long, with `off` seconds between them (repeaters: 6 × 7s on / 3s off). */
function repSteps(
  base: { kind: "work"; setId: string; setNumber: number },
  name: "Hang" | "Rep",
  of: number,
  on: number,
  off: number | undefined,
): TimerStep[] {
  const steps: TimerStep[] = [];
  for (let i = 1; i <= of; i++) {
    steps.push({ ...base, key: `work:${base.setId}:on:${i}`, seconds: on, rep: { name, index: i, of, phase: "on" } });
    if (i < of && off) {
      steps.push({ ...base, key: `work:${base.setId}:off:${i}`, seconds: off, rep: { name, index: i, of, phase: "off" } });
    }
  }
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

/**
 * Line under the clock: "Set 2 · 6 reps · +25 lb", "Set 1 · +25 lb · Hold", "Set 1 · Hang 3/6 · On",
 * "Rest · Set 3 next". Shows the set's plan where it has one (`planned`), otherwise what's logged.
 */
export function stepCaption(step: TimerStep, set: SetLog, planned: SetValues, fields: FieldSpec[]) {
  if (step.kind === "rest") return `Rest · Set ${step.setNumber + 1} next`;
  const parts = [`Set ${step.setNumber}`];
  if (step.rep) {
    parts.push(`${step.rep.name} ${step.rep.index}/${step.rep.of}`, step.rep.phase === "on" ? "On" : "Off");
  } else {
    for (const { key, unit } of fields) {
      const v = planned[key] ?? set[key];
      // A timed set here is a single hold, so its one rep goes unsaid.
      if (!v || (key === "reps" && step.seconds !== undefined)) continue;
      parts.push(key === "weightLb" ? formatWeight(v) : key === "seconds" ? "Hold" : `${v} ${unit}`);
    }
  }
  return parts.join(" · ");
}

/** Line under the clock while counting down to the first step: "Get ready · Set 1 next". */
export function prepCaption(step: TimerStep) {
  return `Get ready · Set ${step.setNumber} next`;
}
