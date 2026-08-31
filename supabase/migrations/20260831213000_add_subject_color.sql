-- Subject colors are used for subject identification and future charts.
-- The default makes this migration safe for subjects that already exist.
alter table public.subjects
  add column color text not null default '#6366F1',
  add constraint subjects_color_hex
    check (color ~ '^#[0-9A-Fa-f]{6}$');
