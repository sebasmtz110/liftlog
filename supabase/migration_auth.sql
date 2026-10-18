-- LiftLog migration: per-user auth + row ownership.
--
-- Run this ONCE in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- What it does, in order:
--   1. Wipes the demo test data (workouts + sets). The 10 pre-made exercises stay.
--   2. Adds a user_id "owner" column to workouts, linked to Supabase Auth users.
--   3. Replaces the demo "public all" policies with per-user Row Level Security:
--        - workouts: you can only see/touch your own rows
--        - sets:     you can only see/touch sets that belong to your workouts
--        - exercises: shared catalog, visible/editable to any signed-in user
--
-- After running this, the app's login screen (shipped in the matching code
-- update) is what stands between a user and the data.

-- ------------------------------------------------------- 1. wipe test data
delete from sets;
delete from workouts;

-- ------------------------------------------------------- 2. owner column
alter table workouts
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- The table is empty after the wipe above, so NOT NULL is safe and guarantees
-- every future workout has an owner.
alter table workouts alter column user_id set not null;

create index if not exists workouts_user_id_idx on workouts (user_id);

-- ------------------------------------------------------- 3. drop demo policies
drop policy if exists "demo: public all exercises" on exercises;
drop policy if exists "demo: public read exercises" on exercises;
drop policy if exists "demo: public all workouts"  on workouts;
drop policy if exists "demo: public all sets"      on sets;

-- ------------------------------------------------------- 4. per-user policies
-- workouts: owners only, for every operation.
drop policy if exists "users own workouts" on workouts;
create policy "users own workouts" on workouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- sets: ownership flows through the parent workout.
drop policy if exists "users own sets" on sets;
create policy "users own sets" on sets for all
  using (
    exists (
      select 1 from workouts w
      where w.id = sets.workout_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workouts w
      where w.id = sets.workout_id
        and w.user_id = auth.uid()
    )
  );

-- exercises: one shared catalog for every signed-in user.
drop policy if exists "authenticated read exercises"   on exercises;
drop policy if exists "authenticated insert exercises" on exercises;
drop policy if exists "authenticated update exercises" on exercises;
drop policy if exists "authenticated delete exercises" on exercises;
create policy "authenticated read exercises" on exercises
  for select using (auth.role() = 'authenticated');
create policy "authenticated insert exercises" on exercises
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated update exercises" on exercises
  for update using (auth.role() = 'authenticated');
create policy "authenticated delete exercises" on exercises
  for delete using (auth.role() = 'authenticated');
