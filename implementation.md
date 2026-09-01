# Study Tracker — Implementation Status

## Status

The initial frontend foundation, deployed Supabase migrations, Phase 3 subject management, Phase 4 study timer, Phase 5 study history, Phase 6 statistics, Phase 7 study streaks, Phase 8 task management, Phase 9 user settings, Phase 10 dashboard integration, and Phase 11 UI/UX polish are complete. The application can be run locally, navigated on desktop and mobile, linted, and built for production. Add the public Supabase browser variables to a local `.env` file to sign up, sign in, and live-test the implemented features.

## Phase 3: Subject management

- Added `supabase/migrations/20260831213000_add_subject_color.sql`. It adds a required `subjects.color` text column with a `#RRGGBB` check constraint and default `#6366F1`; existing subject rows receive that default.
- Added subject create, list, edit, and delete client-side data access through Supabase. RLS continues to limit both subject and session reads to the authenticated user.
- Added name and color selection/editing, a visible subject color swatch, duplicate-name handling, and deletion messaging for subjects that have study sessions.
- The Subjects page derives each subject's all-time study time from its completed `study_sessions` rows (`end_time - start_time`). No total is stored on `subjects` and no session schema was changed for this feature.
- Live CRUD testing still requires configured environment variables and a real Supabase user.

This stage intentionally does **not** include dashboard data. Subject management, the study timer, study history, statistics, streaks, task management, minimal email/password authentication, and settings persistence are the implemented exceptions described above.

## Phase 4: Study timer

- Added a server-backed study timer at `/study` using the existing `study_sessions` table and RLS policies; no database migration was required.
- Users choose one of their subjects and start one active session. The database partial unique index remains the authority that prevents concurrent active sessions.
- The page restores an existing active session after refresh and calculates the display from `start_time` and the current browser time without per-second database writes.
- Stopping updates only `end_time`; the existing database-generated `duration_seconds` remains database-owned. The UI shows the completed duration derived from timestamps.
- Loading, missing-subject, authentication, network/database, and concurrent-start states show human-readable feedback.

## Phase 5: Study history

- Added an authenticated `/history` page for completed sessions only, using one RLS-scoped query that joins each `study_sessions` row to its subject name and color and sorts by newest `end_time` first.
- Subject and local-date filters operate on the loaded result set, avoiding repeated database queries. Sessions are grouped as Today, Yesterday, or their browser-local calendar date.
- History uses the generated `duration_seconds` column and formats it as seconds, minutes, or hours/minutes. Start and end times are rendered in the browser's local timezone.
- Empty, filtered-empty, loading, expired-session, and database-error states are handled without exposing raw database errors. Session edit/delete is intentionally not included.
- The history embed explicitly uses the existing `study_sessions_subject_belongs_to_user` composite foreign-key relationship. PostgREST returns that many-to-one subject as one object, not an array.

## Phase 6: Study statistics

- Added an authenticated `/statistics` page driven by one RLS-scoped completed-session query joined to each subject's name and color. No database totals, caches, or migrations were added.
- Derived today, Monday-start week, month, year, and all-time time totals; completed count; average completed duration; and longest completed duration from the shared raw session result.
- Daily trend and subject breakdown use the selected today/week/month/year range. Sessions crossing a browser-local midnight are split between their affected local calendar days, and the trend includes zero-study days through the current day.
- Added Recharts for the daily bar chart and subject distribution chart. Dates and range boundaries follow the same browser-local timezone strategy as History; future-dated session portions are excluded.

## Phase 7: Study streaks

- Added reusable streak business logic that splits completed sessions at browser-local midnight, aggregates daily study time, and compares each day with the per-user `user_settings.streak_minimum_minutes` threshold.
- Added current streak, longest streak, and total study days to Statistics. A non-qualifying current day keeps a qualifying run through yesterday visible until the day ends; future sessions are excluded.
- The week/day boundaries and local timezone interpretation are shared with Statistics. The deployed table default of 30 minutes is used only when a user settings row has not been initialized yet.

## Phase 8: Task management

- Added authenticated `/todos` CRUD using the deployed `todos` schema and RLS policies; no migration was required.
- Tasks support title, optional notes, optional subject association, low/medium/high priority, optional date-only due date, and complete/incomplete state.
- Tasks are loaded alongside only the signed-in user’s subjects. The existing composite ownership foreign key and RLS policies enforce safe subject association and private task access.
- The UI separates pending and completed tasks, validates trimmed titles, shows mutation feedback and human-readable errors, and requires confirmation before deletion.

## Phase 9: User settings

- Added authenticated settings loading and saving through the deployed `user_settings` table and RLS policies; no migration was required.
- Users can update daily study goal minutes, streak minimum minutes, and theme preference. Positive whole-minute validation is enforced before save.
- The Settings page shows loading, save, success, and error states. When a settings row does not exist yet, the app safely uses the database defaults until the first save.
- Theme preference is applied at the app root so the saved setting visibly changes the UI. Statistics reads the saved daily goal so the displayed goal progress reflects the user’s configuration.

## Phase 10: Dashboard integration

- Replaced the dashboard placeholder with a focused overview of today's completed time, saved daily goal/progress, current and longest streak, today's subject totals, recent completed sessions, and pending task count/list.
- It composes the existing statistics/streak, settings, todo, and study-timer hooks. The statistics hook now accepts an initial range and exposes its already-loaded completed sessions, allowing the Dashboard to use the existing today aggregation and recent-session query result without another service query or calculation.
- The active-session panel uses `useStudyTimer`'s timestamp-based live elapsed value and sends users to `/study` to continue. The primary Start Study action, no-subject guidance, independent loading/empty/error states, refresh control, and mobile-first grids are included.
- No schema, RLS, authentication, cache, or new timer implementation was added.
- `npm run lint`, `npm run format:check`, and `npm run build` pass. The local Vite runtime responds successfully; authenticated data-state verification requires an interactive signed-in browser session.

## Phase 11: UI/UX and responsive polish

- Audited the shared layout and all major routes for hierarchy, spacing, control consistency, mobile compression, loading/empty/error feedback, and keyboard accessibility.
- Removed `min-w-80` from `body`, the actual cause of the previous Tasks page overflow at a 320px viewport with a vertical scrollbar. Added targeted `min-w-0`, `break-words`, wrapping action controls, and bounded dialog scrolling so content can shrink naturally instead of being globally clipped.
- Added a consistent `:focus-visible` treatment, a 44px mobile navigation target, a surfaced mobile menu panel, reduced mobile page padding, and responsive card/form protections. Statistics charts now retain readable tick spacing and use safe mobile chart dimensions; History filters and rows handle narrow content cleanly.
- No product, data-model, authentication, timer, statistics, streak, database, or RLS behavior changed. `npm run lint`, `npm run format:check`, and `npm run build` pass; local HTTP smoke checks return 200 for Dashboard, Study, Subjects, Statistics, History, Tasks, Settings, and Login.

## Authentication and protected routes

- Added `AuthProvider`/`useAuth`, which restores the normal persisted Supabase browser session with `getSession()` and follows changes through `onAuthStateChange`.
- Added `/login` with email/password sign-up and sign-in. If Supabase email confirmation is enabled, sign-up instructs the user to confirm their email before signing in.
- All existing application routes are protected. Session detection shows a loading screen; signed-out users are redirected to `/login`, and signed-in users who visit `/login` are redirected to the dashboard.
- Added sign-out controls to the shared application layout. Supabase Auth clears the browser session; route protection then redirects the visitor to `/login`.
- Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are used in browser code. RLS remains responsible for database authorization.

## Implemented

- Vite-based React + TypeScript project setup.
- Supabase browser client configuration and a Phase 3 Subjects page with color-aware CRUD and derived all-time study totals.
- Email/password authentication, persisted session detection, protected routes, and logout.
- Study session start, restoration, live elapsed timer, and stop flow using existing Supabase RLS.
- Study statistics, including local-date aggregation, charts, subject breakdown, and session insights.
- Settings loading and saving, theme application, daily-goal progress, and streak configuration.
- Task create/edit/delete, completion toggling, priority, optional subject association, and calendar-date due dates.
- Tailwind CSS configured through PostCSS.
- React Router routes for Dashboard, Study, Subjects, Statistics, History, Todo, and Settings, all with feature implementations.
- A reusable responsive application layout:
  - Fixed sidebar navigation on large screens.
  - Accessible toggleable navigation on mobile screens.
  - Main content area shared by every route.
- Simple feature-oriented source folder structure.
- ESLint configuration for TypeScript and React hooks.
- Prettier configuration and formatting scripts.
- Production build and lint verification.
- Supabase/PostgreSQL migration with tables, constraints, indexes, generated duration, triggers, and Row Level Security policies.

## Important folders

| Location                   | Purpose                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                 | Application entry composition and route definitions.                                                                                            |
| `src/components/layout/`   | Shared visual shell: brand, desktop sidebar, and mobile navigation.                                                                             |
| `src/components/ui/`       | Reusable generic presentation components. It currently contains the placeholder page component.                                                 |
| `src/features/`            | One folder per app area. Each currently contains only its route page; future feature-specific components, hooks, and services belong beside it. |
| `src/features/dashboard/`  | Dashboard composition of existing study, statistics/streak, settings, and todo feature hooks.                                                   |
| `src/features/study/`      | Study-session service, active-timer hook, types, and Study page UI.                                                                             |
| `src/features/subjects/`   | Subject CRUD service, state hook, form, list, and Subjects page with derived all-time study totals.                                             |
| `src/features/auth/`       | Auth provider, session guard, and email/password login page.                                                                                    |
| `src/features/statistics/` | Statistics service, shared aggregation utilities, hook, types, and Statistics page charts/insights.                                             |
| `src/features/streaks/`    | Reusable streak settings service, pure streak algorithm, and streak types.                                                                      |
| `src/features/history/`    | Completed-session history service, hook, local date/duration utilities, and History page UI.                                                    |
| `src/features/todos/`      | Todo service, state hook, types, and task CRUD/completion page UI.                                                                              |
| `src/features/settings/`   | Settings service, provider, context, and Settings page for daily goal, streak minimum, and theme.                                               |
| `src/index.css`            | Tailwind directives and small global base styles.                                                                                               |
| `supabase/migrations/`     | Versioned PostgreSQL migration files to apply to the Supabase database.                                                                         |

## Dependencies

### Runtime

| Package                 | Purpose                                                             |
| ----------------------- | ------------------------------------------------------------------- |
| `react`                 | Renders the user interface.                                         |
| `react-dom`             | Connects React to the browser DOM.                                  |
| `react-router-dom`      | Provides client-side routes and navigation links.                   |
| `@supabase/supabase-js` | Provides the browser Auth client and RLS-scoped database access.    |
| `recharts`              | Renders the Statistics daily trend and subject distribution charts. |

### Development

| Package                                     | Purpose                                                       |
| ------------------------------------------- | ------------------------------------------------------------- |
| `vite`                                      | Local development server and production bundler.              |
| `typescript`                                | Type checking for safer, clearer code.                        |
| `@vitejs/plugin-react`                      | Lets Vite compile React efficiently.                          |
| `tailwindcss`                               | Utility-first CSS framework used for styling.                 |
| `postcss`, `autoprefixer`                   | Process Tailwind CSS and add browser-compatible CSS prefixes. |
| `eslint`, `@eslint/js`, `typescript-eslint` | Find common JavaScript and TypeScript issues.                 |
| `eslint-plugin-react-hooks`                 | Checks React Hook usage rules.                                |
| `eslint-plugin-react-refresh`               | Supports safe Fast Refresh during development.                |
| `globals`                                   | Supplies browser globals to ESLint.                           |
| `prettier`                                  | Consistent automatic code formatting.                         |
| `@types/*`                                  | Type definitions for React, React DOM, and Node.              |

The browser client uses only the public Supabase URL and publishable key; Row Level Security remains responsible for database authorization.

## Commands

Install dependencies (only needed if `node_modules` is absent):

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will print a local address, normally `http://localhost:5173`.

Check code quality:

```bash
npm run lint
npm run format:check
```

Format code:

```bash
npm run format
```

Create a production build:

```bash
npm run build
```

Preview a completed production build:

```bash
npm run preview
```

## Verification completed

- `npm run lint` passed.
- `npm run format:check` passed.
- `npm run build` passed.

## Next step

Phase 11 is complete. Do not begin a new phase or deployment automatically; choose the next milestone after interactive signed-in browser verification.

## Database layer

The deployed database foundation is defined by `supabase/migrations/20260831120000_initial_schema.sql`, with the additive subject-color migration in `supabase/migrations/20260831213000_add_subject_color.sql`. The application now uses the schema through the authenticated Supabase browser client.

### Tables

| Table            | What it represents                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `subjects`       | A user’s study categories, such as Mathematics or Biology.                                  |
| `study_sessions` | One raw interval of study for one subject. It is the source of truth for future statistics. |
| `todos`          | A user’s tasks, optionally connected to a subject.                                          |
| `user_settings`  | One row per user containing their daily goal, streak threshold, and theme preference.       |

### Columns and data types

- **UUID** (`uuid`) is used for IDs. PostgreSQL creates each primary key with `gen_random_uuid()`, avoiding sequential, guessable IDs.
- **`user_id uuid`** belongs to every user-owned table and references `auth.users(id)`. It identifies the owner and deletes their app data if their auth account is deleted.
- **Text** (`text`) is used for names, titles, descriptions, priorities, and theme because these are flexible text values. Checks reject blank subject names and todo titles.
- **Timestamp with time zone** (`timestamptz`) is used for creation, update, start, and end moments. PostgreSQL stores an absolute point in time, which is important for accurate session duration and later timezone-aware statistics.
- **Date** (`date`) is used for `todos.due_date`: a due date is a calendar day, not a precise moment.
- **Integer** (`integer`) is used for minute thresholds and generated duration seconds because they are whole numbers.
- **Boolean** (`boolean`) is used for `todos.completed`, because the task is simply complete or incomplete.

### Relationships and ownership protection

A study session must have a subject. A todo may have a subject or may be unassigned.

Both `study_sessions` and `todos` use a composite foreign key containing `(user_id, subject_id)`. This is an important safety rule: the database accepts a subject reference only when that subject belongs to the same user as the session or todo. A user therefore cannot create a session or task using another user’s subject ID.

Deleting a subject is **restricted** while a study session references it, preserving historical study records. Deleting a subject clears only `todos.subject_id`; the todo itself remains.

### Generated duration and active sessions

`study_sessions.duration_seconds` is a generated, stored column. PostgreSQL calculates it from `end_time - start_time`; the application cannot write it directly. The timestamps are the source of truth. An unfinished session has a null end time and therefore a null duration.

A check requires a completed session’s end time to be later than its start time. A partial unique index on `user_id` where `end_time is null` guarantees one active session per user, even if multiple browser tabs submit requests simultaneously.

### Indexes

Indexes let PostgreSQL find common data quickly rather than repeatedly reading every row. The migration indexes:

- a user’s subjects via the case-insensitive unique subject-name index;
- sessions by user/time for history and reporting;
- sessions by subject/time for subject totals;
- active sessions by user;
- todos by user/due date; and
- todos by user/completion state.

### Row Level Security (RLS)

RLS is enabled on every table. A signed-in user can select, insert, update, or delete only rows whose `user_id` equals Supabase’s `auth.uid()`. Insert and update policies also check the new row’s owner, so users cannot change ownership while editing. Together with the composite foreign keys, this protects private data and subject relationships at the database level.

### Derived statistics and streaks

The database deliberately stores only raw rows in `study_sessions`. The implemented Statistics and Streak features derive totals, charts, subject totals, and qualifying study days from completed sessions and their generated durations. It does not store duplicate columns such as `today_total`, `week_total`, `month_total`, `year_total`, cached subject totals, or cached streak totals.

### PostgreSQL/Supabase decisions

- `pgcrypto` is enabled to provide `gen_random_uuid()`.
- The `set_updated_at` trigger function automatically refreshes `updated_at` whenever a subject, todo, or settings row changes.
- `on delete cascade` from `auth.users` removes all owned app rows if an account is removed.
- The migration uses `on delete set null (subject_id)` for todos so a deleted subject does not erase a user’s task or its required `user_id`.
