/**
 * Maps a muscle-group name to its tinted chip class
 * (SebasFit live per-muscle chip colors). Unknown groups
 * fall back to the default pink .muscle-tag.
 */
export function muscleTagClass(muscle) {
  const m = String(muscle || "").toLowerCase();
  if (m.includes("chest")) return "mt-chest";
  if (m.includes("back")) return "mt-back";
  if (m.includes("shoulder")) return "mt-shoulders";
  if (m.includes("bicep")) return "mt-biceps";
  if (m.includes("tricep")) return "mt-triceps";
  if (m.includes("leg") || m.includes("quad") || m.includes("hamstring") || m.includes("calv") || m.includes("glute"))
    return "mt-legs";
  return "";
}
