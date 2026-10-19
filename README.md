# LiftLog

Mobile workout tracker. The interface matches `Sebas-Training.html`: black, white, and one red accent. Accounts, the onboarding quiz, and saved workouts live in Supabase.

## Run it

```bash
npm install
npm run dev -- --port 43123
```

Open `http://127.0.0.1:43123`.

Set these environment variables (never commit them, never use the service role key in the app):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Without them the screens still render and a banner explains what to add. With them, email signup opens a session immediately when confirm-email is off.

## What you can do

- Sign in, take the skippable quiz, and save one of four splits.
- Home shows your name, today's workout, the week, and recent sessions.
- Workouts is your split, with Start, Edit, and new templates.
- Library is the 24 exercises from the design file, with photos in `public/assets`.
- Progress is volume, personal records, body weight, and photos that stay on this device.
- History lists finished workouts.

Profile and progress photos are stored in IndexedDB. They are not uploaded.

## Motion

The active set and the movement screen expose `data-muse-slot="exercise-motion"`. Assign `window.ALDER_MOTION_MOUNT` to mount into that element. Until then, the still photo stays.
