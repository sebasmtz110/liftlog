-- LiftLog migration: allow writing to the exercises table.
--
-- Run this ONCE in the Supabase SQL editor if you already ran the original
-- supabase/schema.sql (which created exercises as SELECT-only). It swaps the
-- read-only demo policy for a full read/write demo policy so the Exercises
-- tab can add, edit, and delete exercises.
--
-- Fresh installs don't need this: the current schema.sql already creates
-- the "demo: public all exercises" policy.

drop policy if exists "demo: public read exercises" on exercises;
create policy "demo: public all exercises" on exercises for all using (true) with check (true);
