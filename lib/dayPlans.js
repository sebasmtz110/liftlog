/** Per-date workout overrides. The database has split days and templates, not a dated plan, so these stay on this device for the signed-in user. */

function key(userId) {
  return `liftlog-day-plans:${userId}`;
}

export function loadDayPlans(userId) {
  if (!userId || typeof localStorage === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(key(userId)) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function saveDayPlan(userId, date, plan) {
  const all = loadDayPlans(userId);
  all[date] = plan;
  localStorage.setItem(key(userId), JSON.stringify(all));
  return all;
}
