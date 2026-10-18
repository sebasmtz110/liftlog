import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False when env vars are missing — the UI shows a setup banner instead of crashing. */
export const isConfigured = Boolean(url && anonKey);

export const supabase = isConfigured ? createClient(url, anonKey) : null;

/** localStorage key for the in-progress workout id. */
export const ACTIVE_WORKOUT_KEY = "liftlog-active-workout";

/** localStorage key for exercise ids seeded from a workout template on Start. */
export const TEMPLATE_EXERCISES_KEY = "liftlog-template-exercises";
