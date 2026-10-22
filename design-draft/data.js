/* Sample log for the design draft. Not connected to the account. */
(function () {
  const EXERCISES = [
    {
      id: "barbell-bench-press",
      name: "Barbell Bench Press",
      short: "Bench press",
      region: "Chest",
      equipment: "Barbell",
      primary: "Chest",
      secondary: "Shoulders, triceps",
      rest: 90,
      photo: "../public/assets/thumb-bench.jpg",
      photoNote: "",
      steps: [
        "Lie back, plant your feet, and set your shoulder blades before you take the bar.",
        "Lower to mid-chest and press up while your ribs stay down.",
        "Lock out softly over the shoulders, then reset the next rep.",
      ],
    },
    {
      id: "close-grip-bench-press",
      name: "Close-Grip Bench Press",
      short: "Close-grip bench",
      region: "Arms",
      equipment: "Barbell",
      primary: "Triceps",
      secondary: "Chest",
      rest: 90,
      photo: "../public/assets/thumb-bench.jpg",
      photoNote: "Shared bench still. The grip in the photograph is not a close grip.",
      steps: [
        "Grip about shoulder width. Do not stack the hands together.",
        "Lower to the lower chest and keep the elbows closer than a wide bench.",
        "Press up and finish with the triceps.",
      ],
    },
    {
      id: "shoulder-press",
      name: "Shoulder Press",
      short: "Shoulder press",
      region: "Shoulders",
      equipment: "Dumbbells",
      perHand: true,
      primary: "Shoulders",
      secondary: "Triceps",
      rest: 75,
      photo: "../public/assets/thumb-shoulder.jpg",
      photoNote: "",
      steps: [
        "Sit tall, plant your feet, and set the dumbbells at shoulder height.",
        "Press straight up without leaning back hard.",
        "Lower until the elbows sit just below the shoulders.",
      ],
    },
    {
      id: "triceps-pushdown",
      name: "Triceps Pushdown",
      short: "Pushdown",
      region: "Arms",
      equipment: "Cable",
      primary: "Triceps",
      secondary: "Forearms",
      rest: 60,
      photo: "../public/assets/thumb-pushdown.jpg",
      photoNote: "",
      steps: [
        "Pin the elbows to your sides.",
        "Push the bar down until the arms are straight.",
        "Let it rise only to about chest height.",
      ],
    },
    {
      id: "barbell-row",
      name: "Barbell Row",
      short: "Row",
      region: "Back",
      equipment: "Barbell",
      primary: "Lats",
      secondary: "Traps, biceps",
      rest: 90,
      photo: "../public/assets/thumb-row.jpg",
      photoNote: "",
      steps: [
        "Hinge until the torso is near parallel and the back is flat.",
        "Pull the bar to the lower ribs.",
        "Lower until the arms are long.",
      ],
    },
    {
      id: "pull-up",
      name: "Pull-Up",
      short: "Pull-up",
      region: "Back",
      equipment: "Bodyweight",
      bodyweight: true,
      primary: "Lats",
      secondary: "Biceps",
      rest: 90,
      photo: "../public/assets/thumb-pullup.jpg",
      photoNote: "",
      steps: [
        "Hang with a grip just outside the shoulders.",
        "Pull the chest toward the bar and clear the chin without craning the neck.",
        "Lower all the way. Keep a little tension at the bottom.",
      ],
    },
    {
      id: "lat-pulldown",
      name: "Lat Pulldown",
      short: "Lat pulldown",
      region: "Back",
      equipment: "Cable",
      primary: "Lats",
      secondary: "Biceps",
      rest: 75,
      photo: "",
      photoNote: "No still. The catalog file for this lift is a pull-up.",
      steps: [
        "Sit tall and lock the thighs under the pads.",
        "Pull the bar to the upper chest, elbows down.",
        "Control the return until the arms are long.",
      ],
    },
    {
      id: "barbell-curl",
      name: "Barbell Curl",
      short: "Curl",
      region: "Arms",
      equipment: "Barbell",
      primary: "Biceps",
      secondary: "Forearms",
      rest: 60,
      photo: "../public/assets/thumb-curl.jpg",
      photoNote: "Start position. The still does not show the top of the curl.",
      steps: [
        "Stand tall with the bar at the thighs.",
        "Curl without swinging the hips.",
        "Lower for a full two-count.",
      ],
    },
    {
      id: "back-squat",
      name: "Back Squat",
      short: "Squat",
      region: "Legs",
      equipment: "Barbell",
      primary: "Quadriceps",
      secondary: "Glutes",
      rest: 120,
      photo: "../public/assets/thumb-squat.jpg",
      photoNote: "",
      steps: [
        "Set the bar on the upper back, not the neck.",
        "Break at the hips and knees together.",
        "Stand by driving the floor away.",
      ],
    },
    {
      id: "romanian-deadlift",
      name: "Romanian Deadlift",
      short: "Romanian deadlift",
      region: "Legs",
      equipment: "Barbell",
      primary: "Hamstrings",
      secondary: "Glutes",
      rest: 90,
      photo: "",
      photoNote: "No still. The shared catalog file is a deadlift setup, bar at the shins, not a hinge from the thighs.",
      steps: [
        "Start tall with the bar at the thighs.",
        "Push the hips back and slide the bar down the legs.",
        "Stand by driving the hips forward.",
      ],
    },
    {
      id: "barbell-deadlift",
      name: "Barbell Deadlift",
      short: "Deadlift",
      region: "Legs",
      equipment: "Barbell",
      primary: "Glutes, hamstrings",
      secondary: "Back",
      rest: 150,
      photo: "../public/assets/thumb-rdl.jpg",
      photoNote: "Setup, bar at the shins. Not a lockout.",
      steps: [
        "Stand with the bar over the mid-foot.",
        "Hinge, grip, and brace before the bar leaves the floor.",
        "Push the floor away and keep the bar close.",
      ],
    },
    {
      id: "leg-press",
      name: "Leg Press",
      short: "Leg press",
      region: "Legs",
      equipment: "Machine",
      primary: "Quadriceps",
      secondary: "Glutes",
      rest: 90,
      photo: "",
      photoNote: "No still. The catalog file for this lift is a squat.",
      steps: [
        "Place the feet about shoulder width on the platform.",
        "Lower until the knees travel, without the hips peeling off the pad.",
        "Press evenly through the whole foot. Do not lock the knees hard.",
      ],
    },
  ];

  const ROUTINES = [
    {
      id: "push-a",
      name: "Push",
      detail: "Bench first",
      focus: "Chest, shoulders, triceps",
      exerciseIds: ["barbell-bench-press", "shoulder-press", "close-grip-bench-press", "triceps-pushdown"],
    },
    {
      id: "push-b",
      name: "Push",
      detail: "Shoulders first",
      focus: "Shoulders, chest, triceps",
      exerciseIds: ["shoulder-press", "barbell-bench-press", "close-grip-bench-press", "triceps-pushdown"],
    },
    {
      id: "pull",
      name: "Pull",
      detail: "Row, pull-up, deadlift, curl",
      focus: "Back, biceps",
      exerciseIds: ["barbell-row", "pull-up", "barbell-deadlift", "barbell-curl"],
    },
    {
      id: "legs",
      name: "Legs",
      detail: "Squat, leg press, Romanian deadlift",
      focus: "Quads, hamstrings, glutes",
      exerciseIds: ["back-squat", "leg-press", "romanian-deadlift"],
    },
    {
      id: "chest",
      name: "Chest",
      detail: "Bench and close-grip",
      focus: "Chest, triceps",
      exerciseIds: ["barbell-bench-press", "close-grip-bench-press"],
    },
    {
      id: "back",
      name: "Back",
      detail: "Row, pull-up, pulldown",
      focus: "Lats, biceps",
      exerciseIds: ["barbell-row", "pull-up", "lat-pulldown"],
    },
  ];

  function sets() {
    return {
      "barbell-bench-press": [
        { lb: 185, reps: 5 },
        { lb: 185, reps: 5 },
        { lb: 185, reps: 4 },
        { lb: 175, reps: 6 },
      ],
      "shoulder-press": [
        { lb: 55, reps: 8 },
        { lb: 55, reps: 8 },
        { lb: 55, reps: 7 },
      ],
      "close-grip-bench-press": [
        { lb: 135, reps: 8 },
        { lb: 135, reps: 8 },
        { lb: 135, reps: 8 },
      ],
      "triceps-pushdown": [
        { lb: 50, reps: 12 },
        { lb: 50, reps: 12 },
        { lb: 45, reps: 12 },
      ],
      "barbell-row": [
        { lb: 155, reps: 8 },
        { lb: 155, reps: 8 },
        { lb: 155, reps: 7 },
      ],
      "pull-up": [
        { lb: 0, reps: 8 },
        { lb: 0, reps: 7 },
        { lb: 0, reps: 6 },
      ],
      "barbell-deadlift": [
        { lb: 275, reps: 5 },
        { lb: 275, reps: 5 },
        { lb: 275, reps: 4 },
      ],
      "barbell-curl": [
        { lb: 75, reps: 10 },
        { lb: 75, reps: 8 },
        { lb: 70, reps: 10 },
      ],
      "back-squat": [
        { lb: 225, reps: 5 },
        { lb: 225, reps: 5 },
        { lb: 225, reps: 5 },
      ],
      "leg-press": [
        { lb: 360, reps: 10 },
        { lb: 360, reps: 10 },
        { lb: 360, reps: 8 },
      ],
      "romanian-deadlift": [
        { lb: 185, reps: 8 },
        { lb: 185, reps: 8 },
        { lb: 185, reps: 8 },
      ],
    };
  }

  const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

  function volumeOf(exerciseId, setList) {
    const ex = byId[exerciseId];
    if (!ex || ex.bodyweight) return 0;
    const hands = ex.perHand ? 2 : 1;
    return setList.reduce((sum, set) => sum + set.lb * set.reps * hands, 0);
  }

  function sessionFromSets(meta, performed) {
    const exercises = Object.entries(performed).map(([id, list]) => ({
      id,
      sets: list.map((set) => ({ ...set })),
    }));
    const volume = exercises.reduce((sum, ex) => sum + volumeOf(ex.id, ex.sets), 0);
    const setCount = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    return { ...meta, exercises, volume, setCount, exerciseCount: exercises.length };
  }

  const performed = sets();
  function pick(ids) {
    return Object.fromEntries(ids.map((id) => [id, performed[id]]));
  }
  const monday = pick(["barbell-bench-press", "shoulder-press", "close-grip-bench-press", "triceps-pushdown"]);
  const tuesday = pick(["barbell-row", "pull-up", "barbell-deadlift", "barbell-curl"]);
  const wednesday = pick(["back-squat", "leg-press", "romanian-deadlift"]);

  const summary = (meta) => meta;

  const sessions = [
    summary({ id: "s-0929", date: "2026-09-29", routineId: "pull", name: "Pull", minutes: 54, volume: 9020, setCount: 12, exerciseCount: 4 }),
    summary({ id: "s-1001", date: "2026-10-01", routineId: "push-a", name: "Push", minutes: 50, volume: 10540, setCount: 13, exerciseCount: 4 }),
    summary({ id: "s-1003", date: "2026-10-03", routineId: "legs", name: "Legs", minutes: 46, volume: 16210, setCount: 9, exerciseCount: 3 }),
    summary({ id: "s-1006", date: "2026-10-06", routineId: "pull", name: "Pull", minutes: 55, volume: 8940, setCount: 12, exerciseCount: 4 }),
    summary({ id: "s-1008", date: "2026-10-08", routineId: "push-a", name: "Push", minutes: 51, volume: 10780, setCount: 13, exerciseCount: 4 }),
    summary({ id: "s-1010", date: "2026-10-10", routineId: "legs", name: "Legs", minutes: 47, volume: 16640, setCount: 9, exerciseCount: 3 }),
    summary({ id: "s-1013", date: "2026-10-13", routineId: "pull", name: "Pull", minutes: 56, volume: 9180, setCount: 12, exerciseCount: 4 }),
    sessionFromSets(
      { id: "s-1015", date: "2026-10-15", routineId: "push-a", name: "Push", minutes: 52 },
      monday
    ),
    sessionFromSets(
      { id: "s-1017", date: "2026-10-17", routineId: "legs", name: "Legs", minutes: 48 },
      wednesday
    ),
    sessionFromSets(
      { id: "s-1020", date: "2026-10-20", routineId: "pull", name: "Pull", minutes: 58 },
      tuesday
    ),
  ];

  const earlierWeeks = [];

  /* Tue Pull, Thu Push, Sat Legs. Rest on the days between. Thursday is not logged. */
  const week = [
    { date: "2026-10-19", dow: "Mon", day: 19, rest: true },
    { date: "2026-10-20", dow: "Tue", day: 20, routineId: "pull" },
    { date: "2026-10-21", dow: "Wed", day: 21, rest: true },
    { date: "2026-10-22", dow: "Thu", day: 22, routineId: "push-a", today: true },
    { date: "2026-10-23", dow: "Fri", day: 23, rest: true },
    { date: "2026-10-24", dow: "Sat", day: 24, routineId: "legs" },
    { date: "2026-10-25", dow: "Sun", day: 25, rest: true },
  ];

  const plannedDates = ["2026-09-29", "2026-10-01", "2026-10-03", "2026-10-06", "2026-10-08", "2026-10-10", "2026-10-13", "2026-10-15", "2026-10-17", "2026-10-20"];
  let sessionStreak = 0;
  for (let i = plannedDates.length - 1; i >= 0; i -= 1) {
    if (!sessions.some((s) => s.date === plannedDates[i])) break;
    sessionStreak += 1;
  }

  const weekOf = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const offset = (dt.getDay() + 6) % 7;
    dt.setDate(dt.getDate() - offset);
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${dt.getFullYear()}-${mm}-${dd}`;
  };
  const sumWeek = (start) => sessions.filter((s) => weekOf(s.date) === start).reduce((sum, s) => sum + s.volume, 0);
  const thisWeek = sumWeek("2026-10-19");
  const lastFull = sumWeek("2026-10-12");
  console.assert(sessions.some((s) => s.date === "2026-10-22") === false);
  console.assert(week.find((d) => d.today).routineId === "push-a");
  console.assert(week.filter((d) => !d.rest).length === 3);
  console.assert(thisWeek === 9465, thisWeek);
  console.assert(lastFull === 38225, lastFull);
  console.assert(sumWeek("2026-09-28") === 35770, sumWeek("2026-09-28"));
  console.assert(sumWeek("2026-10-05") === 36360, sumWeek("2026-10-05"));
  console.assert(sessionStreak === 10, sessionStreak);
  console.assert(sessions.find((s) => s.id === "s-1015").volume === 11150);
  console.assert(sessions.find((s) => s.id === "s-1020").volume === 9465);
  console.assert(sessions.find((s) => s.id === "s-1017").volume === 17895);

  window.LiftData = {
    TODAY: "2026-10-22",
    EXERCISES,
    ROUTINES,
    sessions,
    earlierWeeks,
    week,
    byId,
    volumeOf,
    sessionStreak,
    thisWeekVolume: thisWeek,
    lastWeekVolume: lastFull,
    routineById(id) {
      return ROUTINES.find((r) => r.id === id);
    },
  };
})();
