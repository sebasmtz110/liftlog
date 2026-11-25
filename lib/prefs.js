/** Local preferences that do not need a server round-trip. */

export const REST_PREF_KEY = "liftlog-rest-default";
export const REST_OPTIONS = [60, 90, 120, 180];

export function getRestDefault() {
  try {
    const n = Number(localStorage.getItem(REST_PREF_KEY));
    if (REST_OPTIONS.includes(n)) return n;
  } catch {
    /* ignore */
  }
  return 90;
}

export function setRestDefault(seconds) {
  if (!REST_OPTIONS.includes(seconds)) return;
  try {
    localStorage.setItem(REST_PREF_KEY, String(seconds));
  } catch {
    /* ignore */
  }
}
