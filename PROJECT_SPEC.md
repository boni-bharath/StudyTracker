# Study Tracker — Project Specification

## 1. Purpose and scope

Study Tracker is a personal web app for recording focused study sessions, managing subjects and related tasks, and understanding study habits over time. It is deliberately small and feature-oriented so it stays approachable for a beginner.

**Core design rule:** individual, raw study sessions are the source of truth. Dashboard totals, charts, period statistics, and streaks are calculated from completed sessions; daily/weekly/monthly/yearly totals are not stored separately.

| Area       | Choice             | Purpose                                           |
| ---------- | ------------------ | ------------------------------------------------- |
| Frontend   | React + TypeScript | Pages, components, and app logic                  |
| Styling    | Tailwind CSS       | Responsive UI                                     |
| Backend    | Supabase           | Authentication, API client, and hosted PostgreSQL |
| Database   | PostgreSQL         | Persistent data and data integrity rules          |
| Charts     | Recharts           | Trends and subject breakdowns                     |
| Deployment | Vercel             | Hosts the React frontend                          |

### Assumptions

- This is personal but uses Supabase Auth and data ownership from day one, so it is secure and can support sign-in.
- The app uses browser-local dates and weeks for reporting, and the saved settings cover study goals, streak threshold, and theme preference.
- Every study session belongs to exactly one subject.

## 2. Requirements analysis

The app has six connected domains:

1. **Timer:** create and stop one active session. The display timer is visual only; duration comes from timestamps.
2. **Subjects:** organize sessions and tasks, while protecting historical session data.
3. **Statistics:** derive time-range totals, history, and chart data from raw completed sessions.
4. **Streaks:** group study time by local calendar day and apply a configurable qualifying threshold.
5. **Todos:** keep optional subject-linked tasks with priority, due date, and completion state.
6. **Dashboard/settings:** show the key derived metrics and save the small set of user preferences.

## 3. Entities

| Entity        | Purpose                                            | Relationships                                       |
| ------------- | -------------------------------------------------- | --------------------------------------------------- |
| User          | Authenticated owner of private data                | Has one profile; owns subjects, sessions, and todos |
| User settings | Daily goal, streak threshold, and theme preference | One-to-one with user                                |
| Subject       | Category such as Mathematics                       | Has many sessions and optional tasks                |
| Study session | One time interval for one subject                  | Belongs to one user and one subject                 |
| Todo          | A study task                                       | Belongs to one user and optionally one subject      |

There is intentionally no statistics, daily-total, or streak table.

## 4. Database schema

### Common conventions

- Use generated UUID primary keys.
- Reference `auth.users(id)` for ownership.
- Store moments as `timestamptz` in UTC.
- Use `date` for task due dates because they are calendar days, not moments.
- Maintain `updated_at` with a small database trigger.

### `user_settings`

| Column                   | Type        | Rules                                             |
| ------------------------ | ----------- | ------------------------------------------------- |
| `id`                     | uuid        | PK; references `auth.users(id)` on delete cascade |
| `daily_goal_minutes`     | integer     | Required, default 120, >= 1                       |
| `streak_minimum_minutes` | integer     | Required, default 30, >= 1                        |
| `theme`                  | text        | Required, default `system`; light/dark/system     |
| `created_at`             | timestamptz | Required, default now()                           |
| `updated_at`             | timestamptz | Required, default now()                           |

Create this record automatically at sign-up, or upsert it at first settings save.

### `subjects`

| Column       | Type        | Rules                                                   |
| ------------ | ----------- | ------------------------------------------------------- |
| `id`         | uuid        | PK                                                      |
| `user_id`    | uuid        | Required; FK to auth user, cascade delete               |
| `name`       | text        | Required, trimmed, unique per user case-insensitively   |
| `color`      | text        | Required, default `#6366F1`; client validates hex color |
| `created_at` | timestamptz | Required, default now()                                 |
| `updated_at` | timestamptz | Required, default now()                                 |

Recommended index: unique `(user_id, lower(name))`.

### `study_sessions`

| Column       | Type        | Rules                                     |
| ------------ | ----------- | ----------------------------------------- |
| `id`         | uuid        | PK                                        |
| `user_id`    | uuid        | Required; FK to auth user, cascade delete |
| `subject_id` | uuid        | Required; FK to subjects, restrict delete |
| `started_at` | timestamptz | Required; UTC start moment                |
| `ended_at`   | timestamptz | Nullable while active; UTC end moment     |
| `created_at` | timestamptz | Required, default now()                   |
| `updated_at` | timestamptz | Required, default now()                   |

Rules and indexes:

- A completed session must have `ended_at > started_at`.
- Duration is calculated as `ended_at - started_at`; do **not** persist a duration column.
- An active session has `ended_at IS NULL`.
- A partial unique index on `user_id` where `ended_at IS NULL` guarantees only one active session, including across tabs/devices.
- Add `(user_id, started_at DESC)` for history and statistics.

### `todos`

| Column         | Type        | Rules                                          |
| -------------- | ----------- | ---------------------------------------------- |
| `id`           | uuid        | PK                                             |
| `user_id`      | uuid        | Required; FK to auth user, cascade delete      |
| `subject_id`   | uuid        | Nullable; FK to subjects, set null on deletion |
| `title`        | text        | Required, trimmed, non-empty                   |
| `notes`        | text        | Nullable                                       |
| `priority`     | text        | Required, default medium; low/medium/high      |
| `due_date`     | date        | Nullable                                       |
| `completed_at` | timestamptz | Nullable; non-null means complete              |
| `created_at`   | timestamptz | Required, default now()                        |
| `updated_at`   | timestamptz | Required, default now()                        |

Recommended indexes: `(user_id, completed_at, due_date)` and `(user_id, subject_id)`.

### Referential integrity and security

- A subject referenced by a study session cannot be deleted. Explain this in the UI and offer editing instead.
- A deleted subject’s tasks remain, with their `subject_id` cleared.
- Enable Supabase Row Level Security on every table. Users can only select, insert, update, and delete rows they own. Insert policies must verify the claimed owner is `auth.uid()`.

## 5. Application architecture

Use a feature-oriented frontend without a global state library at first.

1. **Pages** compose full routes.
2. **Feature components** provide timer, subjects, tasks, charts, and settings UI.
3. **Hooks** encapsulate data loading, mutations, active-session behavior, and derived calculations.
4. **Services** contain all Supabase queries. Components should not contain raw database calls.
5. **Utilities/types** contain pure time, timezone, and duration logic plus shared TypeScript types.

Use React state for short-lived UI state and hooks for server-backed state. Show explicit loading, empty, and error states. If caching becomes difficult later, add TanStack Query deliberately rather than starting with it.

### Routes

- `/` — Dashboard
- `/timer` — Study timer
- `/subjects` — Subject management and totals
- `/statistics` — Periods, history, and charts
- `/todos` — Task management
- `/settings` — Goal, streak minimum, theme
- `/login` — Email/password authentication

## 6. Folder structure

```text
src/
  app/
    App.tsx
    routes.tsx
    providers.tsx
  components/
    ui/                 # Button, Card, Modal, Input, EmptyState
    layout/             # App shell, navigation, page header
  features/
    auth/
    dashboard/
    sessions/
      components/       # StudyTimer, SubjectSelector, ActiveSession
      session.service.ts
      session.types.ts
      useActiveSession.ts
    subjects/
    statistics/
      components/       # TrendChart, SubjectChart, HistoryTable
      statistics.service.ts
      statistics.utils.ts
    streaks/
      streak.utils.ts
    todos/
    settings/
  lib/
    supabase.ts
    date.ts
    duration.ts
  types/
    database.ts
    domain.ts
  index.css
  main.tsx
supabase/
  migrations/           # Schema, indexes, triggers, RLS
  seed.sql              # Optional development data
```

Keep a feature’s components, hooks, service, and feature-specific types together. Move code to common folders only when genuinely shared.

## 7. Data flow

### Start and stop flow

```text
Selected subject
      ↓
Start → insert session { subject_id, started_at, ended_at: null }
      ↓
Database active-session index accepts or rejects the request
      ↓
Load active row → display now - started_at
      ↓
Stop → update that row with ended_at = current timestamp
      ↓
Re-query completed sessions → derive dashboard/statistics from timestamps
```

The browser counter never becomes stored truth. On refresh, another device, or after browser sleep, the app reloads the active row and calculates elapsed time from `started_at`.

### Dashboard and statistics flow

1. Query completed sessions for the selected reporting range, joined with subject name and color.
2. Convert UTC timestamps to the browser's local timezone.
3. Derive each duration from start/end timestamps.
4. Split sessions across local midnight where necessary, then group by local day and subject.
5. Render totals, history, goal progress, and Recharts data from those groups.

For a personal app, client-side grouping is easiest to understand and sufficient. If the data grows substantially, move only the grouping to a PostgreSQL view or Supabase RPC; raw sessions remain authoritative.

### Streak algorithm

1. Load completed sessions needed for the user’s history.
2. Split/group their derived durations by local calendar day.
3. A day qualifies when its total reaches `streak_minimum_minutes`.
4. `total_study_days` is the count of dates with any study time.
5. `current_streak` counts consecutive qualifying dates ending today; if today has not qualified yet, continue counting backward from yesterday so a streak does not vanish early in the day.
6. `longest_streak` is the greatest run of qualifying dates in history.

## 8. Feature behavior

### Dashboard

Show:

- Today’s study duration (optionally including the live active session).
- Daily goal progress: today’s minutes / `daily_goal_minutes`.
- Current streak.
- Today’s subject breakdown.
- Today’s incomplete tasks, ordered by priority and due date.
- A Start Study action that opens the timer and requires subject selection.

### Subjects

- Create subject with a name and color.
- Edit name/color.
- Show derived all-time study time per subject.
- Delete only subjects with no study sessions.

### Statistics

- Presets: today, current week, current month, current year.
- Selected-period subject totals.
- Study history: subject, local start/end, derived duration.
- Recharts daily trend plus subject distribution chart.
- Define week start once (recommended: Monday) and use it everywhere.

### Todos

- Create, edit, delete, and mark complete/incomplete.
- Optionally associate a subject.
- Support low, medium, and high priority.
- Support optional local-date due dates.
- Keep completed tasks available through a filter/section.

### Settings

- Validate positive whole minutes for goal and streak threshold.
- Persist/apply theme at app root.

## 9. Edge cases

| Situation                   | Handling                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| No selected subject         | Disable Start and state that one subject is required.                                             |
| Double Start / two tabs     | Database unique partial index rejects duplicates; reload existing active session.                 |
| Refresh while studying      | Retrieve active row and recompute elapsed time.                                                   |
| Sleeping browser tab        | Recompute from timestamps on wake; never increment persisted seconds.                             |
| Stop retry/failure          | Keep active UI until successful update; treat an already-stopped row as a safe completed outcome. |
| Session crosses midnight    | Split duration across each affected local date for daily totals and streaks.                      |
| Timezone/DST transition     | Store UTC, convert with IANA timezone, and split at local midnight.                               |
| Zero/negative duration      | Reject through a database check and client validation.                                            |
| Delete subject with history | Block deletion rather than orphaning sessions.                                                    |
| Delete subject with tasks   | Keep tasks and clear their subject link.                                                          |
| New account/no sessions     | Present empty states and zero totals/streaks.                                                     |
| Today below threshold       | Preserve yesterday’s current streak until today ends.                                             |
| Task due date timezone      | Store it as `date`, not timestamp.                                                                |

## 10. Recommended implementation order

1. Create Supabase project, Auth, migrations, RLS policies, and generated database types.
2. Build shell, routing, authentication guard, and profile/settings initialization.
3. Build subjects and the server-backed timer, including the active-session database constraint.
4. Build dashboard with live today/goal/task data.
5. Build todo CRUD.
6. Add statistics aggregation, history, and Recharts charts.
7. Add streak calculation, date/streak unit tests, polished empty/error states, and Vercel deployment.

## 11. Acceptance criteria

- A study session cannot start without exactly one subject.
- PostgreSQL guarantees no more than one active session per user.
- Stop saves an end timestamp, and every duration is timestamp-derived.
- All data is private through RLS ownership policies.
- Statistics are derived from completed raw sessions, without duplicated period totals.
- Streaks honor the configurable threshold and browser-local day boundaries.
- Dashboard includes today’s time, goal, streak, subject breakdown, today’s tasks, and Start Study.

## 12. Current implementation status

### Completed (initial frontend foundation)

- React + TypeScript + Vite project configured.
- Tailwind CSS, React Router, ESLint, and Prettier configured.
- Responsive shared layout implemented with a desktop sidebar, mobile navigation toggle, and shared page content area.
- Placeholder routes/pages created for Dashboard, Study, Subjects, Statistics, History, Todo, and Settings.
- Project passes `npm run lint` and `npm run build`.

### Explicitly deferred

- Applying the migration to a connected Supabase project, generated database types, and client-side data access.
- Subject, todo, settings, statistics, history, chart, and streak feature implementation.

See `implementation.md` for the implemented folders, dependencies, commands, and verification details.

### Completed (database foundation)

- Added `supabase/migrations/20260831120000_initial_schema.sql` with `subjects`, `study_sessions`, `todos`, and `user_settings`.
- Added UUID primary keys, ownership foreign keys, composite subject-ownership foreign keys, validation constraints, timestamps, indexes, and `updated_at` triggers.
- Added a PostgreSQL-generated `duration_seconds` column. It is derived solely from `start_time` and `end_time`.
- Added database-enforced single-active-session and Supabase Row Level Security policies.
- No cached statistics or totals were added.

### Completed (Phase 3: Subject Management)

- Added an additive migration, `20260831213000_add_subject_color.sql`, that gives `subjects` a required hex color with a safe `#6366F1` default for existing rows.
- Implemented subject name/color CRUD through the Supabase client, with client validation and database/RLS ownership enforcement.
- The Subjects page displays a color swatch and derives all-time study time from completed raw `study_sessions`; it does not store totals on subjects.
- Live browser verification remains deferred until the public browser environment variables are configured and a real Supabase user signs in.

### Completed (minimal authentication)

- Added email/password sign-up, sign-in, logout, persisted session detection, and a session loading state through Supabase Auth.
- Added protected application routes that redirect unauthenticated visitors to `/login` and redirect authenticated visitors away from `/login` to the dashboard.
- Browser code uses only the public Supabase URL and publishable key. Supabase RLS remains the database authorization layer.

### Completed (Phase 4: Study Timer)

- Implemented the authenticated `/study` timer using the existing `study_sessions` schema, RLS policies, and one-active-session database constraint; no migration was required.
- Starting inserts a timestamped active session. The live display derives elapsed time from `start_time` and the current time without repeated database writes.
- The timer restores an active session after refresh. Stopping sets only `end_time` and displays a timestamp-derived completed duration.

### Completed (Phase 5: Study History)

- Added an authenticated History page for completed sessions, using a single RLS-scoped `study_sessions` query joined to subject name and color and sorted newest first.
- Added simple subject and browser-local-date filters without extra database requests. Durations use the existing generated `duration_seconds` value.
- History displays subject color/name, local study date, local start/end times, and readable duration. It intentionally does not edit or delete sessions.
- The history query uses the deployed composite session-to-subject foreign-key relationship explicitly, preserving RLS for both tables.

### Completed (Phase 6: Study Statistics)

- Added an authenticated Statistics page that derives totals, session insights, daily trend data, and subject breakdowns from one RLS-scoped completed-session query. No cached totals or schema changes were added.
- Added local-calendar today, Monday-start week, month, year, and all-time totals. Daily aggregation splits sessions at browser-local midnight and includes zero-study days for the selected range.
- Added Recharts daily trend and subject distribution charts, along with subject totals and completed-session count, average duration, and longest duration.

### Completed (Phase 7: Study Streaks)

- Added reusable streak calculations based on completed session time split across browser-local calendar days and compared against `user_settings.streak_minimum_minutes`.
- Added current streak, longest streak, and total study days to the Statistics page. Current streak counts backward from yesterday when today has not yet reached its threshold.
- Future sessions are excluded; multiple sessions on one local day are combined. The existing `user_settings` default is used if a settings row does not yet exist.

### Completed (Phase 8: Task Management)

- Added authenticated task CRUD using the existing `todos` schema and RLS policies; no migration or redundant data model was added.
- Tasks support optional user-owned subject association, low/medium/high priority, optional date-only due dates, notes, and complete/incomplete state.
- Added pending/completed task sections, title validation, human-readable mutation feedback, and deletion confirmation.

### Completed (Phase 9: User Settings)

- Added authenticated settings loading and saving for daily goal minutes, streak minimum minutes, and theme preference through the existing `user_settings` table and RLS policies.
- Added a Settings page with loading, validation, save, and success/error feedback.
- Applied the saved theme preference at the app root and used the saved daily goal in the statistics goal-progress calculation.

### Completed (Phase 10: Dashboard Integration)

- Replaced the Dashboard placeholder with an at-a-glance authenticated view of today's completed study time, saved daily goal and progress, current and longest streak, subject breakdown, recent completed sessions, and pending tasks.
- The Dashboard reuses the existing Statistics/Streak derivations, Settings context, Todo hook, and Study Timer hook. It introduces no cached totals, duplicate session/todo queries, database migration, RLS change, or second timer implementation.
- An active session shows its existing live elapsed display and subject with a Continue Study action. Without one, the primary action opens the Study page; users without subjects are guided to Subjects.
- Loading, empty, error, refresh, and responsive layouts are handled for the independent dashboard data areas.

### Completed (Phase 11: UI/UX and Responsive Polish)

- Audited Dashboard, Study, Subjects, Statistics, History, Tasks, Settings, Login, shared navigation, cards, forms, and loading/empty/error states for responsive and accessibility issues.
- Removed the global `body` minimum width that caused horizontal scrolling on the Tasks page at narrow viewport widths. The task content now uses min-width and word-wrapping safeguards, while action groups and confirmation dialogs wrap or scroll within their own bounds when needed; no global overflow hiding was added.
- Added a consistent keyboard-visible focus ring, larger mobile navigation touch target, contained mobile navigation panel, more compact small-screen page spacing, and responsive card/form safeguards.
- Tuned History filters and session rows for narrow widths, and improved Statistics chart/filter readability with responsive height, non-cropping margins, preserved tick spacing, and accessible chart labels.

### Completed (Phase 12: Final Acceptance Testing)

- Added `FINAL_TEST_REPORT.md` containing the static validation, security/code-quality audit, explicit results, issue severities, limitations, and recommended follow-up testing.
- Linting, formatting, and production build validation passed. A real Supabase disposable-account sign-up was attempted; email confirmation prevented a session from being issued, so authenticated browser, RLS-record, concurrency, cross-feature, and responsive-viewport checks are documented as blocked rather than claimed as passing.
- No application feature, schema, migration, RLS policy, deployment, or PWA behavior was changed in this phase.

### Completed (Phase 14: Production deployment preparation)

- Added Vercel SPA routing configuration so direct requests for React client routes serve `index.html` and remain available to `BrowserRouter`.
- Added a compatibility redirect from `/todo` to the existing canonical `/todos` route.
- Added a documented Vercel deployment procedure, public environment-variable requirements, Supabase Auth URL Configuration steps, and an explicit production smoke-test checklist in `DEPLOYMENT.md`.
- The application has been prepared for deployment but has not been deployed from this workspace. A real production URL and authenticated production verification remain required before declaring deployment successful.
- No database schema or RLS changes, PWA work, service-role keys, or production credentials were added.

### Still deferred

- Generating TypeScript database types and live browser verification with configured public browser environment variables.
