/**
 * Maps LiftLog exercise names to premium photorealistic visuals
 * (dark cinematic style, matching the concept board).
 * Used for the large exercise visual on the workout screen and guide sheets.
 * The V7 mannequin videos (exerciseDemos.js) remain the form-demo source.
 */

const BASE = "/exercise-visuals";

export const EXERCISE_VISUALS = {
  "Bench Press": "bench-press.jpg",
  "Squat": "squat.jpg",
  "Deadlift": "deadlift.jpg",
  "Overhead Press": "overhead-press.jpg",
  "Barbell Row": "barbell-row.jpg",
  "Pull-Up": "pull-up.jpg",
  "Bicep Curl": "bicep-curl.jpg",
  "Tricep Pushdown": "tricep-pushdown.jpg",
  "Leg Press": "leg-press.jpg",
  "Dip": "dip.jpg",
};

/** Returns the premium visual URL for an exercise name, or null when there is none. */
export function visualForExercise(name) {
  const file = EXERCISE_VISUALS[name];
  return file ? `${BASE}/${file}` : null;
}
