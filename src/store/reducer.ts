import { MAX_SETS, MEASURES, carriedForward, categoryInfo, defaultMeasure } from "@/data/categories";
import { newId, now } from "@/data/ids";
import { instantiate, makeSets, sessionsOn } from "@/data/schedule";
import { newExercise, newPrescription, newTemplate } from "@/data/templates";
import type {
  AppData,
  Category,
  Exercise,
  Measure,
  Prescription,
  Session,
  SessionExercise,
  SetValues,
  WorkoutTemplate,
} from "@/data/types";
import type { DateKey } from "@/lib/dates";
import { clamp } from "@/lib/math";

export type Action =
  | { type: "hydrate"; data: AppData }
  // Templates
  | { type: "template/create"; id: string; category: Category }
  | { type: "template/update"; id: string; patch: Partial<Pick<WorkoutTemplate, "name" | "category">> }
  | { type: "template/delete"; id: string }
  | { type: "template/updateExercise"; templateId: string; exerciseId: string; patch: Partial<Prescription> }
  // Sessions
  | { type: "session/schedule"; id: string; templateId: string; date: DateKey | null }
  /** To a day (or Unscheduled with null), at `index` among its other sessions; the end if omitted. */
  | { type: "session/move"; id: string; date: DateKey | null; index?: number }
  | { type: "session/remove"; id: string }
  | { type: "session/setDone"; id: string; done: boolean }
  | { type: "session/setRest"; sessionId: string; exerciseId: string; restSeconds: number }
  | { type: "set/add"; sessionId: string; exerciseId: string }
  | { type: "set/remove"; sessionId: string; exerciseId: string; setId: string }
  | { type: "set/update"; sessionId: string; exerciseId: string; setId: string; actual?: SetValues; done?: boolean }
  // Journal
  | { type: "journal/set"; date: DateKey; text: string };

const reposition = <T extends { position: number }>(list: T[]) => list.map((item, position) => ({ ...item, position }));

function mapTemplate(state: AppData, id: string, fn: (t: WorkoutTemplate) => WorkoutTemplate): AppData {
  return {
    ...state,
    templates: state.templates.map((t) => (t.id === id ? { ...fn(t), updatedAt: now() } : t)),
  };
}

function mapSession(state: AppData, id: string, fn: (s: Session) => Session): AppData {
  return {
    ...state,
    sessions: state.sessions.map((s) => (s.id === id ? { ...fn(s), updatedAt: now() } : s)),
  };
}

function mapSessionExercise(s: Session, id: string, fn: (e: SessionExercise) => SessionExercise): Session {
  return { ...s, exercises: s.exercises.map((e) => (e.id === id ? fn(e) : e)) };
}

/** Finds an exercise by name (case-insensitive) or adds it to the library. */
function ensureExercise(state: AppData, name: string, category: Category, measure: Measure): [AppData, Exercise] {
  const existing = state.exercises.find((e) => e.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) return [state, existing];
  const exercise = newExercise(name.trim(), category, measure);
  return [{ ...state, exercises: [...state.exercises, exercise] }, exercise];
}

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "hydrate":
      return action.data;

    case "template/create": {
      const name = `New ${categoryInfo(action.category).label}`;
      const exercise = newPrescription(defaultMeasure(action.category), { name });
      const template = newTemplate(action.category, name, exercise, action.id);
      return { ...state, templates: [...state.templates, template] };
    }

    case "template/update": {
      const { name } = action.patch;
      return mapTemplate(state, action.id, (t) => ({
        ...t,
        ...action.patch,
        // The workout name is also its exercise's name (linked to the library on commit).
        exercises: name !== undefined ? t.exercises.map((e) => ({ ...e, name })) : t.exercises,
      }));
    }

    case "template/delete":
      return mapTemplate(state, action.id, (t) => ({ ...t, deletedAt: now() }));

    case "template/updateExercise": {
      const template = state.templates.find((t) => t.id === action.templateId);
      if (!template) return state;
      let next = state;
      let patch = action.patch;
      // A committed name links the line to the matching library exercise (or a new one).
      // The editor only sends `name` when typing finishes, so partial names never reach the library.
      if (patch.name !== undefined) {
        const name = patch.name.trim();
        if (name) {
          const current = template.exercises.find((e) => e.id === action.exerciseId);
          const [withExercise, exercise] = ensureExercise(state, name, template.category, current?.measure ?? "reps");
          next = withExercise;
          patch = { ...patch, name, exerciseId: exercise.id };
        } else {
          patch = { ...patch, name, exerciseId: null };
        }
      }
      // Switching measure fills in that measure's sensible defaults (and drops per-set values
      // that were for the old measure's fields).
      if (patch.measure) patch = { ...MEASURES[patch.measure].defaults, setValues: undefined, ...patch };
      return mapTemplate(next, action.templateId, (t) => ({
        ...t,
        exercises: t.exercises.map((e) => (e.id === action.exerciseId ? { ...e, ...patch } : e)),
      }));
    }

    case "session/schedule": {
      const template = state.templates.find((t) => t.id === action.templateId);
      if (!template) return state;
      const position = Math.max(-1, ...sessionsOn(state.sessions, action.date).map((s) => s.position)) + 1;
      return {
        ...state,
        sessions: [...state.sessions, { ...instantiate(template, action.date, position), id: action.id }],
      };
    }

    case "session/move": {
      const moving = state.sessions.find((s) => s.id === action.id);
      if (!moving) return state;
      // Renumber the day it lands on (with it slotted in) and the day it left, so both stay 0, 1, 2…
      const target = sessionsOn(state.sessions, action.date).filter((s) => s.id !== moving.id);
      const index = clamp(action.index ?? target.length, 0, target.length);
      target.splice(index, 0, moving);
      const source = moving.date === action.date ? [] : sessionsOn(state.sessions, moving.date).filter((s) => s.id !== moving.id);
      const positions = new Map<string, number>();
      target.forEach((s, i) => positions.set(s.id, i));
      source.forEach((s, i) => positions.set(s.id, i));
      const ts = now();
      return {
        ...state,
        sessions: state.sessions.map((s) => {
          const position = positions.get(s.id);
          const date = s.id === moving.id ? action.date : s.date;
          if (position === undefined || (position === s.position && date === s.date)) return s;
          return { ...s, date, position, updatedAt: ts };
        }),
      };
    }

    case "session/remove":
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };

    case "session/setDone":
      return mapSession(state, action.id, (s) => ({
        ...s,
        status: action.done ? "done" : "planned",
        completedAt: action.done ? now() : undefined,
      }));

    case "session/setRest":
      return mapSession(state, action.sessionId, (s) =>
        mapSessionExercise(s, action.exerciseId, (e) => ({
          ...e,
          prescription: { ...e.prescription, restSeconds: action.restSeconds },
        })),
      );

    case "set/add":
      return mapSession(state, action.sessionId, (s) =>
        mapSessionExercise(s, action.exerciseId, (e) => {
          if (e.sets.length >= MAX_SETS) return e;
          // An extra set has no plan; it starts from what the last set actually was.
          const last = e.sets.at(-1);
          const actual = last ? { ...last.actual } : makeSets(e.prescription, 1)[0].actual;
          return { ...e, sets: [...e.sets, { id: newId(), position: e.sets.length, planned: {}, actual, done: false }] };
        }),
      );

    case "set/remove":
      return mapSession(state, action.sessionId, (s) =>
        mapSessionExercise(s, action.exerciseId, (e) => ({
          ...e,
          sets: reposition(e.sets.filter((set) => set.id !== action.setId)),
        })),
      );

    case "set/update":
      return mapSession(state, action.sessionId, (s) =>
        mapSessionExercise(s, action.exerciseId, (e) => {
          const target = e.sets.find((set) => set.id === action.setId);
          if (!target) return e;
          // New reps or weight carry forward to every later set (and so to sets added later,
          // which copy the last one); earlier sets keep what they were.
          const carried = carriedForward(action.actual);
          return {
            ...e,
            sets: e.sets.map((set) => {
              if (set.id === action.setId) {
                return {
                  ...set,
                  actual: action.actual ? { ...set.actual, ...action.actual } : set.actual,
                  done: action.done ?? set.done,
                };
              }
              if (carried && set.position > target.position) {
                return { ...set, actual: { ...set.actual, ...carried } };
              }
              return set;
            }),
          };
        }),
      );

    case "journal/set":
      return { ...state, journal: { ...state.journal, [action.date]: action.text } };
  }
}
