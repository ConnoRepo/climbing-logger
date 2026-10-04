# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Data model

- `src/data/types.ts` is the schema. `AppData` holds three collections, one per future backend table:
  `templates` (saved workouts), `sessions` (a workout on a day), `journal` (one entry per date).
- A workout is exactly one exercise: a template has one `prescription`; a session has a `prescription`
  snapshot and its logged `sets`. Change this deliberately, never with a one-off array.
- One home per value. Don't store what can be derived: done is `completedAt !== null`, a set count is
  `sets.length`, a set's plan is `prescription.sets[i]`.
- `prescription` and `sets` are JSON columns, read and written with their row; their fields are optional.
  Row fields that can be absent are `T | null`; text is `""` when empty.
- Rows have a UUID `id` from `newId()` plus `createdAt`/`updatedAt` (journal entries are keyed by `date`).
  Every write must bump `updatedAt`.
- Sessions are snapshots: scheduling copies the template, and later template edits never touch them.
- Sets are only added or removed at the end, so `sets[i]` always lines up with `prescription.sets[i]`.
- Changing the shape of `AppData`: bump `SCHEMA_VERSION` in `storage.ts`.

# Code organization

- `src/data/` is plain TypeScript: no React/React Native, and no imports from components, hooks or store
  (only `storage.ts` touches AsyncStorage), so a backend can reuse it.
- Helpers live with the record they work on: `templates.ts`, `sessions.ts`. Measure and category config
  lives in `measures.ts` / `categories.ts`; display text in `format.ts`. Constructors are named `newX`.
- Every write is a reducer action in `src/store/reducer.ts` (`record/verb`; session actions take `id`,
  set actions take `sessionId`), exposed as a method on `useLog()`, the app's one store.
- `components/ui/` are primitives and never read the store; screens and feature components do.
- What differs between measures lives in `MEASURES` (flags, fields, defaults). Components read those
  flags, never `measure === "…"`. Where logic must branch on a measure or session kind, use a
  `Record<Measure, …>` table or a switch ending in `x satisfies never`, so a new measure is a compile
  error until every place handles it.

# Naming

- In code, a saved workout is a template (`WorkoutTemplate`) and a workout on a day is a session
  (`Session`); the UI calls both "workout".
- Name things after the current model; rename or delete code whose concept is gone.

# Style

- Comments explain why, in plain words, about the code as it is now. History belongs in git.
- New UI uses theme tokens (`colors`, `space`, `borders`, `type`); a Figma-exact number used more than
  once gets a named const.
- Menus and pickers are drawn in the app's notebook style (see `NewMenu` in `add-workout.tsx`), not
  native action sheets.
- Delete code when its last caller goes. Export only what another file uses (the model types in
  `types.ts` are all exported, as the schema).
- Before finishing: `npx tsc --noEmit` and `npm run lint`.
