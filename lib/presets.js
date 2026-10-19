/**
 * Preset training splits. Each preset lists its training days; every other
 * day of the week is Rest. Exercise names must match the seeded catalog.
 */

const COMPOUNDS = new Set([
  "Barbell Bench Press",
  "Back Squat",
  "Barbell Deadlift",
  "Shoulder Press",
  "Barbell Row",
  "Romanian Deadlift",
  "Close-Grip Bench Press",
]);

export const PRESETS = {
  ppl3: {
    name: "Push / Pull / Legs",
    daysPerWeek: 3,
    blurb: "Three full-body-ish days. Great if you're busy or just starting.",
    days: [
      { day: 0, label: "Push", muscles: ["Chest", "Shoulders", "Triceps"],
        exercises: ["Barbell Bench Press", "Shoulder Press", "Close-Grip Bench Press", "Triceps Pushdown"] },
      { day: 2, label: "Pull", muscles: ["Back", "Biceps"],
        exercises: ["Barbell Deadlift", "Barbell Row", "Pull-Up", "Barbell Curl"] },
      { day: 4, label: "Legs", muscles: ["Legs"],
        exercises: ["Back Squat", "Leg Press", "Romanian Deadlift"] },
    ],
  },
  upper_lower: {
    name: "Upper / Lower",
    daysPerWeek: 4,
    blurb: "Upper and lower body twice a week. A lot of training for 4 days.",
    days: [
      { day: 0, label: "Upper", muscles: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
        exercises: ["Barbell Bench Press", "Barbell Row", "Shoulder Press", "Pull-Up", "Barbell Curl", "Triceps Pushdown"] },
      { day: 1, label: "Lower", muscles: ["Legs"],
        exercises: ["Back Squat", "Barbell Deadlift", "Leg Press"] },
      { day: 3, label: "Upper", muscles: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
        exercises: ["Shoulder Press", "Barbell Bench Press", "Barbell Row", "Lat Pulldown", "Barbell Curl", "Triceps Pushdown"] },
      { day: 4, label: "Lower", muscles: ["Legs"],
        exercises: ["Barbell Deadlift", "Back Squat", "Leg Press"] },
    ],
  },
  ppl_ul: {
    name: "PPL + Upper / Lower",
    daysPerWeek: 5,
    blurb: "Push, pull, legs, then an upper and lower day. High volume.",
    days: [
      { day: 0, label: "Push", muscles: ["Chest", "Shoulders", "Triceps"],
        exercises: ["Barbell Bench Press", "Shoulder Press", "Close-Grip Bench Press", "Triceps Pushdown"] },
      { day: 1, label: "Pull", muscles: ["Back", "Biceps"],
        exercises: ["Barbell Row", "Pull-Up", "Barbell Deadlift", "Barbell Curl"] },
      { day: 2, label: "Legs", muscles: ["Legs"],
        exercises: ["Back Squat", "Leg Press", "Romanian Deadlift"] },
      { day: 4, label: "Upper", muscles: ["Chest", "Back", "Shoulders", "Biceps", "Triceps"],
        exercises: ["Barbell Bench Press", "Pull-Up", "Shoulder Press", "Close-Grip Bench Press", "Barbell Curl"] },
      { day: 5, label: "Lower", muscles: ["Legs"],
        exercises: ["Barbell Deadlift", "Back Squat", "Leg Press"] },
    ],
  },
  ppl6: {
    name: "Push / Pull / Legs x2",
    daysPerWeek: 6,
    blurb: "The classic 6-day split. Push, pull, legs — twice.",
    days: [
      { day: 0, label: "Push", muscles: ["Chest", "Shoulders", "Triceps"],
        exercises: ["Barbell Bench Press", "Shoulder Press", "Close-Grip Bench Press", "Triceps Pushdown"] },
      { day: 1, label: "Pull", muscles: ["Back", "Biceps"],
        exercises: ["Barbell Row", "Pull-Up", "Barbell Deadlift", "Barbell Curl"] },
      { day: 2, label: "Legs", muscles: ["Legs"],
        exercises: ["Back Squat", "Leg Press"] },
      { day: 3, label: "Push", muscles: ["Chest", "Shoulders", "Triceps"],
        exercises: ["Shoulder Press", "Barbell Bench Press", "Close-Grip Bench Press", "Triceps Pushdown"] },
      { day: 4, label: "Pull", muscles: ["Back", "Biceps"],
        exercises: ["Pull-Up", "Barbell Row", "Barbell Deadlift", "Barbell Curl"] },
      { day: 5, label: "Legs", muscles: ["Legs"],
        exercises: ["Barbell Deadlift", "Back Squat", "Leg Press"] },
    ],
  },
  arnold: {
    name: "Arnold Split",
    daysPerWeek: 6,
    blurb: "Chest + back, shoulders + arms, legs — twice a week. Old-school volume.",
    days: [
      { day: 0, label: "Chest + Back", muscles: ["Chest", "Back"],
        exercises: ["Barbell Bench Press", "Barbell Row", "Pull-Up", "Lat Pulldown"] },
      { day: 1, label: "Shoulders + Arms", muscles: ["Shoulders", "Biceps", "Triceps"],
        exercises: ["Shoulder Press", "Barbell Curl", "Triceps Pushdown", "Close-Grip Bench Press"] },
      { day: 2, label: "Legs", muscles: ["Legs"],
        exercises: ["Back Squat", "Romanian Deadlift", "Leg Press"] },
      { day: 3, label: "Chest + Back", muscles: ["Chest", "Back"],
        exercises: ["Barbell Bench Press", "Barbell Row", "Pull-Up", "Lat Pulldown"] },
      { day: 4, label: "Shoulders + Arms", muscles: ["Shoulders", "Biceps", "Triceps"],
        exercises: ["Shoulder Press", "Barbell Curl", "Triceps Pushdown", "Close-Grip Bench Press"] },
      { day: 5, label: "Legs", muscles: ["Legs"],
        exercises: ["Back Squat", "Romanian Deadlift", "Leg Press"] },
    ],
  },
};

export const PRESET_ORDER = ["ppl3", "upper_lower", "ppl_ul", "ppl6", "arnold"];

const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export { DAY_NAMES };

/** Pick a set scheme for an exercise given quiz answers. */
function schemeFor(exerciseName, experience, goal) {
  const compound = COMPOUNDS.has(exerciseName);
  if (goal === "strength" && compound) {
    return experience === "advanced" ? "5x5" : "4x5";
  }
  if (compound) {
    if (experience === "beginner") return "3x8-10";
    if (experience === "advanced") return "4x6-10";
    return "3x6-10";
  }
  if (experience === "beginner") return "2x10-12";
  if (experience === "advanced") return "3x10-15";
  return "3x8-12";
}

/** Recommend a preset key from the days-per-week answer. */
export function recommendPreset(daysPerWeek) {
  if (daysPerWeek <= 3) return "ppl3";
  if (daysPerWeek === 4) return "upper_lower";
  if (daysPerWeek === 5) return "ppl_ul";
  return "ppl6";
}

/**
 * Expand a preset into a full split definition with set schemes,
 * ready to preview or save. Returns { name, daysPerWeek, days: [...] }
 * where each day is { day_index, label, muscle_targets, is_rest, exercises: [{name, scheme}] }.
 */
export function buildSplit(presetKey, experience = "intermediate", goal = "muscle") {
  const preset = PRESETS[presetKey];
  const byDay = new Map(preset.days.map((d) => [d.day, d]));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = byDay.get(i);
    if (!d) {
      days.push({ day_index: i, label: "Rest", muscle_targets: "", is_rest: true, exercises: [] });
    } else {
      days.push({
        day_index: i,
        label: d.label,
        muscle_targets: d.muscles.join(" · "),
        is_rest: false,
        exercises: d.exercises.map((name) => ({ name, scheme: schemeFor(name, experience, goal) })),
      });
    }
  }
  return { name: preset.name, daysPerWeek: preset.daysPerWeek, days };
}

/**
 * Persist a built split for a user: wipes their old split first, then writes
 * splits / split_days / workout_templates / template_exercises.
 * Returns the created split id.
 */
export async function applySplit(supabase, userId, built) {
  // One active split per user — clear the old one first.
  const { data: old } = await supabase.from("splits").select("id").eq("user_id", userId);
  for (const row of old ?? []) {
    await supabase.from("splits").delete().eq("id", row.id);
  }

  const { data: split, error: splitErr } = await supabase
    .from("splits")
    .insert({ user_id: userId, name: built.name, days_per_week: built.daysPerWeek })
    .select("id")
    .single();
  if (splitErr || !split) throw splitErr || new Error("split insert failed");

  const { data: catalog } = await supabase.from("exercises").select("id, name");
  const idByName = new Map((catalog ?? []).map((e) => [e.name, e.id]));

  for (const day of built.days) {
    const { data: sd, error: sdErr } = await supabase
      .from("split_days")
      .insert({
        split_id: split.id,
        day_index: day.day_index,
        label: day.label,
        muscle_targets: day.muscle_targets,
        is_rest: day.is_rest,
      })
      .select("id")
      .single();
    if (sdErr || !sd) throw sdErr || new Error("split_day insert failed");
    if (day.is_rest) continue;

    const { data: tpl, error: tplErr } = await supabase
      .from("workout_templates")
      .insert({
        user_id: userId,
        split_day_id: sd.id,
        name: day.label,
        est_minutes: 40 + day.exercises.length * 6,
      })
      .select("id")
      .single();
    if (tplErr || !tpl) throw tplErr || new Error("template insert failed");

    let order = 0;
    for (const ex of day.exercises) {
      const exercise_id = idByName.get(ex.name);
      if (!exercise_id) continue;
      await supabase.from("template_exercises").insert({
        template_id: tpl.id,
        exercise_id,
        set_scheme: ex.scheme,
        sort_order: order++,
      });
    }
  }
  return split.id;
}

/** Load the user's split with days + templates + template exercises. */
export async function loadSplit(supabase, userId) {
  const { data: splits } = await supabase
    .from("splits")
    .select("id, name, days_per_week")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  const split = splits?.[0];
  if (!split) return null;
  const { data: days } = await supabase
    .from("split_days")
    .select("id, day_index, label, muscle_targets, is_rest")
    .eq("split_id", split.id)
    .order("day_index");
  const { data: templates } = await supabase
    .from("workout_templates")
    .select("id, name, est_minutes, split_day_id, template_exercises(set_scheme, sort_order, exercises(id, name, muscle_group))")
    .eq("user_id", userId);
  const tplByDay = new Map((templates ?? []).map((t) => [t.split_day_id, t]));
  return {
    ...split,
    days: (days ?? []).map((d) => ({ ...d, template: tplByDay.get(d.id) ?? null })),
  };
}
