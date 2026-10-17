-- LiftLog schema — run this in the Supabase SQL editor (or via the CLI).
-- Creates the exercises, workouts and sets tables, seeds the exercise
-- catalog, and enables Row Level Security with demo-friendly policies.

-- ---------------------------------------------------------------- exercises
create table if not exists exercises (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  muscle_group text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- workouts
create table if not exists workouts (
  id          uuid primary key default gen_random_uuid(),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  notes       text,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------- sets
create table if not exists sets (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references workouts (id) on delete cascade,
  exercise_id uuid not null references exercises (id) on delete restrict,
  set_number  int not null,
  reps        int not null check (reps > 0),
  weight      numeric not null default 0 check (weight >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists sets_workout_id_idx on sets (workout_id);
create index if not exists sets_exercise_id_idx on sets (exercise_id);

-- ------------------------------------------------------------ seed catalog
insert into exercises (name, muscle_group) values
  ('Bench Press',       'Chest'),
  ('Squat',             'Legs'),
  ('Deadlift',          'Back'),
  ('Overhead Press',    'Shoulders'),
  ('Barbell Row',       'Back'),
  ('Pull-Up',           'Back'),
  ('Dip',               'Triceps'),
  ('Bicep Curl',        'Biceps'),
  ('Tricep Pushdown',   'Triceps'),
  ('Leg Press',         'Legs')
on conflict do nothing;

-- --------------------------------------------------------------------- RLS
-- Demo policies: the anon key can read/write everything. This keeps the demo
-- working without auth. For anything real, replace these with policies that
-- scope rows to auth.uid().
alter table exercises enable row level security;
alter table workouts  enable row level security;
alter table sets      enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'demo: public read exercises') then
    create policy "demo: public read exercises" on exercises for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'demo: public all workouts') then
    create policy "demo: public all workouts" on workouts for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'demo: public all sets') then
    create policy "demo: public all sets" on sets for all using (true) with check (true);
  end if;
end $$;
