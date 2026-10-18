-- LiftLog: body-weight log (one row per weigh-in, per user).
-- Run AFTER migration_split.sql. Safe to re-run.
create table if not exists public.body_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weight_lb numeric not null check (weight_lb > 0 and weight_lb < 1500),
  logged_at timestamptz not null default now()
);

alter table public.body_weights enable row level security;

drop policy if exists "owner all body_weights" on public.body_weights;
create policy "owner all body_weights" on public.body_weights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists body_weights_user_idx
  on public.body_weights(user_id, logged_at desc);
