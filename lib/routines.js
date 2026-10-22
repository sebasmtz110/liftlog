/** Built-in routines. Exercise names must match the catalog so ensureCatalog can resolve real ids. */

export const BUILTIN_ROUTINES = [
  {
    key: "push-a",
    name: "Push",
    detail: "Bench first",
    focus: "Chest, shoulders, triceps",
    names: ["Barbell Bench Press", "Shoulder Press", "Close-Grip Bench Press", "Triceps Pushdown"],
  },
  {
    key: "push-b",
    name: "Push",
    detail: "Shoulders first",
    focus: "Shoulders, chest, triceps",
    names: ["Shoulder Press", "Barbell Bench Press", "Close-Grip Bench Press", "Triceps Pushdown"],
  },
  {
    key: "pull",
    name: "Pull",
    detail: "Row, pull-up, deadlift, curl",
    focus: "Back, biceps",
    names: ["Barbell Row", "Pull-Up", "Barbell Deadlift", "Barbell Curl"],
  },
  {
    key: "legs",
    name: "Legs",
    detail: "Squat, leg press, Romanian deadlift",
    focus: "Quads, hamstrings, glutes",
    names: ["Back Squat", "Leg Press", "Romanian Deadlift"],
  },
  {
    key: "chest",
    name: "Chest",
    detail: "Bench, incline, fly",
    focus: "Chest, triceps",
    names: ["Barbell Bench Press", "Incline Barbell Bench Press", "Dumbbell Fly", "Close-Grip Bench Press"],
  },
  {
    key: "back",
    name: "Back",
    detail: "Row, pull-up, pulldown",
    focus: "Lats, biceps",
    names: ["Barbell Row", "Pull-Up", "Lat Pulldown", "Seated Cable Row"],
  },
];

export function routineLabel(routine) {
  return routine.name === "Push" ? routine.detail : routine.name;
}

export function resolveNames(names, idByName) {
  return names.map((name) => idByName[name.toLowerCase()]).filter(Boolean);
}
