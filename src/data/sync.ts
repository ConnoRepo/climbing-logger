import { now } from "./ids";
import type { AppData, JournalEntry, Session, WorkoutTemplate } from "./types";

/**
 * Sync between the device and the server, as plain data. The device is the source of truth for
 * the UI: edits land locally first, and a row goes up when its `updatedAt` differs from the
 * version the server is known to have. When both sides changed a row, the later `updatedAt` wins.
 */

/** A row's `updatedAt` as the server has it, by id (journal entries by date). */
type Versions = Record<string, string>;

export type SyncState = {
  /** Whose rows `synced` describes; a different user means everything goes up again. */
  userId: string | null;
  /** The server's clock at the newest row pulled so far; null before the first pull. */
  cursor: string | null;
  synced: { templates: Versions; sessions: Versions; journal: Versions };
};

export const NEW_SYNC_STATE: SyncState = { userId: null, cursor: null, synced: { templates: {}, sessions: {}, journal: {} } };

/**
 * Rows changed on one side, to send to the other. The app deletes sessions outright, so a deleted
 * one travels as a tombstone: its id and when it was deleted.
 */
export type Changes = {
  templates: WorkoutTemplate[];
  sessions: Session[];
  journal: JournalEntry[];
  deletedSessions: { id: string; updatedAt: string }[];
};

export function hasChanges(c: Changes) {
  return c.templates.length + c.sessions.length + c.journal.length + c.deletedSessions.length > 0;
}

/** What the server doesn't have yet: rows edited since they were last synced, and sessions deleted since. */
export function pendingChanges(data: AppData, synced: SyncState["synced"]): Changes {
  const live = new Set(data.sessions.map((s) => s.id));
  const deletedAt = now();
  return {
    templates: data.templates.filter((t) => synced.templates[t.id] !== t.updatedAt),
    sessions: data.sessions.filter((s) => synced.sessions[s.id] !== s.updatedAt),
    journal: data.journal.filter((e) => synced.journal[e.date] !== e.updatedAt),
    deletedSessions: Object.keys(synced.sessions)
      .filter((id) => !live.has(id))
      .map((id) => ({ id, updatedAt: deletedAt })),
  };
}

/**
 * The pulled rows this device hasn't seen. A pull overlaps the one before it and returns the
 * device's own pushes too; those versions are already in `synced` and are dropped.
 */
export function unseenChanges(c: Changes, synced: SyncState["synced"]): Changes {
  return {
    templates: c.templates.filter((t) => synced.templates[t.id] !== t.updatedAt),
    sessions: c.sessions.filter((s) => synced.sessions[s.id] !== s.updatedAt),
    journal: c.journal.filter((e) => synced.journal[e.date] !== e.updatedAt),
    // A session the device has never synced (or already saw deleted) has nothing to delete.
    deletedSessions: c.deletedSessions.filter((d) => Object.hasOwn(synced.sessions, d.id)),
  };
}

/** Records rows as the server now has them, after a push or a pull. */
export function markSynced(synced: SyncState["synced"], c: Changes): SyncState["synced"] {
  const sessions = { ...synced.sessions, ...versions(c.sessions, (s) => s.id) };
  for (const { id } of c.deletedSessions) delete sessions[id];
  return {
    templates: { ...synced.templates, ...versions(c.templates, (t) => t.id) },
    sessions,
    journal: { ...synced.journal, ...versions(c.journal, (e) => e.date) },
  };
}

function versions<T extends { updatedAt: string }>(rows: T[], key: (row: T) => string): Versions {
  return Object.fromEntries(rows.map((row) => [key(row), row.updatedAt]));
}

/** Folds rows pulled from the server into the device's data, keeping whichever side changed last. */
export function applyRemote(data: AppData, remote: Changes): AppData {
  const deleted = new Map(remote.deletedSessions.map((d) => [d.id, d.updatedAt]));
  return {
    templates: mergeRows(data.templates, remote.templates, (t) => t.id),
    sessions: mergeRows(data.sessions, remote.sessions, (s) => s.id).filter((s) => {
      const deletedAt = deleted.get(s.id);
      return deletedAt === undefined || deletedAt < s.updatedAt;
    }),
    journal: mergeRows(data.journal, remote.journal, (e) => e.date),
  };
}

/**
 * A remote row replaces the local one when it's newer, and is added when the device doesn't have
 * it. Timestamps are ISO strings in UTC, so they compare as strings.
 */
function mergeRows<T extends { updatedAt: string }>(local: T[], remote: T[], key: (row: T) => string): T[] {
  if (!remote.length) return local;
  const incoming = new Map(remote.map((row) => [key(row), row]));
  const merged = local.map((row) => {
    const theirs = incoming.get(key(row));
    if (!theirs) return row;
    incoming.delete(key(row));
    return theirs.updatedAt > row.updatedAt ? theirs : row;
  });
  return [...merged, ...incoming.values()];
}
