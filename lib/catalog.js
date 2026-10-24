import { VARIATIONS } from "./variations";

/** Canonical exercise catalog. Names match Sebas-Training.html exactly. */
const CORE = [
  {
    "id": "barbell-bench-press",
    "name": "Barbell Bench Press",
    "region": "Chest",
    "type": "Compound",
    "equipment": "Barbell",
    "filter": "chest",
    "thumb": "/assets/thumb-bench.jpg",
    "still": "/assets/bench-detail.jpg",
    "motion": "/assets/bench-press.jpg",
    "cinematic": true,
    "view": "front",
    "hot": [
      "chest"
    ],
    "warm": [
      "shoulders",
      "triceps"
    ],
    "primary": "Chest",
    "secondary": "Shoulders · Triceps",
    "sets": 4,
    "reps": 8,
    "rest": 90,
    "tempo": "2-1-1",
    "weight": 185,
    "steps": [
      "Lie on a flat bench with your feet firmly on the floor.",
      "Grip the bar slightly wider than shoulder width.",
      "Lower the bar to your mid-chest with control.",
      "Press the bar back up, keeping your core tight."
    ],
    "tips": [
      "Pinch your shoulder blades and stack your wrists over your elbows.",
      "Drive your feet into the floor without lifting your hips.",
      "Stop the set if the bar drifts toward your neck."
    ],
    "cues": [
      "Lie back, plant your feet, and set your shoulder blades before you take the bar.",
      "Lower to mid-chest and press up while your ribs stay down.",
      "Lock out softly over the shoulders, then reset the next rep."
    ]
  },
  {
    "id": "incline-dumbbell-press",
    "name": "Incline Dumbbell Press",
    "region": "Chest",
    "type": "Compound",
    "equipment": "Dumbbells",
    "filter": "chest",
    "thumb": "/assets/thumb-incline.jpg",
    "view": "front",
    "hot": [
      "chest"
    ],
    "warm": [
      "shoulders",
      "triceps"
    ],
    "primary": "Upper chest",
    "secondary": "Shoulders · Triceps",
    "sets": 3,
    "reps": 10,
    "rest": 75,
    "tempo": "2-1-1",
    "weight": 70,
    "steps": [
      "Set the bench near 30 degrees.",
      "Start with the dumbbells over your upper chest.",
      "Lower until your elbows sit just below the bench line.",
      "Press up and slightly inward without clanking the weights."
    ],
    "tips": [
      "Keep the bench modest so the press stays on the chest.",
      "Match both arms. The weaker side sets the load."
    ],
    "cues": [
      "Sit tall, then lie back with the bells at shoulder height.",
      "Press along a slight arc toward the top of the chest.",
      "Finish with arms extended and shoulders still packed down."
    ]
  },
  {
    "id": "incline-chest-press",
    "name": "Incline Chest Press",
    "region": "Chest",
    "type": "Machine",
    "equipment": "Machine",
    "filter": "chest",
    "thumb": "/assets/thumb-incline.jpg",
    "view": "front",
    "hot": [
      "chest"
    ],
    "warm": [
      "shoulders",
      "triceps"
    ],
    "primary": "Chest",
    "secondary": "Shoulders · Triceps",
    "sets": 3,
    "reps": 10,
    "rest": 75,
    "tempo": "2-0-1",
    "weight": 120,
    "steps": [
      "Set the seat so the handles line up with your upper chest.",
      "Plant your feet and keep your back on the pad.",
      "Press the handles up and slightly together.",
      "Lower with control until you feel a stretch across the upper chest."
    ],
    "tips": [
      "Keep your shoulder blades pinched so the press stays in the chest.",
      "Do not let your shoulders roll forward at the top."
    ]
  },
  {
    "id": "machine-chest-press",
    "name": "Machine Chest Press",
    "region": "Chest",
    "type": "Machine",
    "equipment": "Machine",
    "filter": "chest",
    "thumb": "/assets/thumb-machine-press.jpg",
    "view": "front",
    "hot": [
      "chest"
    ],
    "warm": [
      "shoulders",
      "triceps"
    ],
    "primary": "Chest",
    "secondary": "Shoulders · Triceps",
    "sets": 3,
    "reps": 10,
    "rest": 75,
    "tempo": "2-0-1",
    "weight": 140,
    "steps": [
      "Set the seat so the handles meet your mid-chest.",
      "Grip evenly and keep your back on the pad.",
      "Press until the elbows are almost straight.",
      "Return until the chest stretches without the shoulders rolling forward."
    ],
    "tips": [
      "Use the machine to chase clean reps, not a loose bounce.",
      "If one arm takes over, lighten the stack."
    ]
  },
  {
    "id": "dumbbell-fly",
    "name": "Dumbbell Fly",
    "region": "Chest",
    "type": "Isolation",
    "equipment": "Dumbbells",
    "filter": "chest",
    "thumb": "/assets/thumb-fly.jpg",
    "view": "front",
    "hot": [
      "chest"
    ],
    "warm": [
      "shoulders"
    ],
    "primary": "Chest",
    "secondary": "Shoulders",
    "sets": 3,
    "reps": 12,
    "rest": 60,
    "tempo": "2-1-1",
    "weight": 35,
    "steps": [
      "Lie on a flat bench with a soft bend in the elbows.",
      "Open the arms until the chest stretches.",
      "Sweep the bells back together over the chest.",
      "Keep the same elbow angle the whole time."
    ],
    "tips": [
      "This is a stretch movement. Leave the heavy pressing for the compounds.",
      "Stop short of pain in the front of the shoulder."
    ]
  },
  {
    "id": "pec-deck",
    "name": "Pec Deck",
    "region": "Chest",
    "type": "Machine",
    "equipment": "Machine",
    "filter": "chest",
    "thumb": "/assets/thumb-fly.jpg",
    "view": "front",
    "hot": [
      "chest"
    ],
    "warm": [
      "shoulders"
    ],
    "primary": "Chest",
    "secondary": "Shoulders",
    "sets": 3,
    "reps": 12,
    "rest": 60,
    "tempo": "2-1-1",
    "weight": 100,
    "steps": [
      "Set the seat so the pads meet your upper arms at shoulder height.",
      "Sit tall with your back flat against the pad.",
      "Bring the pads together in front of your chest with control.",
      "Open back slowly until you feel a stretch across the chest."
    ],
    "tips": [
      "Keep a soft bend in the elbows and squeeze the chest at the close.",
      "Do not let the weight stack slam between reps."
    ]
  },
  {
    "id": "dips",
    "name": "Dips",
    "region": "Chest",
    "type": "Bodyweight",
    "equipment": "Bodyweight",
    "filter": "chest",
    "thumb": "/assets/thumb-bench.jpg",
    "view": "front",
    "hot": [
      "chest"
    ],
    "warm": [
      "triceps",
      "shoulders"
    ],
    "primary": "Chest",
    "secondary": "Triceps · Shoulders",
    "sets": 3,
    "reps": 10,
    "rest": 90,
    "tempo": "2-0-1",
    "weight": 0,
    "steps": [
      "Grip the parallel bars and press yourself up until your arms are straight.",
      "Lean your torso slightly forward for more chest.",
      "Lower with control until your shoulders are just below your elbows.",
      "Press back up without shrugging or swinging."
    ],
    "tips": [
      "A deeper stretch with control beats bouncing out of the bottom.",
      "Keep your legs still - kicking steals the rep."
    ]
  },
  {
    "id": "shoulder-press",
    "name": "Shoulder Press",
    "motionName": "Seated Dumbbell Press",
    "region": "Shoulders",
    "type": "Compound",
    "equipment": "Dumbbells",
    "filter": "shoulders",
    "thumb": "/assets/thumb-shoulder.jpg",
    "motion": "/assets/seated-press.jpg",
    "cinematic": true,
    "view": "front",
    "hot": [
      "shoulders"
    ],
    "warm": [
      "triceps"
    ],
    "primary": "Shoulders",
    "secondary": "Triceps",
    "sets": 3,
    "reps": 8,
    "rest": 75,
    "tempo": "2-0-1",
    "weight": 55,
    "steps": [
      "Sit tall with the dumbbells at shoulder height.",
      "Press straight up without leaning back hard.",
      "Stop just short of a violent lockout.",
      "Lower until the elbows sit slightly below the shoulders."
    ],
    "tips": [
      "Ribs down. A big lean turns this into an incline press.",
      "Keep the bells over the elbows, not forward of the face."
    ],
    "cues": [
      "Sit tall, plant your feet, and set the dumbbells at shoulder height.",
      "Keep your back against the bench, core tight, and press the dumbbells straight up until your arms are fully extended.",
      "Lower along the same path until the elbows sit just below the shoulders."
    ]
  },
  {
    "id": "lateral-raise",
    "name": "Lateral Raise",
    "region": "Shoulders",
    "type": "Isolation",
    "equipment": "Dumbbells",
    "filter": "shoulders",
    "thumb": "/assets/thumb-lateral.jpg",
    "view": "front",
    "hot": [
      "shoulders"
    ],
    "warm": [],
    "primary": "Side delts",
    "secondary": "Traps",
    "sets": 3,
    "reps": 12,
    "rest": 60,
    "tempo": "2-1-2",
    "weight": 25,
    "steps": [
      "Stand tall with a slight bend in the elbows.",
      "Raise the arms out to shoulder height.",
      "Lead with the elbows, not the hands.",
      "Lower slowly. Do not swing the next rep."
    ],
    "tips": [
      "If the traps take over, the load is too heavy.",
      "A thumb-slightly-down finish keeps the side delt working."
    ]
  },
  {
    "id": "cable-crossover",
    "name": "Cable Crossover",
    "region": "Chest",
    "type": "Isolation",
    "equipment": "Cable",
    "filter": "chest",
    "thumb": "/assets/thumb-fly.jpg",
    "view": "front",
    "hot": [
      "chest"
    ],
    "warm": [
      "shoulders"
    ],
    "primary": "Chest",
    "secondary": "Shoulders",
    "sets": 3,
    "reps": 12,
    "rest": 60,
    "tempo": "2-1-1",
    "weight": 40,
    "steps": [
      "Set the pulleys high and step through so the chest is proud.",
      "Sweep the handles down and together.",
      "Pause where the hands meet.",
      "Open back to a long stretch without shrugging."
    ],
    "tips": [
      "Think about the hands meeting in front of the sternum, not the hips."
    ]
  },
  {
    "id": "barbell-row",
    "name": "Barbell Row",
    "region": "Back",
    "type": "Compound",
    "equipment": "Barbell",
    "filter": "back",
    "thumb": "/assets/thumb-row.jpg",
    "view": "back",
    "hot": [
      "lats"
    ],
    "warm": [
      "traps",
      "biceps"
    ],
    "primary": "Lats",
    "secondary": "Traps · Biceps",
    "sets": 4,
    "reps": 8,
    "rest": 90,
    "tempo": "2-1-1",
    "weight": 155,
    "steps": [
      "Hinge until the torso is near parallel and the back is flat.",
      "Pull the bar to the lower ribs.",
      "Squeeze the shoulder blades without shrugging to the ears.",
      "Lower until the arms are long."
    ],
    "tips": [
      "The chest stays proud. A rounded back is a reason to drop the load.",
      "Brace before every pull."
    ]
  },
  {
    "id": "pull-up",
    "name": "Pull-Up",
    "region": "Back",
    "type": "Compound",
    "equipment": "Bodyweight",
    "filter": "back",
    "thumb": "/assets/thumb-pullup.jpg",
    "bodyweight": true,
    "view": "back",
    "hot": [
      "lats"
    ],
    "warm": [
      "biceps"
    ],
    "primary": "Lats",
    "secondary": "Biceps",
    "sets": 4,
    "reps": 6,
    "rest": 90,
    "tempo": "2-1-1",
    "weight": 0,
    "steps": [
      "Hang with a grip just outside the shoulders.",
      "Pull the chest toward the bar.",
      "Clear the chin without craning the neck.",
      "Lower all the way. Keep a little tension at the bottom."
    ],
    "tips": [
      "Added weight is optional. Zero means bodyweight.",
      "Kipping changes the exercise. Stay strict here."
    ]
  },
  {
    "id": "lat-pulldown",
    "name": "Lat Pulldown",
    "region": "Back",
    "type": "Machine",
    "equipment": "Cable",
    "filter": "back",
    "thumb": "/assets/thumb-pullup.jpg",
    "view": "back",
    "hot": [
      "lats"
    ],
    "warm": [
      "biceps"
    ],
    "primary": "Lats",
    "secondary": "Biceps",
    "sets": 3,
    "reps": 10,
    "rest": 75,
    "tempo": "2-1-1",
    "weight": 120,
    "steps": [
      "Sit tall and lock the thighs under the pads.",
      "Pull the bar to the upper chest.",
      "Drive the elbows down, not back behind you.",
      "Control the return until the arms are long."
    ],
    "tips": [
      "Leaning back a little is fine. Turning it into a row is not."
    ]
  },
  {
    "id": "seated-cable-row",
    "name": "Seated Cable Row",
    "region": "Back",
    "type": "Compound",
    "equipment": "Cable",
    "filter": "back",
    "thumb": "/assets/thumb-row.jpg",
    "view": "back",
    "hot": [
      "lats"
    ],
    "warm": [
      "traps",
      "biceps"
    ],
    "primary": "Mid back",
    "secondary": "Lats · Biceps",
    "sets": 3,
    "reps": 10,
    "rest": 75,
    "tempo": "2-1-1",
    "weight": 130,
    "steps": [
      "Sit with a soft knee bend and a tall chest.",
      "Pull the handle to the ribs.",
      "Pause with the shoulder blades together.",
      "Reach forward without dumping the lower back."
    ],
    "tips": [
      "The torso stays nearly still. The arms and back do the work."
    ]
  },
  {
    "id": "one-arm-row",
    "name": "One-Arm Dumbbell Row",
    "region": "Back",
    "type": "Compound",
    "equipment": "Dumbbell",
    "filter": "back",
    "thumb": "/assets/thumb-row.jpg",
    "view": "back",
    "hot": [
      "lats"
    ],
    "warm": [
      "biceps"
    ],
    "primary": "Lats",
    "secondary": "Biceps",
    "sets": 3,
    "reps": 10,
    "rest": 60,
    "tempo": "2-1-1",
    "weight": 70,
    "steps": [
      "Brace one hand on a bench and keep the back flat.",
      "Pull the bell to the hip, not the armpit.",
      "Pause, then lower until the shoulder stretches.",
      "Match the reps on both sides."
    ],
    "tips": [
      "Do not rotate the whole torso to finish the rep."
    ]
  },
  {
    "id": "barbell-curl",
    "name": "Barbell Curl",
    "region": "Arms",
    "type": "Isolation",
    "equipment": "Barbell",
    "filter": "arms",
    "thumb": "/assets/thumb-curl.jpg",
    "view": "front",
    "hot": [
      "biceps"
    ],
    "warm": [],
    "primary": "Biceps",
    "secondary": "Forearms",
    "sets": 3,
    "reps": 10,
    "rest": 60,
    "tempo": "2-1-1",
    "weight": 75,
    "steps": [
      "Stand tall with the bar at the thighs.",
      "Curl without swinging the hips.",
      "Stop before the elbows drift forward a lot.",
      "Lower for a full two-count."
    ],
    "tips": [
      "Leave the ego load on the rack. Swinging is a different exercise."
    ]
  },
  {
    "id": "hammer-curl",
    "name": "Hammer Curl",
    "region": "Arms",
    "type": "Isolation",
    "equipment": "Dumbbells",
    "filter": "arms",
    "thumb": "/assets/thumb-curl.jpg",
    "view": "front",
    "hot": [
      "biceps"
    ],
    "warm": [],
    "primary": "Brachialis",
    "secondary": "Biceps · Forearms",
    "sets": 3,
    "reps": 12,
    "rest": 60,
    "tempo": "2-0-1",
    "weight": 30,
    "steps": [
      "Hold the bells with palms facing each other.",
      "Curl toward the shoulders.",
      "Keep the elbows pinned near the ribs.",
      "Lower until the arms are straight."
    ],
    "tips": [
      "Neutral grip takes pressure off sore wrists."
    ]
  },
  {
    "id": "incline-curl",
    "name": "Incline Curl",
    "region": "Arms",
    "type": "Isolation",
    "equipment": "Dumbbells",
    "filter": "arms",
    "thumb": "/assets/thumb-curl.jpg",
    "view": "front",
    "hot": [
      "biceps"
    ],
    "warm": [],
    "primary": "Biceps",
    "secondary": "Forearms",
    "sets": 3,
    "reps": 10,
    "rest": 60,
    "tempo": "2-1-2",
    "weight": 25,
    "steps": [
      "Lie back on an incline bench set around 45 degrees.",
      "Let the arms hang straight down at your sides.",
      "Curl the bells up without swinging.",
      "Lower all the way to a full stretch at the bottom."
    ],
    "tips": [
      "The stretch at the bottom is the point. Do not cut the range short."
    ]
  },
  {
    "id": "preacher-curl",
    "name": "Preacher Curl",
    "region": "Arms",
    "type": "Isolation",
    "equipment": "Barbell",
    "filter": "arms",
    "thumb": "/assets/thumb-curl.jpg",
    "view": "front",
    "hot": [
      "biceps"
    ],
    "warm": [],
    "primary": "Biceps",
    "secondary": "Forearms",
    "sets": 3,
    "reps": 10,
    "rest": 60,
    "tempo": "2-1-1",
    "weight": 65,
    "steps": [
      "Set the seat so your upper arms lie flat on the pad.",
      "Curl the bar up toward your shoulders.",
      "Squeeze at the top without lifting your elbows off the pad.",
      "Lower under control until the arms are almost straight."
    ],
    "tips": [
      "Keep the elbows glued to the pad. Lifting them turns it into a different lift."
    ]
  },
  {
    "id": "cable-lateral-raise",
    "name": "Cable Lateral Raise",
    "region": "Arms",
    "type": "Isolation",
    "equipment": "Cable",
    "filter": "arms",
    "thumb": "/assets/thumb-lateral.jpg",
    "view": "front",
    "hot": [
      "shoulders"
    ],
    "warm": [],
    "primary": "Side delts",
    "secondary": "Traps",
    "sets": 3,
    "reps": 12,
    "rest": 60,
    "tempo": "2-1-2",
    "weight": 15,
    "steps": [
      "Stand sideways to a low cable with the handle in your far hand.",
      "Keep a soft bend in the elbow.",
      "Raise the arm out to shoulder height.",
      "Lower slowly. Do not let the stack slam down."
    ],
    "tips": [
      "If the traps take over, the load is too heavy.",
      "A slight lean away from the stack keeps tension on the delt."
    ]
  },
  {
    "id": "triceps-pushdown",
    "name": "Triceps Pushdown",
    "region": "Arms",
    "type": "Isolation",
    "equipment": "Cable",
    "filter": "arms",
    "thumb": "/assets/thumb-pushdown.jpg",
    "view": "back",
    "hot": [
      "triceps"
    ],
    "warm": [],
    "primary": "Triceps",
    "secondary": "Forearms",
    "sets": 3,
    "reps": 12,
    "rest": 60,
    "tempo": "2-1-1",
    "weight": 50,
    "steps": [
      "Pin the elbows to your sides.",
      "Push the bar down until the arms are straight.",
      "Squeeze at the bottom without leaning over the bar.",
      "Let it rise only to about chest height."
    ],
    "tips": [
      "If the elbows travel forward, the chest is stealing the set."
    ]
  },
  {
    "id": "overhead-extension",
    "name": "Overhead Triceps Extension",
    "region": "Arms",
    "type": "Isolation",
    "equipment": "Dumbbell",
    "filter": "arms",
    "thumb": "/assets/thumb-pushdown.jpg",
    "view": "back",
    "hot": [
      "triceps"
    ],
    "warm": [],
    "primary": "Triceps",
    "secondary": "Shoulders",
    "sets": 3,
    "reps": 10,
    "rest": 60,
    "tempo": "2-1-1",
    "weight": 40,
    "steps": [
      "Hold one bell overhead with both hands.",
      "Lower behind the head until the triceps stretch.",
      "Keep the upper arms close to the ears.",
      "Extend without flaring the ribs."
    ],
    "tips": [
      "A lighter bell with a long stretch beats a short, heavy shove."
    ]
  },
  {
    "id": "overhead-cable-extension",
    "name": "Overhead Cable Extension",
    "region": "Arms",
    "type": "Isolation",
    "equipment": "Cable",
    "filter": "arms",
    "thumb": "/assets/thumb-pushdown.jpg",
    "view": "back",
    "hot": [
      "triceps"
    ],
    "warm": [],
    "primary": "Triceps",
    "secondary": "Shoulders",
    "sets": 3,
    "reps": 10,
    "rest": 60,
    "tempo": "2-1-1",
    "weight": 50,
    "steps": [
      "Face away from the cable with the rope held behind your head.",
      "Keep your upper arms close to your ears, elbows pointing forward.",
      "Extend your arms overhead until the triceps are fully straight.",
      "Lower slowly until you feel a deep stretch in the triceps."
    ],
    "tips": [
      "Step forward and brace so the cable does not pull you back.",
      "The long stretch is the point - do not shorten the range to add weight."
    ]
  },
  {
    "id": "close-grip-bench",
    "name": "Close-Grip Bench Press",
    "region": "Arms",
    "type": "Compound",
    "equipment": "Barbell",
    "filter": "arms",
    "thumb": "/assets/thumb-bench.jpg",
    "view": "front",
    "hot": [
      "triceps"
    ],
    "warm": [
      "chest"
    ],
    "primary": "Triceps",
    "secondary": "Chest",
    "sets": 3,
    "reps": 8,
    "rest": 90,
    "tempo": "2-1-1",
    "weight": 135,
    "steps": [
      "Grip about shoulder width. Do not stack the hands together.",
      "Lower to the lower chest.",
      "Keep the elbows closer than a wide bench press.",
      "Press up and finish with the triceps."
    ],
    "tips": [
      "A too-narrow grip punishes the wrists. Shoulder width is enough."
    ]
  },
  {
    "id": "back-squat",
    "name": "Back Squat",
    "region": "Legs",
    "type": "Compound",
    "equipment": "Barbell",
    "filter": "legs",
    "thumb": "/assets/thumb-squat.jpg",
    "view": "front",
    "hot": [
      "quads"
    ],
    "warm": [
      "glutes"
    ],
    "primary": "Quadriceps",
    "secondary": "Glutes",
    "sets": 5,
    "reps": 5,
    "rest": 120,
    "tempo": "2-1-1",
    "weight": 225,
    "steps": [
      "Set the bar on the upper back, not the neck.",
      "Break at the hips and knees together.",
      "Sit to a depth you can own with the heels down.",
      "Stand by driving the floor away."
    ],
    "tips": [
      "Knees track over the mid-foot.",
      "Brace before you descend. Do not hold your breath for the whole set."
    ]
  },
  {
    "id": "romanian-deadlift",
    "name": "Romanian Deadlift",
    "region": "Legs",
    "type": "Compound",
    "equipment": "Barbell",
    "filter": "legs",
    "thumb": "/assets/thumb-rdl.jpg",
    "view": "back",
    "hot": [
      "hamstrings"
    ],
    "warm": [
      "glutes"
    ],
    "primary": "Hamstrings",
    "secondary": "Glutes",
    "sets": 4,
    "reps": 8,
    "rest": 90,
    "tempo": "3-0-1",
    "weight": 185,
    "steps": [
      "Start tall with the bar at the thighs.",
      "Push the hips back and slide the bar down the legs.",
      "Stop when the hamstrings hit their stretch, back still flat.",
      "Stand by driving the hips forward."
    ],
    "tips": [
      "The bar stays touching the legs. A gap means the hinge turned into a squat."
    ]
  },
  {
    "id": "barbell-deadlift",
    "name": "Barbell Deadlift",
    "region": "Legs",
    "type": "Compound",
    "equipment": "Barbell",
    "filter": "legs",
    "thumb": "/assets/thumb-rdl.jpg",
    "view": "back",
    "hot": [
      "glutes",
      "hamstrings"
    ],
    "warm": [
      "lats"
    ],
    "primary": "Glutes · Hamstrings",
    "secondary": "Back",
    "sets": 3,
    "reps": 5,
    "rest": 150,
    "tempo": "1-1-1",
    "weight": 275,
    "steps": [
      "Stand with the bar over the mid-foot.",
      "Hinge, grip, and brace before the bar leaves the floor.",
      "Push the floor away and keep the bar close.",
      "Stand tall, then lower with the same path."
    ],
    "tips": [
      "Set the lats before you pull so the bar does not drift forward.",
      "Finish the hips and knees together. Do not lean back."
    ]
  },
  {
    "id": "leg-press",
    "name": "Leg Press",
    "region": "Legs",
    "type": "Machine",
    "equipment": "Machine",
    "filter": "legs",
    "thumb": "/assets/thumb-squat.jpg",
    "view": "front",
    "hot": [
      "quads"
    ],
    "warm": [
      "glutes"
    ],
    "primary": "Quadriceps",
    "secondary": "Glutes",
    "sets": 3,
    "reps": 10,
    "rest": 90,
    "tempo": "2-1-1",
    "weight": 360,
    "steps": [
      "Place the feet about shoulder width on the platform.",
      "Lower until the knees travel, without the hips peeling off the pad.",
      "Press evenly through the whole foot.",
      "Do not lock the knees hard at the top."
    ],
    "tips": [
      "A deeper range is not better if the lower back rounds off the seat."
    ]
  },
  {
    "id": "walking-lunge",
    "name": "Walking Lunge",
    "region": "Legs",
    "type": "Compound",
    "equipment": "Dumbbells",
    "filter": "legs",
    "thumb": "/assets/thumb-squat.jpg",
    "view": "front",
    "hot": [
      "quads"
    ],
    "warm": [
      "glutes"
    ],
    "primary": "Quadriceps",
    "secondary": "Glutes",
    "sets": 3,
    "reps": 10,
    "rest": 60,
    "tempo": "2-0-1",
    "weight": 40,
    "steps": [
      "Hold the bells at your sides.",
      "Step long enough that the front heel stays down.",
      "Drop the back knee toward the floor.",
      "Drive through the front foot into the next step."
    ],
    "tips": [
      "A short step dumps the knee past the toes. Make it long."
    ]
  },
  {
    "id": "leg-curl",
    "name": "Leg Curl",
    "region": "Legs",
    "type": "Isolation",
    "equipment": "Machine",
    "filter": "legs",
    "thumb": "/assets/thumb-rdl.jpg",
    "view": "back",
    "hot": [
      "hamstrings"
    ],
    "warm": [],
    "primary": "Hamstrings",
    "secondary": "Calves",
    "sets": 3,
    "reps": 12,
    "rest": 60,
    "tempo": "2-1-2",
    "weight": 90,
    "steps": [
      "Line the pad up with the lower calves.",
      "Curl until the heels get close to the glutes.",
      "Pause, then lower for a full stretch.",
      "Keep the hips down on the pad."
    ],
    "tips": [
      "If the hips lift, the load is doing the cheating for you."
    ]
  },
  {
    "id": "calf-raise",
    "name": "Standing Calf Raise",
    "region": "Legs",
    "type": "Isolation",
    "equipment": "Machine",
    "filter": "legs",
    "thumb": "/assets/thumb-squat.jpg",
    "view": "back",
    "hot": [
      "calves"
    ],
    "warm": [],
    "primary": "Calves",
    "secondary": "Feet",
    "sets": 4,
    "reps": 12,
    "rest": 45,
    "tempo": "2-1-1",
    "weight": 180,
    "steps": [
      "Stand tall with the balls of the feet on the edge.",
      "Drop the heels into a stretch.",
      "Rise as high as the calves allow.",
      "Pause at the top before the next drop."
    ],
    "tips": [
      "A bounce at the bottom skips the part that matters."
    ]
  }
];

export const EXERCISES = CORE.concat(VARIATIONS);

export const FILTERS = [
  ["all", "All"],
  ["chest", "Chest"],
  ["back", "Back"],
  ["shoulders", "Shoulders"],
  ["arms", "Arms"],
  ["legs", "Legs"],
  ["barbell", "Barbell"],
  ["dumbbells", "Dumbbells"],
  ["cable", "Cable"],
  ["machine", "Machine"],
  ["bodyweight", "Bodyweight"],
];

export function matchesFilter(exercise, filter) {
  if (!filter || filter === "all" || filter === "All") return true;
  const id = String(filter).toLowerCase();
  if (id === "barbell") return exercise.equipment === "Barbell";
  if (id === "dumbbells") return exercise.equipment === "Dumbbells";
  if (id === "cable") return exercise.equipment === "Cable";
  if (id === "machine") return exercise.equipment === "Machine";
  if (id === "bodyweight") return exercise.equipment === "Bodyweight" || exercise.bodyweight;
  return exercise.filter === id || exercise.region?.toLowerCase() === id || exercise.equipment?.toLowerCase() === id;
}

const byName = new Map(EXERCISES.map((e) => [e.name.toLowerCase(), e]));
const byId = new Map(EXERCISES.map((e) => [e.id, e]));

export function catalogById(id) {
  return byId.get(id) || null;
}

/** Match a stored exercise name to the canonical entry, including older seed names. */
const ALIASES = {
  "bench press": "barbell bench press",
  "squat": "back squat",
  "deadlift": "barbell deadlift",
  "overhead press": "shoulder press",
  "bicep curl": "barbell curl",
  "tricep pushdown": "triceps pushdown",
  "tricep push down": "triceps pushdown",
  "peck deck": "pec deck",
};

export function catalogByName(name) {
  if (!name) return null;
  const key = String(name).trim().toLowerCase();
  return byName.get(key) || byName.get(ALIASES[key]) || null;
}

export function thumbFor(name) {
  return catalogByName(name)?.thumb || "/assets/thumb-bench.jpg";
}

export function stillFor(name) {
  const e = catalogByName(name);
  return e?.still || e?.motion || e?.thumb || "/assets/thumb-bench.jpg";
}

export function motionFor(name) {
  const e = catalogByName(name);
  return e?.motion || e?.still || e?.thumb || "/assets/gym-dark.jpg";
}

/** One catalog read per page load. Tab switches reuse it instead of hitting Supabase again. */
let catalogRows = null;
let catalogPromise = null;

/** Insert any canonical exercises that are not already in the shared catalog. */
export function ensureCatalog(supabase) {
  if (catalogRows) return Promise.resolve(catalogRows);
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const { data, error } = await supabase.from("exercises").select("id, name, muscle_group");
      if (error) {
        catalogPromise = null;
        return [];
      }
      const have = new Set((data || []).map((e) => e.name.toLowerCase()));
      const missing = EXERCISES.filter((e) => !have.has(e.name.toLowerCase())).map((e) => ({
        name: e.name,
        muscle_group: e.region,
      }));
      let rows = data || [];
      if (missing.length) {
        const inserted = await supabase.from("exercises").insert(missing);
        if (inserted.error) {
          catalogPromise = null;
          return rows;
        }
        const again = await supabase.from("exercises").select("id, name, muscle_group");
        if (again.error) {
          catalogPromise = null;
          return rows;
        }
        rows = again.data || rows;
      }
      catalogRows = rows;
      return rows;
    })().catch((err) => {
      catalogPromise = null;
      throw err;
    });
  }
  return catalogPromise;
}
