/**
 * Maps LiftLog exercise names to Sebas's V7 3D animation clips.
 * Clips live in public/fitness-animations/mobile/ (served from the repo,
 * never hotlinked). Filenames must stay unchanged.
 *
 * Matching rule: same exercise identity only — never reuse a wrong clip.
 * Bench Press and Dip have no V7 clip (no barbell-bench or dip variant in
 * the pack), so they intentionally map to nothing and render no preview.
 * Deadlift and Overhead Press map to the closest same-family V7 variants
 * (Romanian deadlift / seated dumbbell shoulder press).
 */

const BASE = "/fitness-animations/mobile";

export const EXERCISE_DEMOS = {
  "Squat": "barbell_back_squat.mp4",
  // Closest V7 deadlift variant (Romanian deadlift).
  "Deadlift": "romanian_deadlift.mp4",
  // Closest V7 overhead-press variant (seated dumbbell shoulder press).
  "Overhead Press": "seated_dumbbell_shoulder_press.mp4",
  "Barbell Row": "barbell_bent_over_row.mp4",
  "Pull-Up": "pull_up.mp4",
  "Bicep Curl": "dumbbell_curl.mp4",
  "Tricep Pushdown": "cable_triceps_pushdown.mp4",
  "Leg Press": "leg_press.mp4",
  // "Bench Press" and "Dip": no clip exists — deliberately absent.
};

/** Returns the clip URL for an exercise name, or null when there is none. */
export function demoForExercise(name) {
  const file = EXERCISE_DEMOS[name];
  return file ? `${BASE}/${file}` : null;
}

/** True when the exercise has an animation clip. */
export function hasDemo(name) {
  return Boolean(EXERCISE_DEMOS[name]);
}
