/** Loaded volume: reps times the pounds logged. Zero-pound sets are excluded. Dumbbells are not doubled. */

export function setVolume(set) {
  const weight = Number(set?.weight) || 0;
  if (weight <= 0) return 0;
  return (set.reps ?? 0) * weight;
}

export function volumeOf(sets) {
  return (sets ?? []).reduce((sum, set) => sum + setVolume(set), 0);
}
