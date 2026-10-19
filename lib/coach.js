/**
 * Rule-based training coach. Answers from the user's own data —
 * no API key needed. `ctx` carries everything the rules need:
 * { todayLabel, isRest, weekWorkouts, weekVolume, weekSets, goal,
 *   streak, prs: [{name, weight}], muscleSets: {muscle: n} }
 */

const QUICK = [
  "What should I train today?",
  "How is my week going?",
  "Am I doing enough volume?",
  "I feel stuck on my lifts",
];

function weekSummary(ctx) {
  const w = ctx.weekWorkouts ?? 0;
  const g = ctx.goal ?? 4;
  if (w === 0) return "No workouts logged yet this week. Your split says today is " + (ctx.isRest ? "a rest day — but if you're fresh, there's no rule against moving a session up." : ctx.todayLabel + ", so that's the move if you're up for it.");
  if (w >= g) return `You've hit ${w} workouts against your goal of ${g} — week handled. Anything extra is bonus.`;
  return `${w} of ${g} workouts so far. ${g - w} to go — you've got this.`;
}

function volumeAdvice(ctx) {
  const entries = Object.entries(ctx.muscleSets ?? {});
  if (!entries.length) return "Log a workout first and I'll break down your per-muscle volume.";
  const low = entries.filter(([, n]) => n < 10).map(([m]) => m);
  const good = entries.filter(([, n]) => n >= 10 && n <= 20).map(([m]) => m);
  let out = `This week: ${ctx.weekSets ?? 0} sets, ${Math.round(ctx.weekVolume ?? 0).toLocaleString()} lb. `;
  if (good.length) out += `On target: ${good.join(", ")}. `;
  if (low.length) out += `Could use more: ${low.join(", ")} (aim for 10+ hard sets per muscle per week).`;
  else out += "Every muscle is at 10+ sets. That's the productive range.";
  return out;
}

function plateauAdvice() {
  return "Stuck lifts usually come down to one of three things:\n\n1. Not enough food or sleep — muscle needs both to grow.\n2. Doing the same reps forever — add a rep or a little weight when you hit the top of your rep range.\n3. Too much junk volume — 10-20 hard sets per muscle per week beats 30 sloppy ones.\n\nPick the lift, tell me your last session, and I'll get specific.";
}

export function answerCoach(question, ctx) {
  const q = (question || "").toLowerCase();
  if (!q.trim()) return "Ask me about your training — what to do today, your volume, or a stuck lift.";

  if (/train today|today|what.*workout|which day/.test(q)) {
    if (ctx.isRest) {
      return `Today is a rest day on your split. ${weekSummary(ctx)}`;
    }
    return `Today is ${ctx.todayLabel} day. ${weekSummary(ctx)}`;
  }
  if (/week.*going|how.*doing|progress|summary/.test(q)) {
    let out = weekSummary(ctx) + ` Volume so far: ${Math.round(ctx.weekVolume ?? 0).toLocaleString()} lb across ${ctx.weekSets ?? 0} sets.`;
    if ((ctx.streak ?? 0) > 1) out += ` And you're on a ${ctx.streak}-day streak — don't break it.`;
    return out;
  }
  if (/volume|enough|too much|too little/.test(q)) return volumeAdvice(ctx);
  if (/stuck|plateau|not.*progress|weak/.test(q)) return plateauAdvice();
  if (/rest/.test(q)) return "Rest days are when you grow. Eat enough protein, sleep 7-9 hours. If you're itching to move, a walk beats a junk session.";
  if (/streak/.test(q)) return (ctx.streak ?? 0) > 0 ? `You're on a ${ctx.streak}-day streak. Keep it alive — even a short session counts.` : "No streak yet. Log today and it starts.";
  if (/pr|personal record|max/.test(q)) {
    const prs = (ctx.prs ?? []).slice(0, 3);
    if (!prs.length) return "No PRs logged yet — they show up once you log heavy sets.";
    return "Your recent bests: " + prs.map((p) => `${p.name} ${p.weight} lb`).join(" · ");
  }
  if (/hi|hello|hey/.test(q)) return "Hey. Ask me what to train today, how your week's going, or whether your volume's on track.";
  if (/thank/.test(q)) return "Anytime. Now go lift.";
  return "I can help with: what to train today, how your week is going, whether your volume is on track, or a stuck lift. What's on your mind?";
}

export { QUICK };
