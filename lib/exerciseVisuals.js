import { motionFor, stillFor, thumbFor, catalogByName } from "./catalog";

/** Still used by the active set. Cinematic lifts fill the frame; others sit on the dark gym plate. */
export function visualForExercise(name) {
  const e = catalogByName(name);
  if (e?.cinematic && e.motion) return e.motion;
  return null;
}

export function plateForExercise(name) {
  return thumbFor(name);
}

export function stillForExercise(name) {
  return stillFor(name);
}

export function motionStillFor(name) {
  return motionFor(name);
}
