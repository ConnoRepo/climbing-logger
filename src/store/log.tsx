import { createContext, useContext, useState, type ReactNode } from "react";

import type { IconName } from "@/components/ui";
import { toKey, type DateKey } from "@/lib/dates";

export type Workout = {
  id: string;
  name: string;
  icon?: IconName;
  done: boolean;
};

/** Workouts offered in the "+ Workout" sheet. */
export const WORKOUT_CATALOG: { name: string; icon: IconName }[] = [
  { name: "Mobility", icon: "loader" },
  { name: "Climbing", icon: "image" },
  { name: "Workout", icon: "link" },
  { name: "One-Arm Pull Ups", icon: "link" },
];

type LogState = {
  selectedDate: DateKey;
  selectDate: (date: DateKey) => void;
  workoutsFor: (date: DateKey) => Workout[];
  addWorkout: (date: DateKey, workout: Omit<Workout, "id" | "done">) => void;
  removeWorkout: (date: DateKey, id: string) => void;
  toggleWorkout: (date: DateKey, id: string) => void;
  journalFor: (date: DateKey) => string;
  setJournal: (date: DateKey, text: string) => void;
};

const LogContext = createContext<LogState | null>(null);

const NO_WORKOUTS: Workout[] = [];

// In-memory for now — swap the useState calls for persisted storage later.
export function LogProvider({ children }: { children: ReactNode }) {
  const [selectedDate, selectDate] = useState(() => toKey(new Date()));
  const [workouts, setWorkouts] = useState<Record<DateKey, Workout[]>>({});
  const [journal, setJournalEntries] = useState<Record<DateKey, string>>({});

  function updateDay(date: DateKey, fn: (list: Workout[]) => Workout[]) {
    setWorkouts((prev) => ({ ...prev, [date]: fn(prev[date] ?? []) }));
  }

  const value: LogState = {
    selectedDate,
    selectDate,
    workoutsFor: (date) => workouts[date] ?? NO_WORKOUTS,
    addWorkout: (date, workout) =>
      updateDay(date, (list) => [
        ...list,
        { ...workout, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, done: false },
      ]),
    removeWorkout: (date, id) => updateDay(date, (list) => list.filter((w) => w.id !== id)),
    toggleWorkout: (date, id) =>
      updateDay(date, (list) => list.map((w) => (w.id === id ? { ...w, done: !w.done } : w))),
    journalFor: (date) => journal[date] ?? "",
    setJournal: (date, text) => setJournalEntries((prev) => ({ ...prev, [date]: text })),
  };

  return <LogContext value={value}>{children}</LogContext>;
}

export function useLog() {
  const ctx = useContext(LogContext);
  if (!ctx) throw new Error("useLog must be used inside <LogProvider>");
  return ctx;
}
