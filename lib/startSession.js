import { ACTIVE_WORKOUT_KEY, TEMPLATE_EXERCISES_KEY } from "./supabase";

export async function startSession(supabase, user, { templateId = null, exerciseIds = [] } = {}) {
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
