"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured, ACTIVE_WORKOUT_KEY } from "../lib/supabase";
import { loadSplit } from "../lib/presets";
import { EXERCISES, ensureCatalog } from "../lib/catalog";
import { volumeOf } from "../lib/volume";
import { BUILTIN_ROUTINES, resolveNames, routineLabel } from "../lib/routines";
import { loadDayPlans, saveDayPlan } from "../lib/dayPlans";
import { startSession } from "../lib/startSession";
import ConfigBanner from "./components/ConfigBanner";
import Icon from "./components/Icon";
import { useAuth } from "./components/AuthContext";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function localIso(value) {
  const d = new Date(value);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function mondayOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [now, setNow] = useState(null);
  const [split, setSplit] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [idByName, setIdByName] = useState({});
  const [plans, setPlans] = useState({});
  const [hasActive, setHasActive] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const clock = new Date();
    setNow(clock);
    setHasActive(Boolean(localStorage.getItem(ACTIVE_WORKOUT_KEY)));
    if (user) setPlans(loadDayPlans(user.id));
    if (!isConfigured) return;
    (async () => {
      const supabase = await getSupabase();
      if (!supabase) return;
      const rows = await ensureCatalog(supabase);
      const map = {};
      for (const row of rows || []) map[row.name.toLowerCase()] = row.id;
      setIdByName(map);
      const { data } = await supabase
        .from("workouts")
        .select("id, started_at, ended_at, sets(reps, weight, exercises(id, name))")
        .order("started_at", { ascending: false })
        .limit(80);
      setWorkouts((data ?? []).filter((w) => w.ended_at));
      if (user) setSplit(await loadSplit(supabase, user.id));
    })();
  }, [user]);

  const todayIdx = now ? (now.getDay() + 6) % 7 : 0;
  const todayIso = now ? localIso(now) : "";
  const weekStart = now ? mondayOf(now) : null;
  const finished = workouts;
  const weekWorkouts = weekStart ? finished.filter((w) => new Date(w.started_at) >= weekStart) : [];
  const weekVolume = Math.round(weekWorkouts.reduce((sum, w) => sum + volumeOf(w.sets), 0));
  const loggedToday = finished.find((w) => localIso(w.started_at) === todayIso) || null;
  const lastSession = finished.find((w) => localIso(w.started_at) < todayIso) || null;

  const routines = useMemo(() => {
    const builtins = BUILTIN_ROUTINES.map((routine) => ({
      ...routine,
      exerciseIds: resolveNames(routine.names, idByName),
      templateId: null,
    })).filter((routine) => routine.exerciseIds.length);
    const saved = [];
    for (const day of split?.days ?? []) {
      const tpl = day.template;
      if (!tpl) continue;
      if (saved.some((item) => item.templateId === tpl.id)) continue;
      const exerciseIds = (tpl.template_exercises ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((te) => te.exercises?.id)
        .filter(Boolean);
      saved.push({
        key: `tpl:${tpl.id}`,
        name: tpl.name,
        detail: tpl.name,
        focus: day.muscle_targets || "Saved split",
        exerciseIds,
        templateId: tpl.id,
      });
    }
    return [...builtins, ...saved];
  }, [idByName, split]);

  const todayDay = split?.days?.find((d) => d.day_index === todayIdx) || null;
  const savedPlan = plans[todayIso];
  const defaultRoutine = todayDay?.template
    ? routines.find((r) => r.templateId === todayDay.template.id) || routines.find((r) => r.name === todayDay.label)
    : null;
  const active = savedPlan
    ? routines.find((r) => r.key === savedPlan.routineKey) || {
        ...savedPlan,
        name: savedPlan.label,
        exerciseIds: savedPlan.exerciseIds,
      }
    : defaultRoutine;

  const when = now
    ? now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })
    : "";

  function chooseRoutine(routine) {
    if (!user || !todayIso) return;
    const next = saveDayPlan(user.id, todayIso, {
      routineKey: routine.key,
      label: routine.name,
      focus: routine.focus,
      exerciseIds: routine.exerciseIds,
      templateId: routine.templateId,
    });
    setPlans(next);
  }

  async function onPlay() {
    if (hasActive) {
      router.push("/session");
      return;
    }
    if (loggedToday) {
      router.push(`/history?id=${loggedToday.id}`);
      return;
    }
    if (!active?.exerciseIds?.length || !user || starting) {
      router.push("/workout");
      return;
    }
    setStarting(true);
    const supabase = await getSupabase();
    if (!supabase) {
      setStarting(false);
      return;
    }
    const id = await startSession(supabase, user, {
      templateId: active.templateId,
      exerciseIds: active.exerciseIds,
    });
    setStarting(false);
    if (id) router.push("/session");
  }

  const splitLine = split
    ? [...new Set((split.days ?? []).filter((d) => !d.is_rest).map((d) => d.label))].join(", ") || split.name
    : "Set a split";
  const lastNames = [];
  for (const set of lastSession?.sets ?? []) {
    const name = set.exercises?.name;
    if (name && !lastNames.includes(name)) lastNames.push(name);
  }
  const lastWhen = lastSession
    ? new Date(lastSession.started_at).toLocaleDateString(undefined, { weekday: "long", day: "numeric" })
    : "";

  return (
    <section className="page">
      <ConfigBanner />
      <p className="home-day">{when}</p>
      <div className="tiles">
        <button type="button" className="tile" onClick={() => router.push("/workout?tab=routines")}>
          <img src="/photos/split-bells.jpg" alt="" />
          <span className="tile-copy"><span className="name">Split</span><span className="sets">{splitLine}</span></span>
        </button>
        <button type="button" className="tile" onClick={() => router.push("/exercises")}>
          <img src="/photos/library-you.jpg" alt="" style={{ objectPosition: "center 39%" }} />
          <span className="tile-copy"><span className="name">Library</span><span className="sets">{EXERCISES.length} exercises</span></span>
        </button>
        <button type="button" className="tile" onClick={() => router.push("/stats")}>
          <img src="/photos/progress-pullup.jpg" alt="" style={{ objectPosition: "center 22%" }} />
          <span className="tile-copy"><span className="name">Progress</span><span className="sets">{weekVolume.toLocaleString()} lb this week</span></span>
        </button>
      </div>
      <div className="picks" role="group" aria-label="Today's workout">
        {routines.map((routine) => (
          <button
            key={routine.key}
            type="button"
            aria-pressed={active?.key === routine.key}
            onClick={() => chooseRoutine(routine)}
          >
            {routineLabel(routine)}
          </button>
        ))}
      </div>
      <section className="ready">
        <div>
          <p className="ready-label">{loggedToday ? "Logged" : hasActive ? "In progress" : "Ready to train"}</p>
          <h1>{active?.name || (todayDay?.is_rest ? "Rest" : DOW[todayIdx])}</h1>
          <p className="sub">
            {loggedToday
              ? "Open the finished session"
              : active?.exerciseIds?.length
                ? `${active.exerciseIds.length} exercises · ${active.focus || ""}`
                : "Choose a workout for this day."}
          </p>
        </div>
        <button className="play" type="button" aria-label={loggedToday ? "View workout" : "Start workout"} onClick={onPlay} disabled={starting}>
          <Icon name="play" />
        </button>
      </section>
      <div className="dests">
        <button type="button" className="dest" onClick={() => router.push("/workout?tab=routines")}>
          <Icon name="workouts" /><span><span className="name">Routines</span><span className="sets">The split</span></span>
        </button>
        <button type="button" className="dest" onClick={() => router.push("/history")}>
          <Icon name="progress" /><span><span className="name">History</span><span className="sets">{finished.length} {finished.length === 1 ? "workout" : "workouts"}</span></span>
        </button>
        <button type="button" className="dest" onClick={() => router.push("/exercises")}>
          <Icon name="library" /><span><span className="name">Exercises</span><span className="sets">{EXERCISES.length} in the library</span></span>
        </button>
        <button type="button" className="dest" onClick={() => lastSession && router.push(`/history?id=${lastSession.id}`)} disabled={!lastSession}>
          <Icon name="home" /><span><span className="name">Last session</span><span className="sets">{lastSession ? `${lastNames[0] || "Session"} · ${lastWhen}` : "None yet"}</span></span>
        </button>
      </div>
    </section>
  );
}
