import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "./database.types";
import type { Changes } from "./sync";
import type { Category, JournalEntry, Prescription, Session, SetLog, WorkoutTemplate } from "./types";

/**
 * The only module that talks to Supabase. Tables live in the `main` schema (see
 * supabase/migrations); rows are snake_case there and mapped to the app's types here.
 */

type Tables = Database["main"]["Tables"];
type Row<T extends keyof Tables> = Tables[T]["Row"];

/** Rows fetched per request: well under the API's 1000-row cap. */
const PAGE_SIZE = 500;
/** How far behind the cursor a pull starts, so rows from writes that committed late aren't missed. */
const PULL_OVERLAP_MS = 60_000;

let db: SupabaseClient<Database> | null = null;

/** Created on first use, so the app still runs offline-only when the env vars are missing. */
function client() {
  if (db) return db;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase isn't configured: set EXPO_PUBLIC_SUPABASE_URL and _PUBLISHABLE_KEY");
  db = createClient<Database>(url, key, {
    db: { schema: "main" },
    auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  return db;
}

/**
 * The signed-in user's id. With no session yet, signs in anonymously: the device gets its own
 * user with no sign-up, which a real identity can be linked to later.
 */
export async function ensureUser(): Promise<string> {
  const auth = client().auth;
  // An error here (say, a refresh that failed offline) must not start a new user; retry later instead.
  const { data, error } = await auth.getSession();
  if (error) throw error;
  if (data.session) return data.session.user.id;
  const signIn = await auth.signInAnonymously();
  if (signIn.error) throw signIn.error;
  if (!signIn.data.user) throw new Error("Anonymous sign-in returned no user");
  return signIn.data.user.id;
}

/** Keeps the session fresh only while the app is in the foreground, as Supabase recommends on mobile. */
export function setAutoRefresh(active: boolean) {
  if (!db) return;
  if (active) db.auth.startAutoRefresh();
  else db.auth.stopAutoRefresh();
}

/** Sends local changes. Templates go first, since sessions reference them. */
export async function push(c: Changes) {
  const main = client();
  if (c.templates.length) check(await main.from("templates").upsert(c.templates.map(templateToRow)));
  if (c.sessions.length) check(await main.from("sessions").upsert(c.sessions.map(sessionToRow)));
  if (c.journal.length) {
    check(await main.from("journal").upsert(c.journal.map(journalToRow), { onConflict: "user_id,date" }));
  }
  if (c.deletedSessions.length) {
    const deletedAt = c.deletedSessions[0].updatedAt;
    const ids = c.deletedSessions.map((d) => d.id);
    check(await main.from("sessions").update({ deleted_at: deletedAt, updated_at: deletedAt }).in("id", ids));
  }
}

/** Rows the server changed since `cursor` (everything when null), and the cursor to pull from next. */
export async function pullSince(cursor: string | null): Promise<{ changes: Changes; cursor: string | null }> {
  const since = cursor && new Date(Date.parse(cursor) - PULL_OVERLAP_MS).toISOString();
  const [templates, sessions, journal] = await Promise.all([
    changedSince("templates", "id", since),
    changedSince("sessions", "id", since),
    changedSince("journal", "date", since),
  ]);
  const latest = [...templates, ...sessions, ...journal].map((row) => iso(row.synced_at)).sort().at(-1);
  return {
    changes: {
      templates: templates.map(templateFromRow),
      sessions: sessions.filter((s) => !s.deleted_at).map(sessionFromRow),
      journal: journal.map(journalFromRow),
      deletedSessions: sessions.filter((s) => s.deleted_at).map((s) => ({ id: s.id, updatedAt: iso(s.updated_at) })),
    },
    cursor: latest ?? cursor,
  };
}

async function changedSince<T extends keyof Tables>(table: T, key: keyof Row<T> & string, since: string | null) {
  const rows: Row<T>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = client().from(table).select("*");
    if (since) query = query.gt("synced_at", since);
    // Ordered all the way down to the key, so pages don't shift under each other.
    const { data, error } = await query
      .order("synced_at")
      .order(key)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data as unknown as Row<T>[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function check({ error }: { error: Error | null }) {
  if (error) throw error;
}

/*
 * Row mapping. Timestamps come back from Postgres as "…+00:00" with microseconds; they're
 * normalized to the app's `toISOString()` form so they compare equal to what was sent.
 */

function iso(timestamp: string) {
  // Trimmed to milliseconds first: not every JS engine parses more fractional digits.
  return new Date(timestamp.replace(/(\.\d{3})\d+/, "$1")).toISOString();
}

function isoOrNull(timestamp: string | null) {
  return timestamp === null ? null : iso(timestamp);
}

function templateToRow(t: WorkoutTemplate): Tables["templates"]["Insert"] {
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    prescription: t.prescription as Json,
    deleted_at: t.deletedAt,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

function templateFromRow(r: Row<"templates">): WorkoutTemplate {
  return {
    id: r.id,
    name: r.name,
    category: r.category as Category,
    prescription: r.prescription as Prescription,
    deletedAt: isoOrNull(r.deleted_at),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function sessionToRow(s: Session): Tables["sessions"]["Insert"] {
  return {
    id: s.id,
    template_id: s.templateId,
    date: s.date,
    position: s.position,
    name: s.name,
    category: s.category,
    prescription: s.prescription as Json,
    sets: s.sets as Json,
    completed_at: s.completedAt,
    running_since: s.runningSince,
    notes: s.notes,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

function sessionFromRow(r: Row<"sessions">): Session {
  return {
    id: r.id,
    templateId: r.template_id,
    date: r.date,
    position: r.position,
    name: r.name,
    category: r.category as Category,
    prescription: r.prescription as Prescription,
    sets: r.sets as SetLog[],
    completedAt: isoOrNull(r.completed_at),
    runningSince: isoOrNull(r.running_since),
    notes: r.notes,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function journalToRow(e: JournalEntry): Tables["journal"]["Insert"] {
  return { date: e.date, text: e.text, created_at: e.createdAt, updated_at: e.updatedAt };
}

function journalFromRow(r: Row<"journal">): JournalEntry {
  return { date: r.date, text: r.text, createdAt: iso(r.created_at), updatedAt: iso(r.updated_at) };
}
