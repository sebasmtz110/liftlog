/**
 * Maps LiftLog exercise names to Sebas's V7 3D animation clips.
 * Clips live in public/fitness-animations/mobile/liftlog-animations/ (served from
 * the repo, never hotlinked). Filenames must stay unchanged.
 *
 * Matching rule: same exercise identity only — never reuse a wrong clip.
 * Bench Press maps to the closest same-family V7 variant (Smith-machine bench
 * press — same bench, same horizontal press, same chest emphasis).
 * Dip maps to a generated clip in the V7 style (gray mannequin, dark
 * studio, green triceps highlight), uploaded to the same folder.
 * Deadlift and Overhead Press map to the closest same-family V7 variants
 * (Romanian deadlift / seated dumbbell shoulder press).
 */

const BASE = "/fitness-animations/mobile/liftlog-animations";

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
  // Closest V7 bench variant (Smith-machine bench press).
  "Bench Press": "smith_machine_bench_press.mp4",
  // Generated dip clip in the V7 style (same folder).
  "Dip": "dip.mp4",
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
