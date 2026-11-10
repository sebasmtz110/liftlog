/**
 * In-memory cache for the main list reads (workouts list, split, health).
 *
 * Why: every tab page re-fetched its data from Supabase on mount, so every
 * tab switch waited on one or more network round-trips before anything
 * rendered. The route JS is already cached by the service worker, so the
 * data round-trip was the whole wait. This cache lives in the app's JS
 * only — it never touches the service worker (Supabase data stays
 * network-only there, per PR #4) and it is never persisted to disk.
 *
 * Policy:
 * - 60s TTL. A fresh cache renders immediately, no fetch at all.
 * - A stale cache still renders immediately, then refreshes in the
 *   background; the view updates when the refresh lands.
 * - No cache at all -> fetch (shared: concurrent callers for the same
 *   key wait on one fetch) and show the spinner while it runs.
 * - One superset workouts query serves every page: History slices 40,
 *   Stats uses all 200, Today / Workouts / Coach / Session slice what
 *   they need. One fetch replaces the three differently-shaped list
 *   queries those pages used to make.
 * - Keys are per user. signOut() clears the whole cache, so a new
 *   sign-in never sees the previous user's rows.
 * - Invalidation: invalidateWorkouts() whenever a workout is saved,
 *   completed, edited or deleted; invalidateSplit() whenever the split
 *   or a template changes. A fetch that was already in flight when the
 *   invalidation happened must not write its stale rows back into the
 *   cache (generation guard), and a background refresh that lands after
 *   a mutation must not overwrite the fresh view (identity check in the
 *   load*Cached helpers).
 */

import { loadSplit } from "./presets";

const TTL_MS = 60_000;

const entries = new Map(); // key -> { value, at }
const inflight = new Map(); // key -> Promise
const generations = new Map(); // key -> number, bumps on every invalidate

export const workoutsKey = (userId) => `workouts:${userId}`;
export const splitKey = (userId) => `split:${userId}`;
export const healthKey = (userId) => `health:${userId}`;

export function readCached(key) {
  const hit = entries.get(key);
  return hit ? hit.value : null;
}

export function isFresh(key) {
  const hit = entries.get(key);
  return Boolean(hit) && Date.now() - hit.at < TTL_MS;
}

function setCached(key, value) {
  entries.set(key, { value, at: Date.now() });
}

/**
 * Run fetcher once per key even when several pages ask at the same time.
 * If the key is invalidated while the fetch is in flight, the stale result
 * is returned to its caller but never stored.
 */
export function fetchShared(key, fetcher) {
  const hit = inflight.get(key);
  if (hit) return hit;
  const gen = generations.get(key) || 0;
  const p = fetcher()
    .then((value) => {
      inflight.delete(key);
      if ((generations.get(key) || 0) === gen) setCached(key, value);
      return value;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });
  inflight.set(key, p);
  return p;
}

export function invalidateCached(key) {
  entries.delete(key);
  inflight.delete(key);
  generations.set(key, (generations.get(key) || 0) + 1);
}

export function invalidateWorkouts(userId) {
  if (userId) invalidateCached(workoutsKey(userId));
}

export function invalidateSplit(userId) {
  if (userId) invalidateCached(splitKey(userId));
}

export function invalidateHealth(userId) {
  if (userId) invalidateCached(healthKey(userId));
}

export function clearDataCache() {
  entries.clear();
  inflight.clear();
  generations.clear();
}

/** The one workouts list query every page shares (limit 200, sets joined). */
export async function fetchWorkoutsList(supabase) {
  const { data, error } = await supabase
    .from("workouts")
    .select(
      "id, started_at, ended_at, template_id, sets(id, set_number, reps, weight, exercise_id, exercises(id, name, muscle_group))"
    )
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function fetchHealthRows(supabase) {
  const { data, error } = await supabase
    .from("health_data")
    .select("*")
    .order("date", { ascending: false })
    .limit(14);
  if (error) throw error;
  return data ?? [];
}

/**
 * Workouts list with the stale-while-revalidate policy.
 * Returns { rows, fromCache }. When the cache is stale, onRefresh(fresh)
 * runs when the background refresh lands — but only if that refresh is
 * still the cached value, so a mutation in between wins over it.
 */
export async function loadWorkoutsCached(supabase, userId, onRefresh) {
  const key = workoutsKey(userId);
  const cached = readCached(key);
  if (cached) {
    if (!isFresh(key) && onRefresh) {
      fetchShared(key, () => fetchWorkoutsList(supabase))
        .then((fresh) => {
          if (readCached(key) === fresh) onRefresh(fresh);
        })
        .catch(() => {});
    }
    return { rows: cached, fromCache: true };
  }
  const rows = await fetchShared(key, () => fetchWorkoutsList(supabase));
  return { rows, fromCache: false };
}

/** Split with the same policy (fresh -> instant, stale -> instant + refresh). */
export async function loadSplitCached(supabase, userId, onRefresh) {
  const key = splitKey(userId);
  const cached = readCached(key);
  if (cached) {
    if (!isFresh(key) && onRefresh) {
      fetchShared(key, () => loadSplit(supabase, userId))
        .then((fresh) => {
          if (readCached(key) === fresh) onRefresh(fresh);
        })
        .catch(() => {});
    }
    return cached;
  }
  return fetchShared(key, () => loadSplit(supabase, userId));
}

/** Health rows with the same policy (the bridge only writes every 3h). */
export async function loadHealthCached(supabase, userId, onRefresh) {
  const key = healthKey(userId);
  const cached = readCached(key);
  if (cached) {
    if (!isFresh(key) && onRefresh) {
      fetchShared(key, () => fetchHealthRows(supabase))
        .then((fresh) => {
          if (readCached(key) === fresh) onRefresh(fresh);
        })
        .catch(() => {});
    }
    return cached;
  }
  return fetchShared(key, () => fetchHealthRows(supabase));
}
