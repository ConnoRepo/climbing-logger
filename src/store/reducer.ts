import { categoryInfo, defaultMeasure } from "@/data/categories";
import { newId, now } from "@/data/ids";
import { MAX_SETS, MEASURES, updateSetAt } from "@/data/measures";
import { isStopwatch, newSession, sessionsOn, stopClock, withSet } from "@/data/sessions";
import { applyRemote, type Changes } from "@/data/sync";
import { newPrescription, newTemplate } from "@/data/templates";
import type { AppData, Category, Prescription, Session, SetLog, WorkoutTemplate } from "@/data/types";
import type { DateKey } from "@/lib/dates";
import { clamp } from "@/lib/math";

export type Action =
  | { type: "hydrate"; data: AppData }
  /** Rows pulled from the server, merged into whatever the device has by then. */
  | { type: "sync/pull"; changes: Changes }
  // Templates
  | { type: "template/create"; id: string; category: Category; name?: string }
  | { type: "template/rename"; id: string; name: string }
  | { type: "template/updatePrescription"; id: string; patch: Partial<Prescription> }
  | { type: "template/delete"; id: string }
  // Sessions
  | { type: "session/schedule"; id: string; templateId: string; date: DateKey | null }
  /** To a day (or Unscheduled with null), at `index` among its other sessions; the end if omitted. */
  | { type: "session/move"; id: string; date: DateKey | null; index?: number }
  | { type: "session/delete"; id: string }
  | { type: "session/setDone"; id: string; done: boolean }
  | { type: "session/setNotes"; id: string; notes: string }
  | { type: "session/setRest"; id: string; restSeconds: number }
  // Stopwatch sessions
  | { type: "stopwatch/start" | "stopwatch/pause" | "stopwatch/finish"; id: string }
  // A session's sets
  | { type: "set/add"; sessionId: string }
  | { type: "set/removeLast"; sessionId: string }
  | { type: "set/update"; sessionId: string; setId: string; change: Partial<Omit<SetLog, "id">> }
  // Journal
  | { type: "journal/set"; date: DateKey; text: string };

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

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "hydrate":
      return action.data;

    case "sync/pull":
      return applyRemote(state, action.changes);

    case "template/create": {
      const name = action.name?.trim() || `New ${categoryInfo(action.category).label}`;
      const template = newTemplate(action.category, name, newPrescription(defaultMeasure(action.category)), action.id);
      return { ...state, templates: [...state.templates, template] };
    }

    case "template/rename":
      return mapTemplate(state, action.id, (t) => ({ ...t, name: action.name }));

    case "template/updatePrescription": {
      // Switching measure starts over from that measure's sensible defaults, sets included.
      const { measure } = action.patch;
      const patch = measure ? { ...MEASURES[measure].defaults, ...action.patch } : action.patch;
      return mapTemplate(state, action.id, (t) => ({ ...t, prescription: { ...t.prescription, ...patch } }));
    }

    case "template/delete":
      return mapTemplate(state, action.id, (t) => ({ ...t, deletedAt: now() }));

    case "session/schedule": {
      const template = state.templates.find((t) => t.id === action.templateId);
      if (!template) return state;
      const position = Math.max(-1, ...sessionsOn(state.sessions, action.date).map((s) => s.position)) + 1;
      return { ...state, sessions: [...state.sessions, newSession(template, action.id, action.date, position)] };
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

    case "session/delete":
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };

    case "session/setDone":
      return mapSession(state, action.id, (s) => {
        const next: Session = { ...s, completedAt: action.done ? now() : null };
        // Ticking off a stopwatch session stops its clock and logs the time (unticking takes it off the graph).
        return isStopwatch(s) ? withSet(stopClock(next, now()), (set) => ({ ...set, done: action.done })) : next;
      });

    case "session/setNotes":
      return mapSession(state, action.id, (s) => ({ ...s, notes: action.notes }));

    case "session/setRest":
      return mapSession(state, action.id, (s) => ({
        ...s,
        prescription: { ...s.prescription, restSeconds: action.restSeconds },
      }));

    // A finished session can be started again: it carries on from the time it logged.
    case "stopwatch/start":
      return mapSession(state, action.id, (s) =>
        s.runningSince ? s : withSet(s, (set) => ({ ...set, done: false }), { runningSince: now(), completedAt: null }),
      );

    case "stopwatch/pause":
      return mapSession(state, action.id, (s) => stopClock(s, now()));

    case "stopwatch/finish": {
      const ts = now();
      return mapSession(state, action.id, (s) =>
        withSet(stopClock(s, ts), (set) => ({ ...set, done: true }), { completedAt: ts }),
      );
    }

    case "set/add":
      return mapSession(state, action.sessionId, (s) => {
        if (s.sets.length >= MAX_SETS) return s;
        // An extra set has no plan; it starts from what the last set actually was.
        const from = s.sets.at(-1) ?? s.prescription.sets[0] ?? {};
        return { ...s, sets: [...s.sets, { ...from, id: newId(), done: false }] };
      });

    case "set/removeLast":
      return mapSession(state, action.sessionId, (s) => ({ ...s, sets: s.sets.slice(0, -1) }));

    case "set/update":
      return mapSession(state, action.sessionId, (s) => {
        const index = s.sets.findIndex((set) => set.id === action.setId);
        return index < 0 ? s : { ...s, sets: updateSetAt(s.sets, index, action.change) };
      });

    case "journal/set": {
      const ts = now();
      const existing = state.journal.some((e) => e.date === action.date);
      return {
        ...state,
        journal: existing
          ? state.journal.map((e) => (e.date === action.date ? { ...e, text: action.text, updatedAt: ts } : e))
          : [...state.journal, { date: action.date, text: action.text, createdAt: ts, updatedAt: ts }],
      };
    }
  }
}
