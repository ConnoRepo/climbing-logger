-- The app's three collections (src/data/types.ts AppData), one table each, owned per user.
-- The device is the source of truth for the UI and syncs rows up and down (src/data/sync.ts):
-- ids and created/updated times come from the client; synced_at is the server's pull cursor.

create schema if not exists main;
create schema if not exists private;

-- Saved workouts. Soft-deleted, since sessions keep pointing at them.
create table main.templates (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  category text not null check (category in ('climbing', 'fingers', 'workout', 'mobility')),
  prescription jsonb not null,
  deleted_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  -- Lets sessions reference a template together with its owner.
  unique (user_id, id)
);

-- A workout on a day: a snapshot of its template plus the sets logged.
create table main.sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  template_id uuid not null,
  -- null while Unscheduled
  date date,
  position integer not null,
  name text not null,
  category text not null check (category in ('climbing', 'fingers', 'workout', 'mobility')),
  prescription jsonb not null,
  sets jsonb not null default '[]',
  completed_at timestamptz,
  running_since timestamptz,
  notes text not null default '',
  -- The app deletes sessions outright; the server keeps a tombstone so the delete reaches other devices.
  deleted_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  -- A session can only point at its own user's template.
  foreign key (user_id, template_id) references main.templates (user_id, id)
);

-- One journal entry per day.
create table main.journal (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  text text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  synced_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- Pull: a user's rows changed since a cursor. Also covers the RLS predicate.
create index templates_user_id_synced_at_idx on main.templates (user_id, synced_at);
create index sessions_user_id_synced_at_idx on main.sessions (user_id, synced_at);
create index journal_user_id_synced_at_idx on main.journal (user_id, synced_at);
create index sessions_user_id_template_id_idx on main.sessions (user_id, template_id);

-- Stamps every write with the server clock for the pull cursor, and drops a write older than
-- the row (by the client's updated_at) so the newest edit wins, even through a plain upsert.
create function private.sync_row()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return null;
  end if;
  new.synced_at := now();
  return new;
end;
$$;

revoke execute on function private.sync_row() from public, anon, authenticated;

create trigger sync_row before insert or update on main.templates
  for each row execute function private.sync_row();
create trigger sync_row before insert or update on main.sessions
  for each row execute function private.sync_row();
create trigger sync_row before insert or update on main.journal
  for each row execute function private.sync_row();

-- Each user sees and writes only their own rows. No delete policies: the client never hard-deletes.
alter table main.templates enable row level security;
alter table main.sessions enable row level security;
alter table main.journal enable row level security;

create policy "Users read their templates" on main.templates
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add their templates" on main.templates
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users change their templates" on main.templates
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users read their sessions" on main.sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add their sessions" on main.sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users change their sessions" on main.sessions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users read their journal" on main.journal
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add to their journal" on main.journal
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users change their journal" on main.journal
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Data API access: signed-in users (anonymous ones included) only; nothing for anon.
grant usage on schema main to authenticated, service_role;
grant select, insert, update on main.templates, main.sessions, main.journal to authenticated;
grant all on main.templates, main.sessions, main.journal to service_role;
