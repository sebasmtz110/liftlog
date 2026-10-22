# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Sebas uses LiftLog as a personal training log at the gym: follow a weekly split, log sets, and look at progress. No other audience is in scope.

## Product Purpose

LiftLog is Sebas's workout log. It exists so a gym session has a split to follow, a place to record each set, and a way to see progress afterward. Success is using it for that session.

## Positioning

Open. No mechanism or claim is confirmed as something a neighboring tracker could not copy. Do not invent one.

## Operating Context

Used at the gym, in a phone-sized website that can be installed. A skippable quiz can recommend a weekly split from the presets in `lib/presets.js`. A session records weight and reps per set, then a rest timer. Home shows the day, the week, and recent sessions. History lists finished workouts. Progress includes volume, personal records, and body weight.

## Capabilities and Constraints

Current surfaces: Home, Workouts, Library, Progress, History, Profile, Settings, Help, a session logger, and an in-app coach.

Durable rules:

- Sets are stored in pounds. Kilograms stays unavailable until an explicit decision.
- The Health screen (sleep, heart-rate variability, resting heart rate) stays limited to one account, currently `sebasmtz110@gmail.com`.
- Accounts, splits, and workouts live in Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). The app still opens without those keys, and a banner explains what to add. The service role key is never used in the app.

Not committed:

- Profile and progress photos currently stay in this browser and are not uploaded. That storage choice is not a rule.
- What distinguishes LiftLog from a generic set tracker is undecided.
- The session screen can mount live movement through `window.ALDER_MOTION_MOUNT`. That hook is not a product claim.
- The coach answers from local rules in `lib/coach.js`. That is not a product claim.

## Brand Commitments

The product name is LiftLog. No voice or identity rules were set.

## Evidence on Hand

- Workout schema and exercise seed in `supabase/schema.sql`, plus later SQL migrations.
- Split presets in `lib/presets.js`.
- Exercise photos under `public/assets`.

No testimonials, press, pricing, benchmarks, or other users exist. Do not fabricate them.

## Product Principles

- One person's gym log. The job is the session, not growth of an audience.
- Follow the split, log the set, then look at progress.
- Pounds stay the unit until changing that is an explicit decision.
- Health data stays on one account.
- A missing Supabase config must leave the app open and say what to add.
