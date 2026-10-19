"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, ACTIVE_WORKOUT_KEY, TEMPLATE_EXERCISES_KEY } from "../lib/supabase";
import { loadSplit } from "../lib/presets";
import { thumbFor } from "../lib/catalog";
import ConfigBanner from "./components/ConfigBanner";
import Icon from "./components/Icon";
import { useAuth } from "./components/AuthContext";
import { getProfilePhoto } from "../lib/profilePhoto";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const todayIdx = () => (new Date().getDay() + 6) % 7;

/** 5400 -> "5.4k", 950 -> "950" */
function fmtVol(v) {
  const n = Math.round(v || 0);
  if (n >= 10000) return Math.round(n / 1000) + "k";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function fmtTime(min) {
  const m = Math.round(min || 0);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m`;
}

/** Monday 00:00 of the week containing `d` (local time). */
function mondayOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

/** Unique exercises in a workout, in first-seen order. */
function workoutExercises(w) {
  const map = new Map();
  for (const s of w.sets ?? []) {
    if (!map.has(s.exercise_id)) {
      map.set(s.exercise_id, {
        name: s.exercises?.name ?? "Exercise",
        muscle: s.exercises?.muscle_group ?? "",
      });
    }
  }
  return [...map.values()];
}

function workoutVolume(w) {
  return (w.sets ?? []).reduce((s, x) => s + (x.reps ?? 0) * Number(x.weight ?? 0), 0);
}

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  // All date math happens inside the effect so the render stays deterministic
  // (Next.js prerender rejects `new Date()` during render).
  const [model, setModel] = useState(null);
  const [hasActive, setHasActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startingTpl, setStartingTpl] = useState(null);
  const [todayLabel, setTodayLabel] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarSrc, setAvatarSrc] = useState("/assets/avatar-default.jpg");

  useEffect(() => {
    getProfilePhoto().then((p) => { if (p) setAvatarSrc(p); });
  }, []);
  const [greeting, setGreeting] = useState("Good morning");
  const [goal, setGoal] = useState(4);
  const [split, setSplit] = useState(null);
  const [ti, setTi] = useState(null);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
    setTi(todayIdx());
    setTodayLabel(
      now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()
    );
    setHasActive(Boolean(localStorage.getItem(ACTIVE_WORKOUT_KEY)));

    const weekStart = mondayOf(now);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    const base = {
      weekDays,
      todayStr: now.toDateString(),
      logged: [],
      finished: [],
      latest: null,
      weekWorkouts: [],
      weekVolume: 0,
      weekSetCount: 0,
    };
    if (!isConfigured) {
      setModel(base);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("workouts")
        .select("id, started_at, ended_at, sets(id, reps, weight, exercise_id, exercises(name, muscle_group))")
        .order("started_at", { ascending: false })
        .limit(60);
      const all = data ?? [];
      const finished = all.filter((w) => w.ended_at);
      const weekWorkouts = finished.filter((w) => new Date(w.started_at) >= weekStart);
      const weekSets = weekWorkouts.flatMap((w) => w.sets ?? []);
      // Streak: consecutive days (ending today or yesterday) with a workout.
      const daySet = new Set(finished.map((w) => new Date(w.started_at).toDateString()));
      let streak = 0;
      const cursor = new Date(now);
      if (!daySet.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
      while (daySet.has(cursor.toDateString())) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      setModel({
        ...base,
        logged: weekWorkouts.map((w) => new Date(w.started_at).toDateString()),
        finished,
        latest: finished[0] ?? null,
        weekWorkouts,
        weekVolume: weekSets.reduce((s, x) => s + (x.reps ?? 0) * Number(x.weight ?? 0), 0),
        weekSetCount: weekSets.length,
        weekMinutes: Math.round(weekWorkouts.reduce((s, w) => {
          if (w.started_at && w.ended_at) {
            return s + (new Date(w.ended_at) - new Date(w.started_at)) / 60000;
          }
          return s;
        }, 0)),
        streak,
      });
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, weekly_goal")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.display_name) setDisplayName(profile.display_name);
        if (profile?.weekly_goal) setGoal(profile.weekly_goal);
        const s = await loadSplit(supabase, user.id);
        setSplit(s);
      }
    })();
  }, [user]);

  async function startFromTemplate(tpl) {
    if (!user || startingTpl || !isConfigured) return;
    setStartingTpl(tpl.id);
    const { data, error } = await supabase
      .from("workouts")
      .insert({ started_at: new Date().toISOString(), user_id: user.id, template_id: tpl.id })
      .select("id")
      .single();
    if (!error && data) {
      const exIds = (tpl.template_exercises ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((te) => te.exercises.id);
      if (exIds.length) localStorage.setItem(TEMPLATE_EXERCISES_KEY, JSON.stringify(exIds));
      localStorage.setItem(ACTIVE_WORKOUT_KEY, data.id);
      router.push("/session");
    }
    setStartingTpl(null);
  }

  async function startWorkout() {
    if (!isConfigured || !user) return;
    setStarting(true);
    const { data, error } = await supabase
      .from("workouts")
      .insert({ started_at: new Date().toISOString(), user_id: user.id })
      .select("id")
      .single();
    setStarting(false);
    if (error || !data) return;
    localStorage.setItem(ACTIVE_WORKOUT_KEY, data.id);
    router.push("/session");
  }

  const m = model;
  const today = split && ti !== null ? split.days.find((d) => d.day_index === ti) : null;
  const templates = split ? split.days.map((d) => d.template).filter(Boolean) : [];
  const nextDay = split && ti !== null
    ? [...split.days.slice(ti + 1), ...split.days.slice(0, ti + 1)].find((d) => !d.is_rest && d.template)
    : null;

  // Weekly bars: volume per day Mon..Sun
  const weekVol = (m?.weekDays ?? []).map((d) => {
    const key = d.toDateString();
    return (m?.weekWorkouts ?? [])
      .filter((w) => new Date(w.started_at).toDateString() === key)
      .flatMap((w) => w.sets ?? [])
      .reduce((s, x) => s + (x.reps ?? 0) * Number(x.weight ?? 0), 0);
  });
  const maxVol = Math.max(1, ...weekVol);

  const featureTpl = hasActive ? null : (today && !today.is_rest ? today.template : null);
  const featureName = hasActive
    ? "In progress"
    : today?.is_rest
      ? "Rest day"
      : featureTpl?.name || "Today's workout";
  const featureCount = featureTpl?.template_exercises?.length ?? 0;
  const featureMeta = hasActive
    ? "Pick up where you left off"
    : today?.is_rest
      ? "Recovery is part of the plan"
      : featureTpl
        ? `${featureCount} exercises${today.muscle_targets ? ` · ${today.muscle_targets}` : ""}`
        : "Set up a split to plan the week";

  function onStart() {
    if (hasActive) router.push("/session");
    else if (featureTpl) startFromTemplate(featureTpl);
    else router.push("/workout");
  }

  const recent = (m?.finished ?? []).slice(0, 4);
  const minutes = m?.weekMinutes ?? 0;

  return (
    <section className="screen" data-screen="home">
      <ConfigBanner />
      <div className="dash">
        <header className="dash-head">
          <div>
            <p className="hello">{greeting},</p>
            <h1 className="hello-name">{displayName || "Sebas"}</h1>
          </div>
          <div className="dash-tools">
            <button className="avatar-btn" type="button" aria-label="Profile" onClick={() => router.push("/profile")}>
              <img src={avatarSrc} alt="" />
            </button>
            <button className="icon-btn" type="button" aria-label="Settings" onClick={() => router.push("/settings")}>
              <Icon name="gear" />
            </button>
          </div>
        </header>

        <article className="feature">
          <img src="/assets/hero-skyline.jpg" alt="Sebas at the window before training, city beyond the glass" data-muse-slot="hero-still" />
          <div className="feature-scrim" />
          <div className="feature-copy">
            <p className="kicker">Today&apos;s Workout</p>
            <h2>{featureName}</h2>
            <p className="today-meta">{featureMeta}</p>
            <button className="btn btn-mint" type="button" disabled={starting || startingTpl !== null} onClick={onStart}>
              <span>{hasActive ? "Resume Workout" : startingTpl ? "Starting…" : featureTpl ? "Start Workout" : "View Split"}</span>
              <Icon name="arrow" />
            </button>
          </div>
        </article>

        <section className="panel">
          <div className="panel-head">
            <h2>Weekly Progress</h2>
            <span className="week-note">{m?.weekWorkouts.length ?? 0}/{goal} workouts</span>
          </div>
          <div className="bars" role="img" aria-label="Training volume this week">
            {weekVol.map((v, i) => (
              <span key={i} className={v > 0 ? "" : "is-rest"} style={{ "--h": `${v ? Math.max(28, Math.round((v / maxVol) * 100)) : 22}%` }} />
            ))}
          </div>
          <div className="day-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
          <div className="stat-row">
            <div><strong>{fmtVol(m?.weekVolume)} lb</strong><span>Total Volume</span></div>
            <div><strong>{fmtTime(minutes)}</strong><span>Active Time</span></div>
            <div><strong>{Math.round(minutes * 11.5)}</strong><span>Calories</span></div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Next Up</h2>
            <button className="text-link" type="button" onClick={() => router.push("/workout")}>View All</button>
          </div>
          {nextDay?.template ? (
            <button className="act-row" type="button" onClick={() => startFromTemplate(nextDay.template)}>
              <img className="thumb" src={thumbFor(nextDay.template.template_exercises?.[0]?.exercises?.name)} alt="" />
              <span className="link-copy">
                <strong>{nextDay.template.name}</strong>
                <small>{DAY_LABELS[nextDay.day_index]} · {nextDay.template.template_exercises?.length ?? 0} exercises{nextDay.template.est_minutes ? ` · ${nextDay.template.est_minutes} min` : ""}</small>
              </span>
              <Icon name="chevron" />
            </button>
          ) : (
            <p className="empty">Your next session shows up once a split is saved.</p>
          )}
        </section>

        <section className="panel panel-list">
          <div className="panel-head">
            <h2>Recent Activity</h2>
            <button className="text-link" type="button" onClick={() => router.push("/history")}>View History</button>
          </div>
          {m === null ? (
            <p className="loading">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="empty">No workouts yet</p>
          ) : recent.map((w) => {
            const exs = workoutExercises(w);
            const mins = w.started_at && w.ended_at
              ? Math.max(1, Math.round((new Date(w.ended_at) - new Date(w.started_at)) / 60000))
              : 0;
            return (
              <button key={w.id} className="act-row" type="button" onClick={() => router.push(`/history?id=${w.id}`)}>
                <img className="thumb" src={thumbFor(exs[0]?.name)} alt="" />
                <span className="link-copy">
                  <strong>{exs[0]?.name || "Workout"}</strong>
                  <small>{new Date(w.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small>
                </span>
                <span className="act-meta">
                  <span><Icon name="clock" />{mins} min</span>
                  <span><Icon name="workouts" />{fmtVol(workoutVolume(w))} lb</span>
                </span>
                <Icon name="chevron" />
              </button>
            );
          })}
        </section>
      </div>
    </section>
  );
}
