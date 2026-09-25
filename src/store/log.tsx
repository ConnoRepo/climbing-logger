import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from "react";

import { newId } from "@/data/ids";
import { SHOW_FAKE_POINTS, weightHistory, withFakePoints } from "@/data/progress";
import { seedData } from "@/data/seed";
import { loadState, saveState } from "@/data/storage";
import type { AppData, Category, Prescription, Session, SetValues, WorkoutTemplate } from "@/data/types";
import { toKey, type DateKey } from "@/lib/dates";

import { reducer } from "./reducer";

const inOrder = (sessions: Session[]) => sessions.sort((a, b) => a.position - b.position);

const EMPTY: AppData = { exercises: [], templates: [], sessions: [], journal: {} };
const SAVE_DELAY_MS = 400;

function useLogState() {
  const [data, dispatch] = useReducer(reducer, EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [selectedDate, selectDate] = useState(() => toKey(new Date()));

  useEffect(() => {
    loadState().then((saved) => {
      dispatch({ type: "hydrate", data: saved ?? seedData() });
      setHydrated(true);
    });
  }, []);

  // Debounced save after every change (never before the saved data has loaded).
  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(() => saveState(data), SAVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [data, hydrated]);

  const templates = data.templates.filter((t) => !t.deletedAt);

  return {
    hydrated,
    selectedDate,
    selectDate,

    // Reads
    sessionsFor: (date: DateKey) => inOrder(data.sessions.filter((s) => s.date === date)),
    /** Planned but not on a day yet. */
    unscheduled: inOrder(data.sessions.filter((s) => s.date === null)),
    session: (id: string) => data.sessions.find((s) => s.id === id),
    templatesIn: (category: Category) => templates.filter((t) => t.category === category),
    template: (id: string): WorkoutTemplate | undefined => templates.find((t) => t.id === id),
    journalFor: (date: DateKey) => data.journal[date] ?? "",
    weightHistory: (templateId: string) => {
      const points = weightHistory(data.sessions, templateId);
      return SHOW_FAKE_POINTS ? withFakePoints(points) : points;
    },

    // Templates
    createTemplate: (category: Category) => {
      const id = newId();
      dispatch({ type: "template/create", id, category });
      return id;
    },
    updateTemplate: (id: string, patch: Partial<Pick<WorkoutTemplate, "name" | "category">>) =>
      dispatch({ type: "template/update", id, patch }),
    deleteTemplate: (id: string) => dispatch({ type: "template/delete", id }),
    updateTemplateExercise: (templateId: string, exerciseId: string, patch: Partial<Prescription>) =>
      dispatch({ type: "template/updateExercise", templateId, exerciseId, patch }),

    // Sessions
    /** Adds a copy of the template to a day, or to Unscheduled when `date` is null. */
    schedule: (templateId: string, date: DateKey | null) => {
      const id = newId();
      dispatch({ type: "session/schedule", id, templateId, date });
      return id;
    },
    removeSession: (id: string) => dispatch({ type: "session/remove", id }),
    /** Moves a session to a day (or back to Unscheduled with null), at `index` there or at the end. */
    moveSession: (id: string, date: DateKey | null, index?: number) =>
      dispatch({ type: "session/move", id, date, index }),
    setSessionDone: (id: string, done: boolean) => dispatch({ type: "session/setDone", id, done }),
    setRest: (sessionId: string, exerciseId: string, restSeconds: number) =>
      dispatch({ type: "session/setRest", sessionId, exerciseId, restSeconds }),
    addSet: (sessionId: string, exerciseId: string) => dispatch({ type: "set/add", sessionId, exerciseId }),
    removeSet: (sessionId: string, exerciseId: string, setId: string) =>
      dispatch({ type: "set/remove", sessionId, exerciseId, setId }),
    updateSet: (sessionId: string, exerciseId: string, setId: string, change: { actual?: SetValues; done?: boolean }) =>
      dispatch({ type: "set/update", sessionId, exerciseId, setId, ...change }),

    // Journal
    setJournal: (date: DateKey, text: string) => dispatch({ type: "journal/set", date, text }),
  };
}

type LogState = ReturnType<typeof useLogState>;

const LogContext = createContext<LogState | null>(null);

export function LogProvider({ children }: { children: ReactNode }) {
  return <LogContext value={useLogState()}>{children}</LogContext>;
}

export function useLog() {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLog must be used inside <LogProvider>");
  return ctx;
}
