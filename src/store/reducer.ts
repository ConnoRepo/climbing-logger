import { MEASURES, categoryInfo } from "@/data/categories";
import { newId, now } from "@/data/ids";
import { instantiate, makeSessionExercise, makeSets } from "@/data/schedule";
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

export type Action =
  | { type: "hydrate"; data: AppData }
  // Templates
  | { type: "template/create"; id: string; category: Category }
  | { type: "template/update"; id: string; patch: Partial<Pick<WorkoutTemplate, "name" | "category">> }
  | { type: "template/delete"; id: string }
  | { type: "template/addExercise"; templateId: string; name?: string }
  | { type: "template/updateExercise"; templateId: string; exerciseId: string; patch: Partial<Prescription> }
  | { type: "template/moveExercise"; templateId: string; exerciseId: string; by: -1 | 1 }
  | { type: "template/removeExercise"; templateId: string; exerciseId: string }
  // Sessions
  | { type: "session/schedule"; id: string; templateId: string; date: DateKey }
  | { type: "session/remove"; id: string }
  | { type: "session/setDone"; id: string; done: boolean }
  | { type: "session/addExercise"; sessionId: string; name: string; measure: Measure }
  | { type: "session/removeExercise"; sessionId: string; exerciseId: string }
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
  const ts = now();
  const exercise: Exercise = { id: newId(), name: name.trim(), category, defaultMeasure: measure, createdAt: ts, updatedAt: ts };
  return [{ ...state, exercises: [...state.exercises, exercise] }, exercise];
}

function newPrescription(exercise: Exercise | null, measure: Measure, position: number): Prescription {
  return {
    sets: 1,
    ...MEASURES[measure].defaults,
    id: newId(),
    position,
    exerciseId: exercise?.id ?? null,
    name: exercise?.name ?? "",
    measure,
  };
}

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "hydrate":
      return action.data;

    case "template/create": {
      const ts = now();
      const template: WorkoutTemplate = {
        id: action.id,
        category: action.category,
        name: `New ${categoryInfo(action.category).label}`,
        exercises: [],
        createdAt: ts,
        updatedAt: ts,
      };
      return { ...state, templates: [...state.templates, template] };
    }

    case "template/update":
      return mapTemplate(state, action.id, (t) => ({ ...t, ...action.patch }));

    case "template/delete":
      return mapTemplate(state, action.id, (t) => ({ ...t, deletedAt: now() }));

    case "template/addExercise": {
      const template = state.templates.find((t) => t.id === action.templateId);
      if (!template) return state;
      const measure = categoryInfo(template.category).defaultMeasure;
      const [next, exercise] = action.name?.trim()
        ? ensureExercise(state, action.name, template.category, measure)
        : [state, null];
      return mapTemplate(next, template.id, (t) => ({
        ...t,
        exercises: [...t.exercises, newPrescription(exercise, measure, t.exercises.length)],
      }));
    }

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
      // Switching measure fills in that measure's sensible defaults.
      if (patch.measure) patch = { ...MEASURES[patch.measure].defaults, ...patch };
      return mapTemplate(next, action.templateId, (t) => ({
        ...t,
        exercises: t.exercises.map((e) => (e.id === action.exerciseId ? { ...e, ...patch } : e)),
      }));
    }

    case "template/moveExercise":
      return mapTemplate(state, action.templateId, (t) => {
        const from = t.exercises.findIndex((e) => e.id === action.exerciseId);
        const to = from + action.by;
        if (from < 0 || to < 0 || to >= t.exercises.length) return t;
        const list = [...t.exercises];
        [list[from], list[to]] = [list[to], list[from]];
        return { ...t, exercises: reposition(list) };
      });

    case "template/removeExercise":
      return mapTemplate(state, action.templateId, (t) => ({
        ...t,
        exercises: reposition(t.exercises.filter((e) => e.id !== action.exerciseId)),
      }));

    case "session/schedule": {
      const template = state.templates.find((t) => t.id === action.templateId);
      if (!template) return state;
      return { ...state, sessions: [...state.sessions, { ...instantiate(template, action.date), id: action.id }] };
    }

    case "session/remove":
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };

    case "session/setDone":
      return mapSession(state, action.id, (s) => ({
        ...s,
        status: action.done ? "done" : "planned",
        completedAt: action.done ? now() : undefined,
      }));

    case "session/addExercise": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session) return state;
      const [next, exercise] = ensureExercise(state, action.name, session.category, action.measure);
      return mapSession(next, session.id, (s) => ({
        ...s,
        exercises: [
          ...s.exercises,
          makeSessionExercise(newPrescription(exercise, action.measure, s.exercises.length), s.exercises.length),
        ],
      }));
    }

    case "session/removeExercise":
      return mapSession(state, action.sessionId, (s) => ({
        ...s,
        exercises: reposition(s.exercises.filter((e) => e.id !== action.exerciseId)),
      }));

    case "set/add":
      return mapSession(state, action.sessionId, (s) =>
        mapSessionExercise(s, action.exerciseId, (e) => {
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
        mapSessionExercise(s, action.exerciseId, (e) => ({
          ...e,
          sets: e.sets.map((set) =>
            set.id === action.setId
              ? {
                  ...set,
                  actual: action.actual ? { ...set.actual, ...action.actual } : set.actual,
                  done: action.done ?? set.done,
                }
              : set,
          ),
        })),
      );

    case "journal/set":
      return { ...state, journal: { ...state.journal, [action.date]: action.text } };
  }
}
