import type { DateKey } from "@/lib/dates";

import { plannedSetValues, plannedSets } from "./categories";
import { newId, now } from "./ids";
import type { Prescription, Session, SessionExercise, SetLog, WorkoutTemplate } from "./types";

export function makeSets(p: Prescription, count = p.sets): SetLog[] {
  const each = plannedSets(p);
  return Array.from({ length: count }, (_, position) => {
    const planned = each[position] ?? plannedSetValues(p);
    return { id: newId(), position, planned, actual: { ...planned }, done: false };
  });
}

export function makeSessionExercise(p: Prescription, position: number): SessionExercise {
  return {
    id: newId(),
    position,
    exerciseId: p.exerciseId,
    name: p.name,
    prescription: { ...p },
    sets: makeSets(p),
  };
}

/**
 * Schedules a template on a day. The session is a full copy: editing the
 * template afterwards never changes it, so completed sessions are history.
 */
export function instantiate(template: WorkoutTemplate, date: DateKey | null, position = 0): Session {
  const ts = now();
  return {
    id: newId(),
    date,
    position,
    templateId: template.id,
    category: template.category,
    name: template.name,
    status: "planned",
    exercises: template.exercises.map((p, i) => makeSessionExercise(p, i)),
    createdAt: ts,
    updatedAt: ts,
  };
}
