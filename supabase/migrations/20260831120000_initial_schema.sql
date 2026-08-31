-- Study Tracker initial Supabase schema.
-- Raw study_sessions are the source of truth for all statistics.
-- No cached daily, weekly, monthly, yearly, subject, or streak totals are stored.
 
create extension if not exists pgcrypto;
 
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
 
  constraint subjects_name_not_blank check (btrim(name) <> '')
);
 
-- This also supports looking up a user's subjects, while preventing
-- case-insensitive duplicates such as "Math" and "math".
create unique index subjects_user_id_lower_name_key
  on public.subjects (user_id, lower(name));
 
-- Required by the composite foreign keys below. It makes the pair of a
-- subject ID and its owner unique, allowing PostgreSQL to verify ownership.
alter table public.subjects
  add constraint subjects_user_id_id_key unique (user_id, id);
 
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null,
  start_time timestamptz not null,
  end_time timestamptz,
  duration_seconds integer generated always as (
    case
      when end_time is null then null
      else extract(epoch from (end_time - start_time))::integer
    end
  ) stored,
  created_at timestamptz not null default now(),
 
  constraint study_sessions_end_after_start
    check (end_time is null or end_time > start_time),
  constraint study_sessions_duration_not_negative
    check (duration_seconds is null or duration_seconds >= 0),
  constraint study_sessions_subject_belongs_to_user
    foreign key (user_id, subject_id)
    references public.subjects (user_id, id)
    on delete restrict
);
 
create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  subject_id uuid,
  priority text not null default 'medium',
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
 
  constraint todos_title_not_blank check (btrim(title) <> ''),
  constraint todos_priority_valid check (priority in ('low', 'medium', 'high')),
  constraint todos_subject_belongs_to_user
    foreign key (user_id, subject_id)
    references public.subjects (user_id, id)
    on delete set null (subject_id)
);
 
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_goal_minutes integer not null default 120,
  streak_minimum_minutes integer not null default 30,
  theme text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
 
  constraint user_settings_daily_goal_positive check (daily_goal_minutes > 0),
  constraint user_settings_streak_minimum_positive
    check (streak_minimum_minutes > 0),
  constraint user_settings_theme_valid check (theme in ('light', 'dark', 'system'))
);
 
-- Supports session history, range totals, per-subject totals, and active-session
-- lookup without scanning the entire sessions table.
create index study_sessions_user_id_start_time_idx
  on public.study_sessions (user_id, start_time desc);
 
create index study_sessions_subject_id_start_time_idx
  on public.study_sessions (subject_id, start_time desc);
 
-- This index is also a database-level rule: a user can have at most one active
-- session (a row with no end time), including when two browser tabs race.
create unique index study_sessions_one_active_per_user_key
  on public.study_sessions (user_id)
  where end_time is null;
 
create index todos_user_id_due_date_idx
  on public.todos (user_id, due_date);
 
create index todos_user_id_completed_idx
  on public.todos (user_id, completed);
 
-- Reusable trigger function for tables that expose updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
 
create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();
 
create trigger todos_set_updated_at
before update on public.todos
for each row execute function public.set_updated_at();
 
create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();
 
alter table public.subjects enable row level security;
alter table public.study_sessions enable row level security;
alter table public.todos enable row level security;
alter table public.user_settings enable row level security;
 
create policy "Users can view their own subjects"
  on public.subjects for select
  using ((select auth.uid()) = user_id);
 
create policy "Users can create their own subjects"
  on public.subjects for insert
  with check ((select auth.uid()) = user_id);
 
create policy "Users can update their own subjects"
  on public.subjects for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
 
create policy "Users can delete their own subjects"
  on public.subjects for delete
  using ((select auth.uid()) = user_id);
 
create policy "Users can view their own study sessions"
  on public.study_sessions for select
  using ((select auth.uid()) = user_id);
 
create policy "Users can create their own study sessions"
  on public.study_sessions for insert
  with check ((select auth.uid()) = user_id);
 
create policy "Users can update their own study sessions"
  on public.study_sessions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
 
create policy "Users can delete their own study sessions"
  on public.study_sessions for delete
  using ((select auth.uid()) = user_id);
 
create policy "Users can view their own todos"
  on public.todos for select
  using ((select auth.uid()) = user_id);
 
create policy "Users can create their own todos"
  on public.todos for insert
  with check ((select auth.uid()) = user_id);
 
create policy "Users can update their own todos"
  on public.todos for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
 
create policy "Users can delete their own todos"
  on public.todos for delete
  using ((select auth.uid()) = user_id);
 
create policy "Users can view their own settings"
  on public.user_settings for select
  using ((select auth.uid()) = user_id);
 
create policy "Users can create their own settings"
  on public.user_settings for insert
  with check ((select auth.uid()) = user_id);
 
create policy "Users can update their own settings"
  on public.user_settings for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
 
create policy "Users can delete their own settings"
  on public.user_settings for delete
  using ((select auth.uid()) = user_id);
 
