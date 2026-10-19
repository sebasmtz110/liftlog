"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, ACTIVE_WORKOUT_KEY, TEMPLATE_EXERCISES_KEY } from "../lib/supabase";
import { formatDateTime } from "../lib/format";
import { loadSplit } from "../lib/presets";
import ConfigBanner from "./components/ConfigBanner";
import { useAuth } from "./components/AuthContext";

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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

function DumbbellGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="10.8" y="11" width="2.4" height="2" rx="1" />
      <rect x="7.6" y="9.4" width="2.2" height="5.2" rx="1" />
      <rect x="14.2" y="9.4" width="2.2" height="5.2" rx="1" />
      <rect x="4.6" y="7.6" width="2.2" height="8.8" rx="1" />
      <rect x="17.2" y="7.6" width="2.2" height="8.8" rx="1" />
    </svg>
  );
}

function ThumbTile({ name, className = "" }) {
  return (
    <span className={`thumb-tile${className ? " " + className : ""}`} aria-hidden="true">
      {(name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
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
  const { user, signOut } = useAuth();
  // All date math happens inside the effect so the render stays deterministic
  // (Next.js prerender rejects `new Date()` during render).
  const [model, setModel] = useState(null);
  const [hasActive, setHasActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startingTpl, setStartingTpl] = useState(null);
  const [todayLabel, setTodayLabel] = useState("");
  const [displayName, setDisplayName] = useState("");
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
  const latest = m?.latest ?? null;
  const latestExs = latest ? workoutExercises(latest) : [];
  const latestMuscles = [...new Set(latestExs.map((e) => e.muscle).filter(Boolean))];
  const latestTitle = latest
    ? new Date(latest.started_at).toLocaleDateString(undefined, { weekday: "long" }) + " workout"
    : null;

  // Today's split state (moved here from the Workout tab, like SebasFit's home).
  const today = split && ti !== null ? split.days.find((d) => d.day_index === ti) : null;
  const templates = split ? split.days.map((d) => d.template).filter(Boolean) : [];

  // Weekly bars: volume per day Mon..Sun
  const weekVol = (m?.weekDays ?? []).map((d) => {
    const key = d.toDateString();
    return (m?.weekWorkouts ?? [])
      .filter((w) => new Date(w.started_at).toDateString() === key)
      .flatMap((w) => w.sets ?? [])
      .reduce((s, x) => s + (x.reps ?? 0) * Number(x.weight ?? 0), 0);
  });
  const maxVol = Math.max(1, ...weekVol);

  return (
    <>
      <ConfigBanner />
      {/* Hero — editorial training visual (real app asset) */}
      <div className="hero">
        <img className="hero-photo" src="/hero-back.jpg" alt="" aria-hidden="true" />
        <div className="hero-avatar" aria-hidden="true">
          <img src="/avatar.jpg" alt="" onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement.textContent = (displayName || "S").charAt(0).toUpperCase();
          }} />
        </div>
        <p className="hero-greet">{greeting},</p>
        <h1 className="hero-name">{displayName || "Sebas"}</h1>
        <p className="hero-tag">Discipline builds freedom.</p>
      </div>

      {/* Today's workout — dark card overlapping hero, like the board */}
      {split && today && (
        <div className="today-card">
            <p className="tc-kick">Today's Workout</p>
            {today.is_rest ? (
              <>
                <p className="tc-title">Rest day</p>
                <p className="tc-meta">Recovery is when you grow. Sleep 7–9h.</p>
                <div className="spacer-12" />
                <div className="chip-row" style={{ marginTop: 0 }}>
                  {templates.slice(0, 3).map((t) => (
                    <button key={t.id} className="pill" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
                      disabled={startingTpl !== null} onClick={() => startFromTemplate(t)}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </>
            ) : today.template ? (
              <>
                <p className="tc-title">{today.template.name}</p>
                <p className="tc-meta">
                  {today.template.template_exercises?.length ?? 0} exercises
                  {today.muscle_targets ? ` · ${today.muscle_targets}` : ""}
                </p>
                <div className="spacer-12" />
                <button className="btn btn-mint" style={{ padding: "14px 28px", fontSize: 16 }}
                  disabled={startingTpl === today.template.id}
                  onClick={() => startFromTemplate(today.template)}>
                  {startingTpl === today.template.id ? "Starting…" : "Start Workout →"}
                </button>
              </>
            ) : null}
        </div>
      )}

      <div className="screen-body" style={{ background: "var(--bg)" }}>
        <div className="spacer-20" />

        {/* Weekly progress */}
        <h2 className="title-2">Weekly Progress</h2>
        <div className="spacer-8" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <p style={{ fontSize: 30, lineHeight: "36px", fontWeight: 700 }}>{m?.weekWorkouts.length ?? 0}/{goal}</p>
          <p className="footnote">workouts completed</p>
        </div>
        <div className="week-bars" aria-label="Volume by day">
          {(m?.weekDays ?? []).map((d, i) => (
            <div className="wbar-col" key={i}>
              <div className="wbar-track">
                <div className={`wbar${weekVol[i] > 0 ? " fill" : ""}`} style={{ height: `${Math.max(24, (weekVol[i] / maxVol) * 120)}px` }} />
              </div>
              <span className="wbar-label">{DAY_LABELS[i][0] + DAY_LABELS[i].slice(1).toLowerCase()}</span>
            </div>
          ))}
        </div>

        <div className="spacer-24" />

        {/* This week stats — board: small gray label + 3 columns */}
        <p className="footnote" style={{ marginBottom: 4 }}>This Week</p>
        <div className="stat-band">
          <div><p className="stat-value tnum">{fmtVol(m?.weekVolume)}</p><p className="stat-label">Volume</p></div>
          <div><p className="stat-value tnum">{fmtTime(m?.weekMinutes)}</p><p className="stat-label">Time</p></div>
          <div><p className="stat-value tnum">{Math.round((m?.weekMinutes ?? 0) * 5)}</p><p className="stat-label">Calories</p></div>
        </div>

        {/* Resume / start */}
        {hasActive ? (
          <>
            <button className="btn btn-filled btn-block" onClick={() => router.push("/session")}>
              Resume workout
            </button>
            <div className="spacer-16" />
          </>
        ) : null}

        {/* Recent workouts */}
        <div className="row-2" style={{ justifyContent: "space-between", marginBottom: 4 }}>
          <h2 className="title-2">Recent</h2>
          <button className="btn btn-plain btn-sm" onClick={() => router.push("/history")}>View all</button>
        </div>
        {m === null ? (
          <p className="loading">Loading…</p>
        ) : m.finished.length === 0 ? (
          <p className="footnote">No workouts yet — start your first session above.</p>
        ) : (
          m.finished.slice(0, 4).map((w) => {
            const exs = workoutExercises(w);
            const first = exs[0];
            return (
              <button key={w.id} className="recent-row" onClick={() => router.push("/history")}>
                {first && <ThumbTile name={first.name} className="recent-thumb" />}
                <div className="recent-info">
                  <p className="headline">{formatDateTime(w.started_at)}</p>
                  <div className="spacer-8" />
                  <p className="footnote">
                    {(w.sets ?? []).length} {(w.sets ?? []).length === 1 ? "set" : "sets"} ·{" "}
                    {exs.length} {exs.length === 1 ? "exercise" : "exercises"} · {fmtVol(workoutVolume(w))} lb
                  </p>
                </div>
                <span className="chev">›</span>
              </button>
            );
          })
        )}
        {user && (
          <p className="footnote" style={{ marginTop: 24, textAlign: "center" }}>
            {user.email} ·{" "}
            <button onClick={signOut} style={{ color: "var(--mu)", textDecoration: "underline", background: "none", border: 0, padding: 0 }}>
              Sign out
            </button>
          </p>
        )}
      </div>
    </>
  );
}
