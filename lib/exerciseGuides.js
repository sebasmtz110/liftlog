/**
 * Form guides for the seeded exercise catalog. Shown in the exercise
 * detail sheet. Keyed by exact exercise name.
 */
export const GUIDES = {
  "Bench Press": {
    setup: "Lie with eyes under the bar, feet planted, shoulder blades pinched down and back.",
    cues: ["Tuck elbows ~45 degrees", "Lower to lower chest under control", "Drive feet into the floor and press up"],
    mistakes: ["Bouncing the bar off the chest", "Flaring elbows to 90 degrees", "Butt lifting off the bench"],
  },
  "Squat": {
    setup: "Bar on upper back, feet shoulder-width, toes slightly out. Big breath, brace hard.",
    cues: ["Knees track over toes", "Hips break at the same time as knees", "Drive the floor away from you"],
    mistakes: ["Knees caving in", "Rounding the lower back", "Cutting depth short"],
  },
  "Deadlift": {
    setup: "Bar over mid-foot, shins to the bar, hips back, chest up, lats tight.",
    cues: ["Push the floor away", "Drag the bar up your shins", "Lock out with glutes, don't lean back"],
    mistakes: ["Rounding the back", "Hips shooting up first", "Bouncing reps off the floor"],
  },
  "Overhead Press": {
    setup: "Bar at collarbone, grip just outside shoulders, glutes squeezed, ribs down.",
    cues: ["Press up and slightly back", "Head moves through at the top", "Lower to chin level under control"],
    mistakes: ["Leaning way back (turns into incline press)", "Half reps", "Flaring elbows"],
  },
  "Barbell Row": {
    setup: "Hinge to about 45 degrees, flat back, bar hanging at knee level.",
    cues: ["Pull to lower ribs", "Squeeze shoulder blades together", "Keep torso angle fixed"],
    mistakes: ["Standing upright as you row", "Rounded back", "Yanking with momentum"],
  },
  "Pull-Up": {
    setup: "Overhand grip slightly wider than shoulders, dead hang.",
    cues: ["Drive elbows down to your ribs", "Chest toward the bar", "Full hang at the bottom"],
    mistakes: ["Kipping", "Half reps"],
  },
  "Dip": {
    setup: "Parallel bars, arms locked, slight forward lean.",
    cues: ["Lower until upper arms are parallel", "Keep elbows tucked", "Press to full lockout"],
    mistakes: ["Diving too deep with shoulders rolling forward", "Flaring elbows"],
  },
  "Bicep Curl": {
    setup: "Stand tall, dumbbells at sides, palms forward.",
    cues: ["Elbows pinned at your sides", "Squeeze hard at the top", "Lower slowly"],
    mistakes: ["Swinging the weight up", "Elbows drifting forward", "Cutting range short"],
  },
  "Tricep Pushdown": {
    setup: "High pulley, rope or bar, elbows pinned at your sides.",
    cues: ["Only the forearms move", "Full lockout and squeeze", "Control the way back up"],
    mistakes: ["Elbows drifting forward", "Leaning your bodyweight into it", "Partial reps"],
  },
  "Leg Press": {
    setup: "Feet shoulder-width on the platform, lower back flat against the pad.",
    cues: ["Lower until knees hit 90 degrees", "Drive through your heels", "Don't lock knees hard at the top"],
    mistakes: ["Butt lifting off the pad", "Knees caving in", "Slamming the safeties"],
  },
};

export function guideFor(name) {
  return GUIDES[name] ?? null;
}
