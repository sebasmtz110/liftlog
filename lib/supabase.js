/**
 * Supabase client, loaded on demand.
 *
 * The client is created lazily: importing this module is cheap (no
 * @supabase/supabase-js code is pulled into a page's initial JS bundle
 * until something actually calls getSupabase()). Pages that never touch
 * the database — like the landing page's first paint — stop shipping the
 * entire supabase-js client up front.
 *
 * The library chunk is still shared: once any route has loaded it, the
 * browser caches it, so navigating from the landing page to a data page
 * costs one extra (parallel, non-blocking) chunk fetch.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False when env vars are missing — the UI shows a setup banner instead of crashing. */
export const isConfigured = Boolean(url && anonKey);

/** Cached client promise so every caller shares one instance. */
let clientPromise = null;

/**
 * Get the shared Supabase client (lazily imports supabase-js the first
 * time it's needed). Returns null when not configured.
 */
export async function getSupabase() {
  if (!isConfigured) return null;
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(url, anonKey)
    );
  }
  return clientPromise;
}

/** localStorage key for the in-progress workout id. */
export const ACTIVE_WORKOUT_KEY = "liftlog-active-workout";

/** localStorage key for exercise ids seeded from a workout template on Start. */
export const TEMPLATE_EXERCISES_KEY = "liftlog-template-exercises";

/** localStorage key for per-workout session snapshots (exercise order, drafts, focus, rest). */
export const WORKOUT_SNAPSHOT_KEY = "liftlog-workout-snapshots";

function readSnapshots() {
  try {
    const raw = localStorage.getItem(WORKOUT_SNAPSHOT_KEY);
    const o = raw ? JSON.parse(raw) : {};
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

/** Load the saved snapshot for a workout, or null. */
export function loadWorkoutSnapshot(workoutId) {
  if (!workoutId) return null;
  const s = readSnapshots()[workoutId];
  return s && typeof s === "object" ? s : null;
}

/** Persist the session snapshot for a workout. */
export function saveWorkoutSnapshot(workoutId, snap) {
  if (!workoutId) return;
  try {
    const all = readSnapshots();
    all[workoutId] = snap;
    localStorage.setItem(WORKOUT_SNAPSHOT_KEY, JSON.stringify(all));
  } catch {
    /* storage full or unavailable — session still works in memory */
  }
}

/** Drop the snapshot for a finished/discarded workout. */
export function clearWorkoutSnapshot(workoutId) {
  if (!workoutId) return;
  try {
    const all = readSnapshots();
    delete all[workoutId];
    localStorage.setItem(WORKOUT_SNAPSHOT_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
