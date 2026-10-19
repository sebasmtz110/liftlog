const LB_PER_KG = 2.2046226218;

const EXERCISES = [
  { id: "barbell-bench-press", name: "Barbell Bench Press", region: "Chest", type: "Compound", equipment: "Barbell", filter: "chest", thumb: "assets/thumb-bench.jpg", still: "assets/bench-detail.jpg", motion: "assets/bench-press.jpg", cinematic: true, view: "front", hot: ["chest"], warm: ["shoulders", "triceps"], primary: "Chest", secondary: "Shoulders · Triceps", sets: 4, reps: 8, rest: 90, tempo: "2-1-1", weight: 185,
    steps: ["Lie on a flat bench with your feet firmly on the floor.", "Grip the bar slightly wider than shoulder width.", "Lower the bar to your mid-chest with control.", "Press the bar back up, keeping your core tight."],
    tips: ["Pinch your shoulder blades and stack your wrists over your elbows.", "Drive your feet into the floor without lifting your hips.", "Stop the set if the bar drifts toward your neck."],
    cues: ["Lie back, plant your feet, and set your shoulder blades before you take the bar.", "Lower to mid-chest and press up while your ribs stay down.", "Lock out softly over the shoulders, then reset the next rep."] },
  { id: "incline-dumbbell-press", name: "Incline Dumbbell Press", region: "Chest", type: "Compound", equipment: "Dumbbells", filter: "chest", thumb: "assets/thumb-incline.jpg", view: "front", hot: ["chest"], warm: ["shoulders", "triceps"], primary: "Upper chest", secondary: "Shoulders · Triceps", sets: 3, reps: 10, rest: 75, tempo: "2-1-1", weight: 70,
    steps: ["Set the bench near 30 degrees.", "Start with the dumbbells over your upper chest.", "Lower until your elbows sit just below the bench line.", "Press up and slightly inward without clanking the weights."],
    tips: ["Keep the bench modest so the press stays on the chest.", "Match both arms. The weaker side sets the load."],
    cues: ["Sit tall, then lie back with the bells at shoulder height.", "Press along a slight arc toward the top of the chest.", "Finish with arms extended and shoulders still packed down."] },
  { id: "machine-chest-press", name: "Machine Chest Press", region: "Chest", type: "Machine", equipment: "Machine", filter: "chest", thumb: "assets/thumb-machine-press.jpg", view: "front", hot: ["chest"], warm: ["shoulders", "triceps"], primary: "Chest", secondary: "Shoulders · Triceps", sets: 3, reps: 10, rest: 75, tempo: "2-0-1", weight: 140,
    steps: ["Set the seat so the handles meet your mid-chest.", "Grip evenly and keep your back on the pad.", "Press until the elbows are almost straight.", "Return until the chest stretches without the shoulders rolling forward."],
    tips: ["Use the machine to chase clean reps, not a loose bounce.", "If one arm takes over, lighten the stack."] },
  { id: "dumbbell-fly", name: "Dumbbell Fly", region: "Chest", type: "Isolation", equipment: "Dumbbells", filter: "chest", thumb: "assets/thumb-fly.jpg", view: "front", hot: ["chest"], warm: ["shoulders"], primary: "Chest", secondary: "Shoulders", sets: 3, reps: 12, rest: 60, tempo: "2-1-1", weight: 35,
    steps: ["Lie on a flat bench with a soft bend in the elbows.", "Open the arms until the chest stretches.", "Sweep the bells back together over the chest.", "Keep the same elbow angle the whole time."],
    tips: ["This is a stretch movement. Leave the heavy pressing for the compounds.", "Stop short of pain in the front of the shoulder."] },
  { id: "shoulder-press", name: "Shoulder Press", motionName: "Seated Dumbbell Press", region: "Shoulders", type: "Compound", equipment: "Dumbbells", filter: "shoulders", thumb: "assets/thumb-shoulder.jpg", motion: "assets/seated-press.jpg", cinematic: true, view: "front", hot: ["shoulders"], warm: ["triceps"], primary: "Shoulders", secondary: "Triceps", sets: 3, reps: 8, rest: 75, tempo: "2-0-1", weight: 55,
    steps: ["Sit tall with the dumbbells at shoulder height.", "Press straight up without leaning back hard.", "Stop just short of a violent lockout.", "Lower until the elbows sit slightly below the shoulders."],
    tips: ["Ribs down. A big lean turns this into an incline press.", "Keep the bells over the elbows, not forward of the face."],
    cues: ["Sit tall, plant your feet, and set the dumbbells at shoulder height.", "Keep your back against the bench, core tight, and press the dumbbells straight up until your arms are fully extended.", "Lower along the same path until the elbows sit just below the shoulders."] },
  { id: "lateral-raise", name: "Lateral Raise", region: "Shoulders", type: "Isolation", equipment: "Dumbbells", filter: "shoulders", thumb: "assets/thumb-lateral.jpg", view: "front", hot: ["shoulders"], warm: [], primary: "Side delts", secondary: "Traps", sets: 3, reps: 12, rest: 60, tempo: "2-1-2", weight: 25,
    steps: ["Stand tall with a slight bend in the elbows.", "Raise the arms out to shoulder height.", "Lead with the elbows, not the hands.", "Lower slowly. Do not swing the next rep."],
    tips: ["If the traps take over, the load is too heavy.", "A thumb-slightly-down finish keeps the side delt working."] },
  { id: "cable-crossover", name: "Cable Crossover", region: "Chest", type: "Isolation", equipment: "Cable", filter: "chest", thumb: "assets/thumb-fly.jpg", view: "front", hot: ["chest"], warm: ["shoulders"], primary: "Chest", secondary: "Shoulders", sets: 3, reps: 12, rest: 60, tempo: "2-1-1", weight: 40,
    steps: ["Set the pulleys high and step through so the chest is proud.", "Sweep the handles down and together.", "Pause where the hands meet.", "Open back to a long stretch without shrugging."],
    tips: ["Think about the hands meeting in front of the sternum, not the hips."] },
  { id: "barbell-row", name: "Barbell Row", region: "Back", type: "Compound", equipment: "Barbell", filter: "back", thumb: "assets/thumb-row.jpg", view: "back", hot: ["lats"], warm: ["traps", "biceps"], primary: "Lats", secondary: "Traps · Biceps", sets: 4, reps: 8, rest: 90, tempo: "2-1-1", weight: 155,
    steps: ["Hinge until the torso is near parallel and the back is flat.", "Pull the bar to the lower ribs.", "Squeeze the shoulder blades without shrugging to the ears.", "Lower until the arms are long."],
    tips: ["The chest stays proud. A rounded back is a reason to drop the load.", "Brace before every pull."] },
  { id: "pull-up", name: "Pull-Up", region: "Back", type: "Compound", equipment: "Bodyweight", filter: "back", thumb: "assets/thumb-pullup.jpg", bodyweight: true, view: "back", hot: ["lats"], warm: ["biceps"], primary: "Lats", secondary: "Biceps", sets: 4, reps: 6, rest: 90, tempo: "2-1-1", weight: 0,
    steps: ["Hang with a grip just outside the shoulders.", "Pull the chest toward the bar.", "Clear the chin without craning the neck.", "Lower all the way. Keep a little tension at the bottom."],
    tips: ["Added weight is optional. Zero means bodyweight.", "Kipping changes the exercise. Stay strict here."] },
  { id: "lat-pulldown", name: "Lat Pulldown", region: "Back", type: "Machine", equipment: "Cable", filter: "back", thumb: "assets/thumb-pullup.jpg", view: "back", hot: ["lats"], warm: ["biceps"], primary: "Lats", secondary: "Biceps", sets: 3, reps: 10, rest: 75, tempo: "2-1-1", weight: 120,
    steps: ["Sit tall and lock the thighs under the pads.", "Pull the bar to the upper chest.", "Drive the elbows down, not back behind you.", "Control the return until the arms are long."],
    tips: ["Leaning back a little is fine. Turning it into a row is not."] },
  { id: "seated-cable-row", name: "Seated Cable Row", region: "Back", type: "Compound", equipment: "Cable", filter: "back", thumb: "assets/thumb-row.jpg", view: "back", hot: ["lats"], warm: ["traps", "biceps"], primary: "Mid back", secondary: "Lats · Biceps", sets: 3, reps: 10, rest: 75, tempo: "2-1-1", weight: 130,
    steps: ["Sit with a soft knee bend and a tall chest.", "Pull the handle to the ribs.", "Pause with the shoulder blades together.", "Reach forward without dumping the lower back."],
    tips: ["The torso stays nearly still. The arms and back do the work."] },
  { id: "one-arm-row", name: "One-Arm Dumbbell Row", region: "Back", type: "Compound", equipment: "Dumbbell", filter: "back", thumb: "assets/thumb-row.jpg", view: "back", hot: ["lats"], warm: ["biceps"], primary: "Lats", secondary: "Biceps", sets: 3, reps: 10, rest: 60, tempo: "2-1-1", weight: 70,
    steps: ["Brace one hand on a bench and keep the back flat.", "Pull the bell to the hip, not the armpit.", "Pause, then lower until the shoulder stretches.", "Match the reps on both sides."],
    tips: ["Do not rotate the whole torso to finish the rep."] },
  { id: "barbell-curl", name: "Barbell Curl", region: "Arms", type: "Isolation", equipment: "Barbell", filter: "arms", thumb: "assets/thumb-curl.jpg", view: "front", hot: ["biceps"], warm: [], primary: "Biceps", secondary: "Forearms", sets: 3, reps: 10, rest: 60, tempo: "2-1-1", weight: 75,
    steps: ["Stand tall with the bar at the thighs.", "Curl without swinging the hips.", "Stop before the elbows drift forward a lot.", "Lower for a full two-count."],
    tips: ["Leave the ego load on the rack. Swinging is a different exercise."] },
  { id: "hammer-curl", name: "Hammer Curl", region: "Arms", type: "Isolation", equipment: "Dumbbells", filter: "arms", thumb: "assets/thumb-curl.jpg", view: "front", hot: ["biceps"], warm: [], primary: "Brachialis", secondary: "Biceps · Forearms", sets: 3, reps: 12, rest: 60, tempo: "2-0-1", weight: 30,
    steps: ["Hold the bells with palms facing each other.", "Curl toward the shoulders.", "Keep the elbows pinned near the ribs.", "Lower until the arms are straight."],
    tips: ["Neutral grip takes pressure off sore wrists."] },
  { id: "triceps-pushdown", name: "Triceps Pushdown", region: "Arms", type: "Isolation", equipment: "Cable", filter: "arms", thumb: "assets/thumb-pushdown.jpg", view: "back", hot: ["triceps"], warm: [], primary: "Triceps", secondary: "Forearms", sets: 3, reps: 12, rest: 60, tempo: "2-1-1", weight: 50,
    steps: ["Pin the elbows to your sides.", "Push the bar down until the arms are straight.", "Squeeze at the bottom without leaning over the bar.", "Let it rise only to about chest height."],
    tips: ["If the elbows travel forward, the chest is stealing the set."] },
  { id: "overhead-extension", name: "Overhead Triceps Extension", region: "Arms", type: "Isolation", equipment: "Dumbbell", filter: "arms", thumb: "assets/thumb-pushdown.jpg", view: "back", hot: ["triceps"], warm: [], primary: "Triceps", secondary: "Shoulders", sets: 3, reps: 10, rest: 60, tempo: "2-1-1", weight: 40,
    steps: ["Hold one bell overhead with both hands.", "Lower behind the head until the triceps stretch.", "Keep the upper arms close to the ears.", "Extend without flaring the ribs."],
    tips: ["A lighter bell with a long stretch beats a short, heavy shove."] },
  { id: "close-grip-bench", name: "Close-Grip Bench Press", region: "Arms", type: "Compound", equipment: "Barbell", filter: "arms", thumb: "assets/thumb-bench.jpg", view: "front", hot: ["triceps"], warm: ["chest"], primary: "Triceps", secondary: "Chest", sets: 3, reps: 8, rest: 90, tempo: "2-1-1", weight: 135,
    steps: ["Grip about shoulder width. Do not stack the hands together.", "Lower to the lower chest.", "Keep the elbows closer than a wide bench press.", "Press up and finish with the triceps."],
    tips: ["A too-narrow grip punishes the wrists. Shoulder width is enough."] },
  { id: "back-squat", name: "Back Squat", region: "Legs", type: "Compound", equipment: "Barbell", filter: "legs", thumb: "assets/thumb-squat.jpg", view: "front", hot: ["quads"], warm: ["glutes"], primary: "Quadriceps", secondary: "Glutes", sets: 5, reps: 5, rest: 120, tempo: "2-1-1", weight: 225,
    steps: ["Set the bar on the upper back, not the neck.", "Break at the hips and knees together.", "Sit to a depth you can own with the heels down.", "Stand by driving the floor away."],
    tips: ["Knees track over the mid-foot.", "Brace before you descend. Do not hold your breath for the whole set."] },
  { id: "romanian-deadlift", name: "Romanian Deadlift", region: "Legs", type: "Compound", equipment: "Barbell", filter: "legs", thumb: "assets/thumb-rdl.jpg", view: "back", hot: ["hamstrings"], warm: ["glutes"], primary: "Hamstrings", secondary: "Glutes", sets: 4, reps: 8, rest: 90, tempo: "3-0-1", weight: 185,
    steps: ["Start tall with the bar at the thighs.", "Push the hips back and slide the bar down the legs.", "Stop when the hamstrings hit their stretch, back still flat.", "Stand by driving the hips forward."],
    tips: ["The bar stays touching the legs. A gap means the hinge turned into a squat."] },
  { id: "barbell-deadlift", name: "Barbell Deadlift", region: "Legs", type: "Compound", equipment: "Barbell", filter: "legs", thumb: "assets/thumb-rdl.jpg", view: "back", hot: ["glutes", "hamstrings"], warm: ["lats"], primary: "Glutes · Hamstrings", secondary: "Back", sets: 3, reps: 5, rest: 150, tempo: "1-1-1", weight: 275,
    steps: ["Stand with the bar over the mid-foot.", "Hinge, grip, and brace before the bar leaves the floor.", "Push the floor away and keep the bar close.", "Stand tall, then lower with the same path."],
    tips: ["Set the lats before you pull so the bar does not drift forward.", "Finish the hips and knees together. Do not lean back."] },
  { id: "leg-press", name: "Leg Press", region: "Legs", type: "Machine", equipment: "Machine", filter: "legs", thumb: "assets/thumb-squat.jpg", view: "front", hot: ["quads"], warm: ["glutes"], primary: "Quadriceps", secondary: "Glutes", sets: 3, reps: 10, rest: 90, tempo: "2-1-1", weight: 360,
    steps: ["Place the feet about shoulder width on the platform.", "Lower until the knees travel, without the hips peeling off the pad.", "Press evenly through the whole foot.", "Do not lock the knees hard at the top."],
    tips: ["A deeper range is not better if the lower back rounds off the seat."] },
  { id: "walking-lunge", name: "Walking Lunge", region: "Legs", type: "Compound", equipment: "Dumbbells", filter: "legs", thumb: "assets/thumb-squat.jpg", view: "front", hot: ["quads"], warm: ["glutes"], primary: "Quadriceps", secondary: "Glutes", sets: 3, reps: 10, rest: 60, tempo: "2-0-1", weight: 40,
    steps: ["Hold the bells at your sides.", "Step long enough that the front heel stays down.", "Drop the back knee toward the floor.", "Drive through the front foot into the next step."],
    tips: ["A short step dumps the knee past the toes. Make it long."] },
  { id: "leg-curl", name: "Leg Curl", region: "Legs", type: "Isolation", equipment: "Machine", filter: "legs", thumb: "assets/thumb-rdl.jpg", view: "back", hot: ["hamstrings"], warm: [], primary: "Hamstrings", secondary: "Calves", sets: 3, reps: 12, rest: 60, tempo: "2-1-2", weight: 90,
    steps: ["Line the pad up with the lower calves.", "Curl until the heels get close to the glutes.", "Pause, then lower for a full stretch.", "Keep the hips down on the pad."],
    tips: ["If the hips lift, the load is doing the cheating for you."] },
  { id: "calf-raise", name: "Standing Calf Raise", region: "Legs", type: "Isolation", equipment: "Machine", filter: "legs", thumb: "assets/thumb-squat.jpg", view: "back", hot: ["calves"], warm: [], primary: "Calves", secondary: "Feet", sets: 4, reps: 12, rest: 45, tempo: "2-1-1", weight: 180,
    steps: ["Stand tall with the balls of the feet on the edge.", "Drop the heels into a stretch.", "Rise as high as the calves allow.", "Pause at the top before the next drop."],
    tips: ["A bounce at the bottom skips the part that matters."] }
];

const TEMPLATES = [
  { id: "upper-body", name: "Upper Body Strength", category: "Strength", minutes: 52, focus: "Chest, shoulders, arms",
    items: [
      ["barbell-bench-press", 4, 8, 185, 45],
      ["incline-dumbbell-press", 3, 10, 70, 45],
      ["shoulder-press", 3, 8, 55, 45],
      ["lateral-raise", 3, 12, 25, 45]
    ] },
  { id: "push-day", name: "Push Day", category: "Hypertrophy", minutes: 58, focus: "Chest, shoulders, triceps",
    items: [
      ["barbell-bench-press", 4, 8, 185, 75],
      ["incline-dumbbell-press", 3, 12, 60, 60],
      ["shoulder-press", 3, 10, 50, 60],
      ["lateral-raise", 3, 15, 20, 45],
      ["triceps-pushdown", 3, 12, 50, 45]
    ] },
  { id: "pull-day", name: "Pull Day", category: "Hypertrophy", minutes: 55, focus: "Back and biceps",
    items: [
      ["pull-up", 4, 6, 0, 90],
      ["barbell-row", 4, 8, 155, 75],
      ["seated-cable-row", 3, 10, 120, 60],
      ["barbell-curl", 3, 10, 75, 45]
    ] },
  { id: "leg-day", name: "Leg Day", category: "Strength", minutes: 62, focus: "Quads, hamstrings, calves",
    items: [
      ["back-squat", 5, 5, 225, 120],
      ["romanian-deadlift", 4, 8, 185, 90],
      ["leg-press", 3, 10, 360, 75],
      ["leg-curl", 3, 12, 90, 60],
      ["calf-raise", 4, 12, 180, 45]
    ] },
  { id: "engine", name: "Conditioning Circuit", category: "Conditioning", minutes: 40, focus: "Mixed stations",
    items: [
      ["back-squat", 3, 12, 95, 30],
      ["barbell-row", 3, 12, 95, 30],
      ["shoulder-press", 3, 12, 30, 30],
      ["romanian-deadlift", 3, 12, 95, 30],
      ["walking-lunge", 3, 10, 30, 30],
      ["lateral-raise", 3, 15, 15, 30]
    ] }
];

const PROGRAMS = [
  { id: "strength-block", name: "Strength Block", days: "4 days", blurb: "Four weeks. Add load when every set stays clean.",
    plan: [["Day 1", "Upper Body Strength"], ["Day 2", "Leg Day"], ["Day 3", "Push Day"], ["Day 4", "Pull Day"]] },
  { id: "hypertrophy", name: "Hypertrophy", days: "5 days", blurb: "More sets, shorter rest, and a second push and pull.",
    plan: [["Day 1", "Push Day"], ["Day 2", "Pull Day"], ["Day 3", "Leg Day"], ["Day 4", "Push Day"], ["Day 5", "Pull Day"]] }
];

const SEEDED = [
  { id: "h1", date: "2025-11-03", templateId: "upper-body", minutes: 52 },
  { id: "h2", date: "2025-10-31", templateId: "push-day", minutes: 58 },
  { id: "h3", date: "2025-10-28", templateId: "leg-day", minutes: 62 },
  { id: "h4", date: "2025-10-24", templateId: "upper-body", minutes: 49 },
  { id: "h5", date: "2025-10-21", templateId: "pull-day", minutes: 55 },
  { id: "h6", date: "2025-10-18", templateId: "engine", minutes: 40 }
];

const MONTH_SERIES = [
  { label: "Oct 6", v: 128 }, { label: "Oct 13", v: 118 }, { label: "Oct 20", v: 152 },
  { label: "Oct 27", v: 166 }, { label: "Nov 3", v: 184 }
];
const LONG_SERIES = [
  { label: "Sep 1", v: 110 }, { label: "Sep 15", v: 124 }, { label: "Oct 6", v: 128 },
  { label: "Oct 20", v: 152 }, { label: "Nov 3", v: 184 }
];
const LIFTS = [
  { name: "Bench Press", weight: 225, delta: 12, id: "barbell-bench-press", bars: [40, 55, 48, 70, 78, 90, 100] },
  { name: "Squat", weight: 315, delta: 8, id: "back-squat", bars: [50, 60, 58, 72, 80, 88, 96] },
  { name: "Deadlift", weight: 405, delta: 8, id: "barbell-deadlift", bars: [62, 70, 66, 84, 90, 94, 100] },
  { name: "Overhead Press", weight: 135, delta: 10, id: "shoulder-press", bars: [36, 44, 50, 48, 66, 74, 86] }
];

const FILTERS = [["all", "All"], ["chest", "Chest"], ["back", "Back"], ["shoulders", "Shoulders"], ["arms", "Arms"], ["legs", "Legs"]];
const HISTORY_FILTERS = ["All", "Strength", "Hypertrophy", "Conditioning"];
const PROGRESS_TABS = ["Overview", "Workouts", "Strength", "Body"];
const DETAIL_TABS = ["Instructions", "Sets & Reps", "Tips"];
const IMMERSIVE = new Set(["workout", "rest", "log", "complete", "motion"]);
const TONE = { workout: "workout", rest: "workout", log: "workout", motion: "workout", progress: "progress" };
const TAB_FOR = {
  home: "home", templates: "workouts", template: "workouts",
  library: "library", detail: "library",
  progress: "progress",
  history: "history", "history-detail": "history"
};

const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
const templateById = (id) => allTemplates().find((t) => t.id === id);

let state = load();
let toastTimer = 0;
let motionFrame = 0;
let logFresh = true;

function load() {
  const base = {
    screen: "home", detailId: "barbell-bench-press", detailTab: "Instructions",
    libraryQuery: "", libraryFilter: "all", historyFilter: "All", historyId: null,
    progressTab: "Overview", progressRange: "month", templateId: "push-day", programId: "strength-block",
    metric: "weight", logFocus: "weight", draft: { weight: "185", reps: "8" },
    unit: "lb", restDefault: 45, saved: {}, custom: [], extra: [], session: null, summary: null,
    motionFrom: "detail", motionTime: 12, motionPlaying: false, modal: null
  };
  try {
    const raw = JSON.parse(localStorage.getItem("alder-state") || "null");
    if (!raw) return base;
    return { ...base, ...raw, screen: "home", modal: null };
  } catch { return base; }
}
function save() {
  const { screen, modal, motionPlaying, ...rest } = state;
  localStorage.setItem("alder-state", JSON.stringify(rest));
}
function allTemplates() {
  return TEMPLATES.concat(state.custom);
}
function exerciseOf(ref) {
  return byId[ref] || byId[ref.exerciseId];
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function clock(sec) {
  sec = Math.max(0, Math.ceil(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}
function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]} ${d}, ${y}`;
}
function comma(n) {
  return Math.round(n).toLocaleString("en-US");
}
function fromLb(lb) {
  if (state.unit === "kg") return lb / LB_PER_KG;
  return lb;
}
function toLb(n) {
  return state.unit === "kg" ? n * LB_PER_KG : n;
}
function num(n) {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
function weightText(lb, bodyweight) {
  if (bodyweight && (!lb || lb < 0.5)) return "BW";
  return `${num(fromLb(lb))} ${state.unit}`;
}
function volumeText(lb) {
  return `${comma(fromLb(lb))} ${state.unit}`;
}
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function go(screen, extra = {}, replace = false) {
  const prev = state.screen;
  Object.assign(state, extra, { screen });
  if (screen !== "motion") state.motionPlaying = false;
  const url = hashFor();
  const snap = { screen, detailId: state.detailId, templateId: state.templateId, historyId: state.historyId, programId: state.programId };
  if (replace) history.replaceState(snap, "", url);
  else if (prev !== screen) history.pushState(snap, "", url);
  save();
  render();
}
function hashFor() {
  if (state.screen === "detail") return `#detail/${state.detailId}`;
  if (state.screen === "template") return `#template/${state.templateId}`;
  if (state.screen === "history-detail") return `#history/${state.historyId}`;
  if (state.screen === "program") return `#program/${state.programId}`;
  return `#${state.screen}`;
}
function readHash() {
  const [head, id] = location.hash.replace("#", "").split("/");
  const screen = head || "home";
  if (id && screen === "detail") state.detailId = id;
  if (id && screen === "template") state.templateId = id;
  if (id && screen === "history-detail") state.historyId = id;
  if (id && screen === "program") state.programId = id;
  if (screen === "workout" && !state.session) return go("home", {}, true);
  state.screen = ["home","history","history-detail","progress","library","detail","profile","programs","program","templates","template","settings","help","workout","rest","log","complete","motion"].includes(screen) ? screen : "home";
}

function historyItems() {
  const seeded = SEEDED.map((h) => ({ ...h, name: templateById(h.templateId).name, category: templateById(h.templateId).category, count: templateById(h.templateId).items.length }));
  return state.extra.concat(seeded);
}
function synthLogs(entry) {
  if (entry.logs) return entry;
  const t = templateById(entry.templateId);
  const logs = [];
  t.items.forEach(([id, sets, reps, weight]) => {
    for (let i = 0; i < sets; i++) logs.push({ exerciseId: id, setIndex: i, weightLb: weight, reps });
  });
  return { ...entry, logs, exercises: t.items.map(([id, sets]) => ({ exerciseId: id, sets })) };
}

function currentEx() {
  return state.session.exercises[state.session.exerciseIndex];
}
function metaOf(slot) { return byId[slot.exerciseId]; }
function restLeft() {
  const s = state.session;
  if (!s?.resting) return 0;
  if (s.restPaused != null) return s.restPaused;
  return Math.max(0, (s.restUntil - Date.now()) / 1000);
}
function sessionVolume() {
  return (state.session?.logs || []).reduce((sum, l) => sum + l.weightLb * l.reps, 0);
}
function elapsedSec() {
  if (!state.session) return 0;
  return (Date.now() - state.session.startedAt) / 1000;
}

function beginTemplate(template, focusId) {
  const exercises = template.items.map(([exerciseId, sets, reps, weight, rest]) => ({
    exerciseId, sets, reps, weight, rest: rest || state.restDefault, done: Array(sets).fill(false)
  }));
  let exerciseIndex = 0;
  if (focusId) {
    const i = exercises.findIndex((e) => e.exerciseId === focusId);
    if (i >= 0) exerciseIndex = i;
  }
  state.session = {
    id: `s${Date.now()}`, templateId: template.id, name: template.name, category: template.category,
    startedAt: Date.now(), exerciseIndex, setIndex: 0, exercises, logs: [],
    resting: false, restUntil: null, restPaused: null, restTotal: 45
  };
  state.metric = "weight";
  state.summary = null;
  go("workout");
}
function startTemplate(id) {
  const template = templateById(id);
  if (!template) return;
  state.templateId = id;
  if (state.session) {
    ask("Replace the workout in progress?", "Starting another session ends the current one.", [
      ["replace", "Start new", "btn-ink"],
      ["resume", "Resume current", "ghost"]
    ], (choice) => {
      if (choice === "replace") { state.session = null; beginTemplate(template); }
      else go("workout");
    });
    return;
  }
  beginTemplate(template);
}
function startExercise() {
  const ex = byId[state.detailId];
  const faux = { id: `single-${ex.id}`, name: ex.name, category: "Strength", minutes: 20, items: [[ex.id, ex.sets, ex.reps, ex.weight, state.restDefault]] };
  if (state.session) {
    ask("Replace the workout in progress?", `${ex.name} will start as its own session.`, [
      ["replace", "Start new", "btn-ink"],
      ["resume", "Resume current", "ghost"]
    ], (choice) => { if (choice === "replace") { state.session = null; beginTemplate(faux); } else go("workout"); });
    return;
  }
  beginTemplate(faux);
}

function openLog() {
  const slot = currentEx();
  const meta = metaOf(slot);
  const shown = meta.bodyweight && slot.weight < 0.5 ? "0" : num(fromLb(slot.weight));
  state.draft = { weight: shown === "BW" ? "0" : shown, reps: String(slot.reps) };
  state.logFocus = state.metric === "reps" ? "reps" : "weight";
  logFresh = true;
  go("log");
}
function commitLog() {
  const s = state.session;
  const slot = currentEx();
  const meta = metaOf(slot);
  const reps = Math.max(0, parseInt(state.draft.reps, 10) || 0);
  const weightLb = Math.max(0, toLb(parseFloat(state.draft.weight) || 0));
  if (reps < 1) { toast("Add at least one rep"); return; }
  if (weightLb < 0.5 && !meta.bodyweight) { toast("Add a working weight"); return; }
  slot.weight = weightLb;
  slot.reps = reps;
  slot.done[s.setIndex] = true;
  const restFor = slot.rest;
  s.logs.push({ exerciseId: slot.exerciseId, setIndex: s.setIndex, weightLb, reps });
  const moreSets = s.setIndex < slot.sets - 1;
  const moreEx = s.exerciseIndex < s.exercises.length - 1;
  if (moreSets) s.setIndex += 1;
  else if (moreEx) { s.exerciseIndex += 1; s.setIndex = 0; }
  else { finish(false); return; }
  startRest(restFor);
  go("rest", {}, true);
}
function startRest(seconds) {
  const s = state.session;
  s.resting = true;
  s.restTotal = seconds;
  s.restPaused = null;
  s.restUntil = Date.now() + seconds * 1000;
}
function endRest() {
  const s = state.session;
  if (!s) return;
  s.resting = false;
  s.restUntil = null;
  s.restPaused = null;
  save();
}
function skipRest() {
  endRest();
  go("workout", {}, true);
}
function pauseRest() {
  const s = state.session;
  if (!s?.resting) return;
  if (s.restPaused != null) {
    s.restUntil = Date.now() + s.restPaused * 1000;
    s.restPaused = null;
  } else {
    s.restPaused = restLeft();
  }
  paintLive();
}
function finish(early) {
  const s = state.session;
  if (!s) { go("home"); return; }
  if (!s.logs.length) { state.session = null; save(); go("home"); toast("Workout discarded"); return; }
  const minutes = Math.max(1, Math.round(elapsedSec() / 60));
  const volume = sessionVolume();
  const exercises = new Set(s.logs.map((l) => l.exerciseId)).size;
  const prev = historyItems().find((h) => h.name === s.name);
  state.summary = {
    id: s.id, date: new Date().toISOString().slice(0, 10), templateId: s.templateId,
    name: s.name, category: s.category, minutes, count: exercises, volume,
    logs: s.logs, exercises: s.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets })),
    deltas: prev ? {
      volume: pct(volume, estimateVolume(prev)),
      calories: pct(Math.round(minutes * 11.5), Math.round((prev.minutes || minutes) * 11.5)),
      time: pct(minutes, prev.minutes || minutes)
    } : null
  };
  state.extra.unshift(state.summary);
  state.session = null;
  state.historyId = state.summary.id;
  save();
  go("complete");
  if (early) toast("Workout saved");
}
function pct(now, before) {
  if (!before) return 0;
  return Math.round(((now - before) / before) * 100);
}
function estimateVolume(entry) {
  if (entry.volume) return entry.volume;
  const t = templateById(entry.templateId);
  if (!t) return 0;
  return t.items.reduce((sum, [, sets, reps, weight]) => sum + sets * reps * weight, 0);
}
function nudge(dir) {
  const slot = currentEx();
  const meta = metaOf(slot);
  if (state.metric === "reps") slot.reps = Math.max(1, slot.reps + dir);
  else {
    const step = state.unit === "kg" ? LB_PER_KG * 2.5 : 5;
    slot.weight = Math.max(0, slot.weight + dir * step);
    if (meta.bodyweight && slot.weight < 2) slot.weight = 0;
  }
  paintWorkout();
}
function jumpTo(index) {
  const s = state.session;
  s.exerciseIndex = index;
  const slot = s.exercises[index];
  const next = slot.done.findIndex((d) => !d);
  s.setIndex = next === -1 ? slot.sets - 1 : next;
  endRest();
  closeSheet();
  if (state.screen !== "workout") go("workout", {}, true);
  else paintWorkout();
}

function ask(title, body, actions, onPick) {
  state.modal = { title, body, actions, onPick };
  paintModal();
}
function closeModal() {
  state.modal = null;
  document.getElementById("modal").hidden = true;
}
function paintModal() {
  const m = state.modal;
  const root = document.getElementById("modal");
  if (!m) { root.hidden = true; return; }
  root.hidden = false;
  document.getElementById("modal-title").textContent = m.title;
  document.getElementById("modal-body").textContent = m.body;
  document.getElementById("modal-actions").innerHTML = m.actions.map(([id, label, style]) =>
    `<button class="btn ${style}" type="button" data-action="modal" data-choice="${id}">${esc(label)}</button>`).join("");
}

function setRing(id, ratio) {
  const c = document.getElementById(id);
  if (!c) return;
  const len = Number(c.dataset.c);
  c.style.strokeDasharray = String(len);
  c.style.strokeDashoffset = String(len * (1 - Math.max(0, Math.min(1, ratio))));
}
function toggleSaved(id) {
  if (state.saved[id]) delete state.saved[id];
  else state.saved[id] = true;
  save();
  toast(state.saved[id] ? "Saved" : "Removed");
  render();
}

function muscleSVG(ex) {
  const face = ex.view === "back" ? "back" : "front";
  const cls = (id) => ex.hot.includes(id) ? "is-hot" : ex.warm.includes(id) ? "is-warm" : "";
  const front = `
    <g class="muscle ${cls("shoulders")}"><ellipse cx="34" cy="58" rx="12" ry="9"/><ellipse cx="106" cy="58" rx="12" ry="9"/></g>
    <g class="muscle ${cls("chest")}"><ellipse cx="54" cy="74" rx="14" ry="11"/><ellipse cx="86" cy="74" rx="14" ry="11"/></g>
    <g class="muscle ${cls("biceps")}"><ellipse cx="26" cy="86" rx="7" ry="14"/><ellipse cx="114" cy="86" rx="7" ry="14"/></g>
    <g class="muscle ${cls("abs")}"><rect x="58" y="90" width="24" height="28" rx="6"/></g>
    <g class="muscle ${cls("quads")}"><ellipse cx="52" cy="150" rx="12" ry="22"/><ellipse cx="88" cy="150" rx="12" ry="22"/></g>
    <g class="muscle ${cls("calves")}"><ellipse cx="50" cy="192" rx="7" ry="12"/><ellipse cx="90" cy="192" rx="7" ry="12"/></g>`;
  const back = `
    <g class="muscle ${cls("traps")}"><ellipse cx="70" cy="52" rx="22" ry="8"/></g>
    <g class="muscle ${cls("shoulders")}"><ellipse cx="34" cy="58" rx="11" ry="8"/><ellipse cx="106" cy="58" rx="11" ry="8"/></g>
    <g class="muscle ${cls("lats")}"><ellipse cx="48" cy="86" rx="16" ry="20"/><ellipse cx="92" cy="86" rx="16" ry="20"/></g>
    <g class="muscle ${cls("triceps")}"><ellipse cx="24" cy="82" rx="6" ry="13"/><ellipse cx="116" cy="82" rx="6" ry="13"/></g>
    <g class="muscle ${cls("glutes")}"><ellipse cx="54" cy="124" rx="13" ry="10"/><ellipse cx="86" cy="124" rx="13" ry="10"/></g>
    <g class="muscle ${cls("hamstrings")}"><ellipse cx="52" cy="156" rx="11" ry="18"/><ellipse cx="88" cy="156" rx="11" ry="18"/></g>
    <g class="muscle ${cls("calves")}"><ellipse cx="50" cy="192" rx="7" ry="12"/><ellipse cx="90" cy="192" rx="7" ry="12"/></g>`;
  return `<svg viewBox="0 0 140 210" aria-hidden="true">
    <path fill="#F5F5F4" stroke="#D4D4D4" stroke-width="1.4" d="M70 16c8 0 13 6 13 12 0 5-3 9-7 10 2 2 6 3 10 4 18 5 30 20 30 38 0 10-3 16-8 20l2 22c8 3 13 10 14 18l4 36c1 10-6 16-15 16h-8l-4-30-6 30h-12l-6-36h-2l-6 36H57l-6-30-4 30h-8c-9 0-16-6-15-16l4-36c1-8 6-15 14-18l2-22c-5-4-8-10-8-20 0-18 12-33 30-38 4-1 8-2 10-4-4-1-7-5-7-10 0-6 5-12 13-12z"/>
    ${face === "back" ? back : front}
  </svg>`;
}

function lineChart(series) {
  const w = 640, h = 220, l = 36, r = 8, t = 16, b = 28;
  const min = 80, max = 210;
  const x = (i) => l + (series.length === 1 ? 0 : (i * (w - l - r)) / (series.length - 1));
  const y = (v) => t + (1 - (v - min) / (max - min)) * (h - t - b);
  const d = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const base = (h - b).toFixed(1);
  const area = `${d} L${x(series.length - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;
  const grids = [100, 150, 200].map((g) => {
    const yy = y(g);
    return `<line x1="${l}" y1="${yy}" x2="${w - r}" y2="${yy}" stroke="rgba(255,255,255,.08)"/><text x="0" y="${yy + 4}" fill="#9A9A9A" font-size="12">${g}</text>`;
  }).join("");
  const dots = series.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="4.5" fill="#0A0A0A" stroke="#F0372D" stroke-width="3"/>`).join("");
  const labels = series.map((p, i) => `<text x="${x(i)}" y="${h - 6}" text-anchor="middle" fill="#9A9A9A" font-size="12">${esc(p.label)}</text>`).join("");
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Strength trend from ${esc(series[0].label)} to ${esc(series.at(-1).label)}">${grids}<path d="${area}" fill="rgba(240,55,45,0.12)" stroke="none"/><path d="${d}" fill="none" stroke="#F0372D" stroke-width="3" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#F0372D" stroke-width="3" class="draw"/>${dots}${labels}</svg>`;
}

function filteredExercises() {
  const q = state.libraryQuery.trim().toLowerCase();
  return EXERCISES.filter((e) => {
    const facet = state.libraryFilter === "all" || e.filter === state.libraryFilter;
    const text = !q || `${e.name} ${e.region} ${e.equipment} ${e.type}`.toLowerCase().includes(q);
    return facet && text;
  });
}

function isoDay(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function hoursText(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}
function entryThumb(entry) {
  const t = entry.items ? entry : templateById(entry.templateId);
  const id = t?.items?.[0]?.[0];
  return id && byId[id] ? byId[id].thumb : "assets/thumb-bench.jpg";
}
function paintHome() {
  const today = templateById("upper-body");
  const live = state.session;
  document.getElementById("start-label").textContent = live ? "Resume Workout" : "Start Workout";
  document.getElementById("feature-name").textContent = live ? live.name : today.name;
  document.getElementById("feature-meta").textContent = live
    ? `${live.exercises.length} exercises · in progress`
    : `${today.items.length} exercises · ${today.minutes} min · ${today.focus}`;

  const items = historyItems()
    .map((h) => ({ ...h, volume: estimateVolume(h) }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = items[0] ? new Date(`${items[0].date}T12:00:00`) : new Date();
  const monday = new Date(latest);
  monday.setDate(latest.getDate() - ((latest.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = isoDay(d);
    const hits = items.filter((h) => h.date === key);
    return {
      volume: hits.reduce((sum, h) => sum + h.volume, 0),
      minutes: hits.reduce((sum, h) => sum + (h.minutes || 0), 0),
      count: hits.length
    };
  });
  const done = week.reduce((sum, d) => sum + d.count, 0);
  const goal = parseInt(PROGRAMS[0].days, 10) || done;
  const max = Math.max(...week.map((d) => d.volume), 1);
  document.getElementById("week-score").textContent = `${done}/${goal} workouts`;
  document.getElementById("week-bars").innerHTML = week.map((d) =>
    `<span class="${d.count ? "" : "is-rest"}" style="--h:${d.volume ? Math.max(28, Math.round((d.volume / max) * 100)) : 22}%"></span>`).join("");
  const mins = week.reduce((sum, d) => sum + d.minutes, 0);
  document.getElementById("home-volume").textContent = volumeText(week.reduce((sum, d) => sum + d.volume, 0));
  document.getElementById("home-time").textContent = hoursText(mins);
  document.getElementById("home-cal").textContent = comma(Math.round(mins * 11.5));

  const plan = PROGRAMS[0].plan;
  const at = Math.max(0, plan.findIndex(([, name]) => name === items[0]?.name));
  const [dayLabel, nextName] = plan[(at + 1) % plan.length];
  const next = TEMPLATES.find((t) => t.name === nextName) || TEMPLATES[0];
  document.getElementById("next-up").innerHTML = `<button class="act-row" type="button" data-go="template" data-id="${esc(next.id)}">
    <img class="thumb" src="${entryThumb(next)}" alt=""><span class="link-copy"><strong>${esc(next.name)}</strong><small>${esc(dayLabel)} · ${next.items.length} exercises · ${next.minutes} min</small></span>
    <svg class="icon"><use href="#i-chevron"/></svg></button>`;

  const recent = items.slice(0, 4);
  document.getElementById("recent-list").innerHTML = recent.length ? recent.map((h) => `<button class="act-row" type="button" data-go="history-detail" data-id="${esc(h.id)}">
    <img class="thumb" src="${entryThumb(h)}" alt=""><span class="link-copy"><strong>${esc(h.name)}</strong><small>${formatDate(h.date)}</small></span>
    <span class="act-meta"><span><svg class="icon"><use href="#i-clock"/></svg>${h.minutes} min</span><span><svg class="icon"><use href="#i-workouts"/></svg>${volumeText(h.volume)}</span></span>
    <svg class="icon chev"><use href="#i-chevron"/></svg></button>`).join("") : `<p class="empty">No workouts yet</p>`;
}
function paintLibrary() {
  document.getElementById("library-search").value = state.libraryQuery;
  document.getElementById("library-chips").innerHTML = FILTERS.map(([id, label]) =>
    `<button type="button" data-action="library-filter" data-filter="${id}" class="${state.libraryFilter === id ? "is-on" : ""}">${label}</button>`).join("");
  const rows = filteredExercises();
  document.getElementById("library-list").innerHTML = rows.length ? rows.map(rowHTML).join("") :
    `<div class="empty"><p>No exercises found</p><button class="btn btn-line" type="button" data-action="clear-search">Clear search</button></div>`;
}
function rowHTML(e) {
  return `<button class="ex-row" type="button" data-go="detail" data-id="${e.id}">
    <img class="thumb" src="${e.thumb}" alt="" /><span class="ex-copy"><strong>${esc(e.name)}</strong><small>${esc(e.region)} · ${esc(e.type)}</small></span>
    <svg class="icon"><use href="#i-chevron"/></svg></button>`;
}
function paintDetail() {
  const e = byId[state.detailId] || EXERCISES[0];
  state.detailId = e.id;
  document.getElementById("detail-title").textContent = e.name;
  document.getElementById("detail-sub").textContent = `${e.region} · ${e.type}`;
  const photo = document.getElementById("detail-photo");
  photo.src = e.still || e.thumb;
  photo.alt = `${e.name} demonstration`;
  const save = document.getElementById("detail-save");
  save.classList.toggle("is-saved", !!state.saved[e.id]);
  save.setAttribute("aria-pressed", state.saved[e.id] ? "true" : "false");
  document.getElementById("muscle-card").innerHTML = `${muscleSVG(e)}<div><p class="fine">Primary Muscles</p><p class="strong">${esc(e.primary)}</p>${e.secondary ? `<p class="fine">Secondary Muscles</p><p class="strong">${esc(e.secondary)}</p>` : ""}</div>`;
  document.getElementById("detail-tabs").innerHTML = DETAIL_TABS.map((tab) =>
    `<button type="button" role="tab" data-action="detail-tab" data-tab="${tab}" class="${state.detailTab === tab ? "is-on" : ""}">${tab}</button>`).join("");
  const panel = document.getElementById("detail-panel");
  if (state.detailTab === "Instructions") {
    panel.innerHTML = `<ol class="steps">${e.steps.map((s, i) => `<li><span class="num">${i + 1}</span><span>${esc(s)}</span></li>`).join("")}</ol>`;
  } else if (state.detailTab === "Sets & Reps") {
    panel.innerHTML = `<div class="rx">
      <div><strong>${e.sets} sets</strong><span>Working sets</span></div>
      <div><strong>${e.reps} reps</strong><span>Target</span></div>
      <div><strong>${weightText(e.weight, e.bodyweight)}</strong><span>${e.bodyweight ? "Added load" : "Working weight"}</span></div>
      <div><strong>${e.rest} sec</strong><span>Rest · ${esc(e.tempo)} tempo</span></div>
      <div><strong>${esc(e.equipment)}</strong><span>Equipment</span></div>
    </div>`;
  } else {
    panel.innerHTML = `<ul class="tips">${(e.tips || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  }
}
function paintHistory() {
  document.getElementById("history-chips").innerHTML = HISTORY_FILTERS.map((f) =>
    `<button type="button" data-action="history-filter" data-filter="${f}" class="${state.historyFilter === f ? "is-on" : ""}">${f}</button>`).join("");
  const items = historyItems().filter((h) => state.historyFilter === "All" || h.category === state.historyFilter);
  document.getElementById("history-list").innerHTML = items.map((h) => {
    const t = templateById(h.templateId);
    const thumb = t ? byId[t.items[0][0]].thumb : "assets/thumb-bench.jpg";
    return `<p class="date-label">${formatDate(h.date)}</p>
      <button class="ex-row" type="button" data-go="history-detail" data-id="${esc(h.id)}">
        <img class="thumb" src="${thumb}" alt=""><span class="ex-copy"><strong>${esc(h.name)}</strong><small>${h.count} exercises · ${h.minutes} min</small></span>
        <svg class="icon"><use href="#i-chevron"/></svg></button>`;
  }).join("") || `<div class="empty"><p>Nothing in ${esc(state.historyFilter)} yet</p></div>`;
}
function paintHistoryDetail() {
  const entry = historyItems().map(synthLogs).find((h) => h.id === state.historyId) || synthLogs(historyItems()[0]);
  state.historyId = entry.id;
  document.getElementById("hd-title").textContent = entry.name;
  const groups = {};
  (entry.logs || []).forEach((l) => { (groups[l.exerciseId] ||= []).push(l); });
  const volume = entry.volume || (entry.logs || []).reduce((s, l) => s + l.weightLb * l.reps, 0);
  document.getElementById("hd-body").innerHTML = `
    <p class="note">${formatDate(entry.date)} · ${entry.minutes} min · ${volumeText(volume)}</p>
    ${Object.entries(groups).map(([id, logs]) => {
      const e = byId[id];
      return `<div class="day-line"><strong>${esc(e?.name || id)}</strong><span>${logs.map((l) => `${weightText(l.weightLb, e?.bodyweight)} × ${l.reps}`).join("  ·  ")}</span></div>`;
    }).join("")}`;
}
function paintProgress() {
  document.getElementById("progress-tabs").innerHTML = PROGRESS_TABS.map((tab) =>
    `<button type="button" data-action="progress-tab" data-tab="${tab}" class="${state.progressTab === tab ? "is-on" : ""}">${tab}</button>`).join("");
  const body = document.getElementById("progress-body");
  if (state.progressTab === "Overview") {
    const series = state.progressRange === "month" ? MONTH_SERIES : LONG_SERIES;
    body.innerHTML = `
      <div class="chart-card">
        <div class="chart-head"><h2>Strength Progress</h2><button type="button" data-action="progress-tab" data-tab="Strength">View All ›</button></div>
        ${lineChart(series)}
      </div>
      <div class="dark-block"><div class="block-head"><h2>Top Lifts</h2></div>
        ${LIFTS.map((l) => `<button class="lift-row" type="button" data-go="detail" data-id="${l.id}"><span><strong>${l.name}</strong><small style="display:block;color:#9A9A9A">${weightText(l.weight)}</small></span><span class="delta">+${l.delta}%</span></button>`).join("")}
      </div>
      <div class="dark-block"><div class="block-head"><h2>Workout Volume</h2><span style="color:#9A9A9A;font-size:13px">This week</span></div>
        <div class="vol-bars">${[40,70,48,88,100,62,30].map((h) => `<span style="--h:${h}%"></span>`).join("")}</div>
        <div class="vol-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      </div>`;
  } else if (state.progressTab === "Workouts") {
    body.innerHTML = `<div class="dark-block">${historyItems().slice(0, 6).map((h) =>
      `<button class="dark-row" type="button" data-go="history-detail" data-id="${esc(h.id)}"><span><strong>${esc(h.name)}</strong><small style="display:block;color:#9A9A9A">${formatDate(h.date)} · ${h.minutes} min</small></span><span class="delta">${volumeText(h.volume || estimateVolume(h))}</span></button>`).join("")}</div>`;
  } else if (state.progressTab === "Strength") {
    body.innerHTML = LIFTS.map((l) => `<button class="dark-block lift-row" type="button" data-go="detail" data-id="${l.id}" style="width:100%">
      <span><strong>${l.name}</strong><small style="display:block;color:#9A9A9A">Best set</small><span class="mini">${l.bars.map((b) => `<i style="--h:${b}%"></i>`).join("")}</span></span>
      <span><strong>${weightText(l.weight)}</strong><span class="delta">+${l.delta}%</span></span></button>`).join("");
  } else {
    const weight = state.unit === "kg" ? "83.5 kg" : "184 lb";
    const waist = state.unit === "kg" ? "84 cm" : "33 in";
    body.innerHTML = `<div class="dark-block">
      <div class="lift-row"><span>Body weight</span><strong>${weight}</strong></div>
      <div class="lift-row"><span>Waist</span><strong>${waist}</strong></div>
      <div class="lift-row"><span>Last check-in</span><strong>Nov 1</strong></div>
    </div><p class="note">These are the measurements on this device. Photos are not stored.</p>`;
  }
}
function paintPrograms() {
  document.getElementById("program-list").innerHTML = PROGRAMS.map((p) =>
    `<button class="program-card" type="button" data-go="program" data-id="${p.id}"><h2>${esc(p.name)}</h2><p>${esc(p.days)} · ${esc(p.blurb)}</p></button>`).join("");
}
function paintProgram() {
  const p = PROGRAMS.find((x) => x.id === state.programId) || PROGRAMS[0];
  document.getElementById("program-title").textContent = p.name;
  document.getElementById("program-body").innerHTML = `<p class="note">${esc(p.blurb)}</p>${p.plan.map(([day, name]) => {
    const t = TEMPLATES.find((x) => x.name === name);
    return `<button class="day-line" type="button" data-go="template" data-id="${t.id}" style="width:100%;background:none;border-left:0;border-right:0;border-bottom:0"><strong>${esc(day)}</strong><span>${esc(name)}</span></button>`;
  }).join("")}`;
}
function paintTemplates() {
  document.getElementById("template-list").innerHTML = allTemplates().map((t) =>
    `<button class="ex-row" type="button" data-go="template" data-id="${esc(t.id)}"><img class="thumb" src="${byId[t.items[0][0]].thumb}" alt=""><span class="ex-copy"><strong>${esc(t.name)}</strong><small>${t.items.length} exercises · ${t.minutes || "Custom"} min</small></span><svg class="icon"><use href="#i-chevron"/></svg></button>`).join("");
}
function paintTemplate() {
  const t = templateById(state.templateId) || TEMPLATES[0];
  state.templateId = t.id;
  document.getElementById("template-title").textContent = t.name;
  document.getElementById("template-body").innerHTML = `<p class="note">${esc(t.category || "Custom")} · ${esc(t.focus || "Saved from a finished session")}</p>` +
    t.items.map(([id, sets, reps, weight]) => {
      const e = byId[id];
      return `<div class="day-line"><strong>${esc(e.name)}</strong><span>${sets} × ${reps} · ${weightText(weight, e.bodyweight)}</span></div>`;
    }).join("");
}
function paintSettings() {
  document.querySelectorAll("#unit-seg button").forEach((b) => b.classList.toggle("is-on", b.dataset.unit === state.unit));
  document.getElementById("rest-chips").innerHTML = [30, 45, 60, 90].map((n) =>
    `<button type="button" data-action="set-rest" data-rest="${n}" class="${state.restDefault === n ? "is-on" : ""}">${n}s</button>`).join("");
}
function paintWorkout() {
  const s = state.session;
  if (!s) return;
  const slot = currentEx();
  const meta = metaOf(slot);
  document.getElementById("wk-name").textContent = meta.name;
  document.getElementById("wk-meta").textContent = `${meta.region} · ${meta.type}`;
  const bg = document.getElementById("wk-bg");
  const plate = document.getElementById("wk-plate");
  const screen = document.querySelector(".workout");
  bg.dataset.exerciseId = meta.id;
  if (meta.cinematic && meta.motion) {
    screen.classList.remove("is-studio");
    bg.src = meta.motion;
    bg.alt = meta.name;
    plate.hidden = true;
  } else {
    screen.classList.add("is-studio");
    bg.src = "assets/gym-dark.jpg";
    bg.alt = "";
    plate.hidden = false;
    const img = document.getElementById("wk-plate-img");
    img.src = meta.thumb;
    img.alt = meta.name;
  }
  const save = document.getElementById("wk-save");
  save.classList.toggle("is-saved", !!state.saved[meta.id]);
  document.querySelector('[data-metric="weight"]').classList.toggle("is-selected", state.metric === "weight");
  document.querySelector('[data-metric="reps"]').classList.toggle("is-selected", state.metric === "reps");
  paintLive();
}
function paintLive() {
  const s = state.session;
  if (!s) return;
  const slot = currentEx();
  const meta = metaOf(slot);
  document.getElementById("wk-set").textContent = `Set ${s.setIndex + 1}/${slot.sets}`;
  document.getElementById("wk-fraction").textContent = `${s.setIndex + 1}/${slot.sets}`;
  document.getElementById("wk-bar").style.width = `${((s.setIndex + 1) / slot.sets) * 100}%`;
  const wLabel = document.getElementById("wk-weight");
  const unit = document.getElementById("wk-unit");
  if (meta.bodyweight && slot.weight < 0.5) { wLabel.textContent = "BW"; unit.textContent = ""; }
  else { wLabel.textContent = num(fromLb(slot.weight)); unit.textContent = state.unit; }
  document.getElementById("wk-reps").textContent = String(slot.reps);
  const resting = s.resting;
  const left = resting ? restLeft() : slot.rest;
  const total = resting ? s.restTotal : slot.rest;
  setRing("wk-ring", resting ? left / total : 1);
  document.getElementById("wk-clock").textContent = clock(left);
  document.getElementById("wk-clock-cap").textContent = resting ? "Rest" : "Rest Time";
  document.getElementById("wk-vol").textContent = volumeText(sessionVolume());
  document.getElementById("wk-sets").textContent = String(s.logs.length);
  document.getElementById("wk-elapsed").textContent = clock(elapsedSec());
  const primary = document.getElementById("wk-primary");
  primary.textContent = resting ? "Skip Rest" : "Log Set";
  primary.dataset.mode = resting ? "skip" : "log";
  if (state.screen === "rest") {
    document.getElementById("rest-clock").textContent = clock(left);
    document.getElementById("rest-hint").textContent = s.restPaused != null ? "Tap to resume" : "Tap to pause";
    setRing("rest-ring", total ? left / total : 0);
    document.getElementById("rest-name").textContent = meta.name;
    document.getElementById("rest-detail").textContent = `${slot.reps} reps · ${weightText(slot.weight, meta.bodyweight)}`;
  }
  if (state.screen === "log") paintLogValues();
}
function paintLogValues() {
  document.getElementById("log-name").textContent = metaOf(currentEx()).name;
  document.getElementById("log-set").textContent = `Set ${state.session.setIndex + 1} of ${currentEx().sets}`;
  document.getElementById("log-weight-label").textContent = `Weight (${state.unit})`;
  document.getElementById("log-weight").textContent = state.draft.weight;
  document.getElementById("log-reps").textContent = state.draft.reps;
  document.getElementById("log-weight").classList.toggle("is-on", state.logFocus === "weight");
  document.getElementById("log-reps").classList.toggle("is-on", state.logFocus === "reps");
}
function paintComplete() {
  const sum = state.summary;
  if (!sum) return;
  document.getElementById("complete-name").textContent = sum.name;
  document.getElementById("complete-meta").textContent = `${sum.count} exercises · ${sum.minutes} min`;
  const cal = Math.round(sum.minutes * 11.5);
  const d = sum.deltas || {};
  const cell = (label, value, delta) => `<div><span>${label}</span><strong>${value}</strong>${delta == null ? "" : `<span class="delta ${delta < 0 ? "is-down" : ""}">${delta > 0 ? "↑" : delta < 0 ? "↓" : ""}${Math.abs(delta)}%</span>`}</div>`;
  document.getElementById("complete-stats").innerHTML =
    cell("Total Volume", volumeText(sum.volume), d.volume) +
    cell("Calories", comma(cal), d.calories) +
    cell("Active Time", `${sum.minutes} min`, d.time);
  const btn = document.getElementById("save-template");
  const exists = state.custom.some((t) => t.sourceId === sum.id);
  btn.textContent = exists ? "Saved" : "Save to Library";
  btn.disabled = exists;
}
function paintMotion() {
  const e = byId[state.detailId] || EXERCISES[0];
  const slot = document.getElementById("motion-slot");
  slot.dataset.exerciseId = e.id;
  const img = document.getElementById("motion-photo");
  img.src = e.motion || e.still || e.thumb;
  img.alt = e.motionName || e.name;
  document.getElementById("motion-title").textContent = e.motionName || e.name;
  document.getElementById("motion-sub").textContent = `${e.region} · ${e.type}`;
  document.getElementById("motion-range").value = String(state.motionTime);
  syncMotion(false);
  if (typeof window.ALDER_MOTION_MOUNT === "function" && slot.dataset.mounted !== e.id) {
    window.ALDER_MOTION_MOUNT(slot);
    slot.dataset.mounted = e.id;
  }
}
function phaseAt(t) {
  if (t < 8) return "setup";
  if (t < 22) return "movement";
  return "finish";
}
function syncMotion(emit) {
  const e = byId[state.detailId];
  if (!e) return;
  const phase = phaseAt(state.motionTime);
  document.querySelector(".motion").classList.remove("is-setup", "is-movement", "is-finish");
  document.querySelector(".motion").classList.add(`is-${phase}`);
  document.getElementById("motion-now").textContent = clock(state.motionTime);
  document.getElementById("motion-dur").textContent = "0:30";
  const cues = e.cues || [e.steps[0], e.steps[1] || e.steps[0], e.steps.at(-1)];
  const idx = phase === "setup" ? 0 : phase === "movement" ? 1 : 2;
  document.getElementById("motion-cue").textContent = cues[idx];
  document.getElementById("motion-phases").innerHTML = ["Setup", "Movement", "Finish"].map((name, i) =>
    `<button type="button" data-action="phase" data-phase="${["setup","movement","finish"][i]}" class="${phase === ["setup","movement","finish"][i] ? "is-on" : ""}">${i + 1} ${name}</button>`).join("");
  if (emit) {
    document.dispatchEvent(new CustomEvent("alder:motion", { detail: { exerciseId: e.id, phase, time: state.motionTime, duration: 30 } }));
  }
}
function openSequence() {
  const s = state.session;
  if (!s) return;
  document.getElementById("seq-title").textContent = s.name;
  document.getElementById("seq-stats").textContent = `${clock(elapsedSec())} · ${s.logs.length} sets · ${volumeText(sessionVolume())}`;
  document.getElementById("seq-list").innerHTML = s.exercises.map((slot, i) => {
    const meta = metaOf(slot);
    const pips = slot.done.map((done, n) => `<i class="${done ? "on" : n === slot.sets && false} ${i === s.exerciseIndex && n === s.setIndex ? "now" : ""} ${done ? "on" : ""}"></i>`).join("");
    return `<button class="seq-item" type="button" data-action="jump" data-index="${i}"><img src="${meta.thumb}" alt=""><span><strong>${esc(meta.name)}</strong><span class="pips">${slot.done.map((done, n) => `<i class="${done ? "on" : ""} ${i === s.exerciseIndex && n === s.setIndex && !done ? "now" : ""}"></i>`).join("")}</span></span></button>`;
  }).join("");
  document.getElementById("sequence-sheet").hidden = false;
}
function closeSheet() { document.getElementById("sequence-sheet").hidden = true; }

function syncChrome() {
  const tone = TONE[state.screen] || "light";
  document.body.dataset.tone = tone;
  document.body.classList.toggle("is-immersive", IMMERSIVE.has(state.screen));
  document.querySelectorAll(".screen").forEach((s) => { s.hidden = s.dataset.screen !== state.screen; });
  const tab = TAB_FOR[state.screen] || "";
  document.querySelectorAll("[data-tab]").forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle("is-active", on);
    if (on) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
}
function render() {
  syncChrome();
  const paint = {
    home: paintHome, library: paintLibrary, detail: paintDetail, history: paintHistory,
    "history-detail": paintHistoryDetail, progress: paintProgress, programs: paintPrograms,
    program: paintProgram, templates: paintTemplates, template: paintTemplate, settings: paintSettings,
    workout: paintWorkout, rest: paintLive, log: () => { paintLogValues(); }, complete: paintComplete, motion: paintMotion
  }[state.screen];
  paint?.();
  if (state.screen === "workout" || state.screen === "rest") paintLive();
}

function pressKey(key) {
  const field = state.logFocus;
  let cur = logFresh ? "" : String(state.draft[field] || "");
  if (key === "back") cur = cur.slice(0, -1);
  else {
    if (cur.length >= 4) return;
    cur += key;
  }
  logFresh = false;
  if (cur === "") cur = "0";
  state.draft[field] = String(parseInt(cur, 10));
  paintLogValues();
}
function logStep(field, dir) {
  state.logFocus = field;
  logFresh = true;
  const n = parseFloat(state.draft[field]) || 0;
  const step = field === "reps" ? 1 : (state.unit === "kg" ? 2.5 : 5);
  const next = Math.max(0, n + dir * step);
  state.draft[field] = field === "reps" ? String(next) : num(next);
  paintLogValues();
}

function tick() {
  const s = state.session;
  if (s?.resting && s.restPaused == null && Date.now() >= s.restUntil) {
    endRest();
    if (state.screen === "rest") go("workout", {}, true);
    else if (state.screen === "workout") paintLive();
    toast("Next set");
    return;
  }
  if (state.screen === "workout" || state.screen === "rest") paintLive();
}
function motionLoop(now) {
  if (state.screen === "motion" && state.motionPlaying && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    state.motionTime = (state.motionTime + 0.05) % 30;
    document.getElementById("motion-range").value = String(state.motionTime);
    syncMotion(Math.floor(state.motionTime) !== Math.floor(state.motionTime - 0.05));
  }
  motionFrame = requestAnimationFrame(motionLoop);
}

document.body.addEventListener("click", (e) => {
  const goEl = e.target.closest("[data-go]");
  if (goEl) {
    const screen = goEl.dataset.go;
    const id = goEl.dataset.id;
    if (screen === "detail" && id) state.detailId = id;
    if (screen === "template" && id) state.templateId = id;
    if (screen === "history-detail" && id) state.historyId = id;
    if (screen === "program" && id) state.programId = id;
    if (screen === "detail") state.detailTab = "Instructions";
    go(screen);
    return;
  }
  const act = e.target.closest("[data-action]");
  if (!act) return;
  const action = act.dataset.action;
  if (action === "start-today") {
    if (state.session) go("workout");
    else startTemplate("upper-body");
  } else if (action === "start-template") startTemplate(state.templateId);
  else if (action === "start-exercise") startExercise();
  else if (action === "back") history.back();
  else if (action === "library-filter") { state.libraryFilter = act.dataset.filter; paintLibrary(); }
  else if (action === "clear-search") { state.libraryQuery = ""; state.libraryFilter = "all"; paintLibrary(); }
  else if (action === "history-filter") { state.historyFilter = act.dataset.filter; paintHistory(); }
  else if (action === "progress-tab") { state.progressTab = act.dataset.tab; paintProgress(); }
  else if (action === "detail-tab") { state.detailTab = act.dataset.tab; paintDetail(); }
  else if (action === "toggle-range") {
    state.progressRange = state.progressRange === "month" ? "long" : "month";
    paintProgress();
    toast(state.progressRange === "month" ? "Showing this month" : "Showing 8 weeks");
  } else if (action === "set-unit") { state.unit = act.dataset.unit; save(); render(); }
  else if (action === "set-rest") { state.restDefault = Number(act.dataset.rest); save(); paintSettings(); }
  else if (action === "save-exercise") toggleSaved(state.screen === "workout" || state.screen === "motion" ? (state.screen === "workout" ? currentEx().exerciseId : state.detailId) : state.detailId);
  else if (action === "open-motion") {
    if (state.screen === "workout") state.detailId = currentEx().exerciseId;
    state.motionFrom = state.screen === "detail" ? "detail" : "workout";
    state.motionTime = 12;
    state.motionPlaying = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    go("motion");
  } else if (action === "close-motion") go(state.motionFrom || "detail", {}, true);
  else if (action === "phase") {
    state.motionTime = act.dataset.phase === "setup" ? 2 : act.dataset.phase === "movement" ? 12 : 24;
    syncMotion(true);
  } else if (action === "select-metric") { state.metric = act.dataset.metric; paintWorkout(); }
  else if (action === "nudge") nudge(Number(act.dataset.dir));
  else if (action === "primary") {
    if (document.getElementById("wk-primary").dataset.mode === "skip") skipRest();
    else openLog();
  } else if (action === "open-rest") {
    if (state.session?.resting) go("rest");
  } else if (action === "open-sequence") openSequence();
  else if (action === "close-sheet") closeSheet();
  else if (action === "jump") jumpTo(Number(act.dataset.index));
  else if (action === "close-log") go("workout", {}, true);
  else if (action === "close-rest") go("workout", {}, true);
  else if (action === "pause-rest") pauseRest();
  else if (action === "skip-rest") skipRest();
  else if (action === "log-focus") { state.logFocus = act.dataset.field; logFresh = true; paintLogValues(); }
  else if (action === "log-step") logStep(act.dataset.field, Number(act.dataset.dir));
  else if (action === "commit-log") commitLog();
  else if (action === "end-ask") {
    closeSheet();
    const n = state.session?.logs.length || 0;
    if (!n) ask("Discard this workout?", "No sets are logged yet.", [["discard", "Discard", "btn-ink"], ["keep", "Keep going", "ghost"]], (c) => { if (c === "discard") { state.session = null; save(); go("home"); } });
    else ask("End workout?", `You logged ${n} ${n === 1 ? "set" : "sets"}. Finishing keeps them in history.`, [["finish", "Finish workout", "btn-ink"], ["keep", "Keep going", "ghost"]], (c) => { if (c === "finish") finish(true); });
  } else if (action === "modal") {
    const choice = act.dataset.choice;
    const fn = state.modal?.onPick;
    closeModal();
    fn?.(choice);
  } else if (action === "view-workout") go("history-detail", { historyId: state.summary?.id });
  else if (action === "save-template") {
    const sum = state.summary;
    if (!sum || state.custom.some((t) => t.sourceId === sum.id)) return;
    const grouped = {};
    sum.logs.forEach((l) => { (grouped[l.exerciseId] ||= []).push(l); });
    state.custom.push({
      id: `custom-${sum.id}`, sourceId: sum.id, name: sum.name, category: sum.category, minutes: sum.minutes, focus: "Saved from a session",
      items: Object.entries(grouped).map(([id, logs]) => [id, logs.length, logs[0].reps, logs[0].weightLb, state.restDefault])
    });
    save();
    paintComplete();
    toast("Saved to templates");
  }
});

document.body.addEventListener("click", (e) => {
  const key = e.target.closest("[data-key]");
  if (!key || state.screen !== "log") return;
  pressKey(key.dataset.key);
});

document.getElementById("library-search").addEventListener("input", (e) => {
  state.libraryQuery = e.target.value;
  paintLibrary();
  document.getElementById("library-search").focus();
});
document.getElementById("search-form").addEventListener("submit", (e) => e.preventDefault());
document.getElementById("motion-range").addEventListener("input", (e) => {
  state.motionTime = Number(e.target.value);
  syncMotion(true);
});
document.querySelector(".motion-stage").addEventListener("click", (e) => {
  if (e.target.closest("button")) return;
  state.motionPlaying = !state.motionPlaying;
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (state.modal) closeModal();
    else if (!document.getElementById("sequence-sheet").hidden) closeSheet();
    else if (state.screen === "log") go("workout", {}, true);
    else if (state.screen === "rest") go("workout", {}, true);
    else if (state.screen === "motion") go(state.motionFrom || "detail", {}, true);
    else if (state.screen === "workout") document.querySelector('[data-action="end-ask"]').click();
    return;
  }
  if (state.screen === "log" && /^[0-9]$/.test(e.key)) { pressKey(e.key); e.preventDefault(); }
  if (state.screen === "log" && e.key === "Backspace") { pressKey("back"); e.preventDefault(); }
  if (state.screen === "rest" && e.key === " ") { e.preventDefault(); pauseRest(); }
});

window.addEventListener("popstate", () => { readHash(); render(); });

readHash();
history.replaceState({ screen: state.screen, detailId: state.detailId, templateId: state.templateId, historyId: state.historyId, programId: state.programId }, "", hashFor());
render();
setInterval(tick, 250);
motionFrame = requestAnimationFrame(motionLoop);
