-- LiftLog migration: training splits + planned workouts + profiles.
--
-- Run this ONCE in the Supabase SQL editor AFTER migration_auth.sql.
-- Adds four tables (plus a small profiles table):
--   profiles            - display name, weekly goal, onboarding flag (one row per user)
--   splits              - the user's active training split (one per user)
--   split_days          - the 7 day rows of a split (Mon..Sun), rest or training
--   workout_templates   - planned workouts attached to split days (or standalone)
--   template_exercises  - exercises + set schemes inside a template
--
-- All tables are Row Level Security scoped to the owning user.

-- ------------------------------------------------------------- profiles
create table if not exists profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text,
  weekly_goal    int not null default 4 check (weekly_goal between 1 and 7),
  onboarding_done boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table profiles enable row level security;
drop policy if exists "users own profile" on profiles;
create policy "users own profile" on profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- --------------------------------------------------------------- splits
create table if not exists splits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  days_per_week int not null check (days_per_week between 1 and 7),
  created_at    timestamptz not null default now()
);
alter table splits enable row level security;
drop policy if exists "users own splits" on splits;
create policy "users own splits" on splits for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists splits_user_id_idx on splits (user_id);

-- ------------------------------------------------------------ split_days
create table if not exists split_days (
  id             uuid primary key default gen_random_uuid(),
  split_id       uuid not null references splits (id) on delete cascade,
  day_index      int not null check (day_index between 0 and 6), -- 0 = Monday
  label          text not null,          -- "Push", "Legs", "Rest"
  muscle_targets text not null default '', -- "Chest · Shoulders · Triceps"
  is_rest        boolean not null default false
);
alter table split_days enable row level security;
drop policy if exists "users own split_days" on split_days;
create policy "users own split_days" on split_days for all
  using (exists (select 1 from splits s where s.id = split_days.split_id and s.user_id = auth.uid()))
  with check (exists (select 1 from splits s where s.id = split_days.split_id and s.user_id = auth.uid()));
create index if not exists split_days_split_id_idx on split_days (split_id);

-- ----------------------------------------------------- workout_templates
create table if not exists workout_templates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  split_day_id uuid references split_days (id) on delete cascade,
  name         text not null,
  est_minutes  int,
  created_at   timestamptz not null default now()
);
alter table workout_templates enable row level security;
drop policy if exists "users own workout_templates" on workout_templates;
create policy "users own workout_templates" on workout_templates for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists workout_templates_user_id_idx on workout_templates (user_id);

-- ----------------------------------------------------- template_exercises
create table if not exists template_exercises (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references workout_templates (id) on delete cascade,
  exercise_id uuid not null references exercises (id) on delete restrict,
  set_scheme  text not null default '', -- "3x8-12"
  sort_order  int not null default 0
);
alter table template_exercises enable row level security;
drop policy if exists "users own template_exercises" on template_exercises;
create policy "users own template_exercises" on template_exercises for all
  using (exists (select 1 from workout_templates t where t.id = template_exercises.template_id and t.user_id = auth.uid()))
  with check (exists (select 1 from workout_templates t where t.id = template_exercises.template_id and t.user_id = auth.uid()));
create index if not exists template_exercises_template_id_idx on template_exercises (template_id);

-- --------------------------------- workouts: optional link to the template used
alter table workouts add column if not exists template_id uuid references workout_templates (id) on delete set null;
