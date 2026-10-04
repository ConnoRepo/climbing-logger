import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from "react";

import { newId } from "@/data/ids";
import { FAKE_POINTS, HISTORY, SHOW_FAKE_POINTS, notesHistory, withFakePoints } from "@/data/progress";
import { seedData } from "@/data/seed";
import { sessionsOn } from "@/data/sessions";
import { loadState, saveState } from "@/data/storage";
import type { AppData, Category, HistoryKind, Prescription, SetLog, WorkoutTemplate } from "@/data/types";
import { toKey, type DateKey } from "@/lib/dates";

import { reducer } from "./reducer";

const EMPTY: AppData = { templates: [], sessions: [], journal: [] };
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
    sessionsFor: (date: DateKey) => sessionsOn(data.sessions, date),
    /** Planned but not on a day yet. */
    unscheduled: sessionsOn(data.sessions, null),
    session: (id: string) => data.sessions.find((s) => s.id === id),
    /** Every workout that hasn't been deleted. */
    templates,
    template: (id: string): WorkoutTemplate | undefined => templates.find((t) => t.id === id),
    journalFor: (date: DateKey) => data.journal.find((e) => e.date === date)?.text ?? "",
    /** A workout's points over time, for its kind of graph: heaviest weight, or minutes. */
    history: (templateId: string, kind: HistoryKind) => {
      const points = HISTORY[kind](data.sessions, templateId);
      return SHOW_FAKE_POINTS ? withFakePoints(points, FAKE_POINTS[kind]) : points;
    },
    /** Notes from every session of a workout, newest first. */
    notesHistory: (templateId: string) => notesHistory(data.sessions, templateId),

    // Templates
    /** A new workout, named "New Fingers" and so on unless `name` is given. */
    createTemplate: (category: Category, name?: string) => {
      const id = newId();
      dispatch({ type: "template/create", id, category, name });
      return id;
    },
    renameTemplate: (id: string, name: string) => dispatch({ type: "template/rename", id, name }),
    updatePrescription: (id: string, patch: Partial<Prescription>) =>
      dispatch({ type: "template/updatePrescription", id, patch }),
    deleteTemplate: (id: string) => dispatch({ type: "template/delete", id }),

    // Sessions
    /** Adds a copy of the template to a day, or to Unscheduled when `date` is null. */
    schedule: (templateId: string, date: DateKey | null) => {
      const id = newId();
      dispatch({ type: "session/schedule", id, templateId, date });
      return id;
    },
    deleteSession: (id: string) => dispatch({ type: "session/delete", id }),
    /** Moves a session to a day (or back to Unscheduled with null), at `index` there or at the end. */
    moveSession: (id: string, date: DateKey | null, index?: number) =>
      dispatch({ type: "session/move", id, date, index }),
    setSessionDone: (id: string, done: boolean) => dispatch({ type: "session/setDone", id, done }),
    setSessionNotes: (id: string, notes: string) => dispatch({ type: "session/setNotes", id, notes }),
    setSessionRest: (id: string, restSeconds: number) => dispatch({ type: "session/setRest", id, restSeconds }),
    startStopwatch: (id: string) => dispatch({ type: "stopwatch/start", id }),
    pauseStopwatch: (id: string) => dispatch({ type: "stopwatch/pause", id }),
    /** Stops the clock and logs its time as the session's. */
    finishStopwatch: (id: string) => dispatch({ type: "stopwatch/finish", id }),
    addSet: (sessionId: string) => dispatch({ type: "set/add", sessionId }),
    removeLastSet: (sessionId: string) => dispatch({ type: "set/removeLast", sessionId }),
    /** New reps, time or weight carry forward to the later sets. */
    updateSet: (sessionId: string, setId: string, change: Partial<Omit<SetLog, "id">>) =>
      dispatch({ type: "set/update", sessionId, setId, change }),

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
