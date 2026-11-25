import { ACTIVE_WORKOUT_KEY, TEMPLATE_EXERCISES_KEY } from "./supabase";

/**
 * Start a workout, or resume the one already open on this device.
 * Overwriting ACTIVE_WORKOUT_KEY used to orphan the previous session in Supabase.
 */
export async function startSession(supabase, user, { templateId = null, exerciseIds = [] } = {}) {
  const existing = localStorage.getItem(ACTIVE_WORKOUT_KEY);
  if (existing) {
    const { data } = await supabase
      .from("workouts")
      .select("id, ended_at")
      .eq("id", existing)
      .maybeSingle();
    if (data && !data.ended_at) return data.id;
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
  }

  const { data, error } = await supabase
    .from("workouts")
    .insert({
      started_at: new Date().toISOString(),
      user_id: user.id,
      template_id: templateId || null,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  if (exerciseIds.length) localStorage.setItem(TEMPLATE_EXERCISES_KEY, JSON.stringify(exerciseIds));
  localStorage.setItem(ACTIVE_WORKOUT_KEY, data.id);
  return data.id;
}
