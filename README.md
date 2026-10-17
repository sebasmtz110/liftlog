# LiftLog

A simple workout tracker demo — **Next.js (App Router) + Supabase (Postgres) + Vercel**.

Log workouts: pick exercises from a catalog, record sets with reps + weight,
finish the session, then browse history and simple stats. Mobile-first UI
inspired by Apple's Human Interface Guidelines: dark theme, large titles,
native-feeling bottom tab bar, 44pt touch targets.

## Stack

| Layer    | Tech                                   |
|----------|----------------------------------------|
| Frontend | Next.js 16 (App Router), React 19      |
| Database | Supabase Postgres (`@supabase/supabase-js`) |
| Hosting  | Vercel                                 |
| Source   | GitHub                                 |

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → **New project**. Once it's ready,
open **Project Settings → API** and copy:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Run the schema

In Supabase, open the **SQL Editor**, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the
`exercises`, `workouts`, and `sets` tables, seeds 10 common exercises, and
enables Row Level Security with demo-friendly policies (public read/write —
fine for a demo, replace with `auth.uid()`-scoped policies for anything real).

### 3. Set environment variables in Vercel

Import this repo in Vercel and add both variables under
**Project → Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Deploy

Push to `main` (or hit **Redeploy**) — Vercel builds with `npm run build`
and the app is live. No `vercel.json` needed; defaults work.

### Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

## Database

```
exercises: id (uuid), name, muscle_group
workouts:  id (uuid), started_at, ended_at (nullable), notes (nullable)
sets:      id (uuid), workout_id → workouts, exercise_id → exercises,
           set_number, reps, weight
```

## Screens

- **Home** — Start workout button (+ resume banner), recent workouts list
- **Workout** — add exercises from a searchable sheet (with 3D animation
  previews), log sets (reps + weight), delete/renumber sets, finish or discard
- **Exercises** — the full exercise library: browse with animation previews
  (tap for a larger demo), add your own exercises, edit, and delete unused ones
- **History** — past workouts with expandable per-exercise set details
- **Stats** — total workouts, total sets, sets + volume this week

## Exercise animations

36 V7 3D animation clips live in `public/fitness-animations/mobile/`
(served from this repo, never hotlinked — filenames must stay unchanged).
The exercise-name → clip mapping is in `lib/exerciseDemos.js`. Exercises
without a clip (Bench Press, Dip, and any custom exercises you add) simply
show no preview — never a broken video element. The player follows the same
behavior as the reference app: autoplay muted loop playsinline, paused for
reduced-motion users, hidden on load error, paused when hidden.

## Migration: exercises write access

The first version of `supabase/schema.sql` created the `exercises` table as
SELECT-only. The current schema creates it with full read/write demo access.
If you already ran the old schema, run
[`supabase/migration_exercises_write.sql`](supabase/migration_exercises_write.sql)
**once** in the Supabase SQL editor — it drops the old read-only policy and
creates the read/write one. Fresh installs don't need it.
