"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, ACTIVE_WORKOUT_KEY } from "../lib/supabase";
import { formatDateTime } from "../lib/format";
import { muscleTagClass } from "../lib/muscleColors";
import ConfigBanner from "./components/ConfigBanner";

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/** 5400 -> "5.4k", 950 -> "950" */
function fmtVol(v) {
  const n = Math.round(v || 0);
  if (n >= 10000) return Math.round(n / 1000) + "k";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
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

function ThumbTile({ name, muscle, className = "" }) {
  const tint = muscleTagClass(muscle);
  return (
    <span className={`thumb-tile${tint ? " " + tint : ""}${className ? " " + className : ""}`} aria-hidden="true">
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
  // All date math happens inside the effect so the render stays deterministic
  // (Next.js prerender rejects `new Date()` during render).
  const [model, setModel] = useState(null);
  const [hasActive, setHasActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    const now = new Date();
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
        .limit(12);
      const all = data ?? [];
      const finished = all.filter((w) => w.ended_at);
      const weekWorkouts = all.filter((w) => new Date(w.started_at) >= weekStart);
      const weekSets = weekWorkouts.flatMap((w) => w.sets ?? []);
      setModel({
        ...base,
        logged: weekWorkouts.map((w) => new Date(w.started_at).toDateString()),
        finished,
        latest: finished[0] ?? null,
        weekWorkouts,
        weekVolume: weekSets.reduce((s, x) => s + (x.reps ?? 0) * Number(x.weight ?? 0), 0),
        weekSetCount: weekSets.length,
      });
    })();
  }, []);

  async function startWorkout() {
    if (!isConfigured) return;
    setStarting(true);
    const { data, error } = await supabase
      .from("workouts")
      .insert({ started_at: new Date().toISOString() })
      .select("id")
      .single();
    setStarting(false);
    if (error || !data) return;
    localStorage.setItem(ACTIVE_WORKOUT_KEY, data.id);
    router.push("/workout");
  }

  const m = model;
  const latest = m?.latest ?? null;
  const latestExs = latest ? workoutExercises(latest) : [];
  const latestMuscles = [...new Set(latestExs.map((e) => e.muscle).filter(Boolean))];
  const latestTitle = latest
    ? new Date(latest.started_at).toLocaleDateString(undefined, { weekday: "long" }) + " workout"
    : null;

  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <p className="sl-date">{todayLabel}</p>
        <div className="greet-row">
          <h1 className="large-title">Hey, lifter</h1>
          <span className="avatar-circle" aria-hidden="true">
            <DumbbellGlyph />
          </span>
        </div>
      </header>

      <div className="screen-body">
        {/* Week dots — MON..SUN, logged = pink fill + check, today = pink ring */}
        <div className="week-dots" aria-label="Workouts this week">
          {(m?.weekDays ?? []).map((d, i) => {
            const key = d.toDateString();
            const done = (m?.logged ?? []).includes(key);
            const isToday = key === m?.todayStr;
            return (
              <div className="wdot-col" key={i}>
                <span className="wdot-label">{DAY_LABELS[i]}</span>
                <span className={`wdot${done ? " done" : ""}${!done && isToday ? " today" : ""}`}>
                  {done && <CheckIcon />}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hero card — latest finished workout, or empty state */}
        <div className="card">
          <p className="kicker">{latest ? "Latest workout" : "Get started"}</p>
          <div className="spacer-8" />
          {m === null ? (
            <p className="loading">Loading…</p>
          ) : latest ? (
            <>
              <h2 className="large-title" style={{ margin: "0 0 6px" }}>{latestTitle}</h2>
              {latestMuscles.length > 0 && (
                <p className="footnote">{latestMuscles.join(", ")}</p>
              )}
              {latestExs.length > 0 && (
                <div className="thumb-row">
                  {latestExs.slice(0, 4).map((e, i) => (
                    <ThumbTile key={i} name={e.name} muscle={e.muscle} />
                  ))}
                </div>
              )}
              <p className="footnote">
                {latestExs.length} {latestExs.length === 1 ? "exercise" : "exercises"} ·{" "}
                {(latest.sets ?? []).length} {(latest.sets ?? []).length === 1 ? "set" : "sets"} ·{" "}
                {fmtVol(workoutVolume(latest))} lb
              </p>
            </>
          ) : (
            <>
              <h2 className="large-title" style={{ margin: "0 0 6px" }}>No workouts yet</h2>
              <p className="footnote">Start your first session to see it here.</p>
              <div className="spacer-8" />
            </>
          )}
          <button
            className="btn btn-filled"
            onClick={hasActive ? () => router.push("/workout") : startWorkout}
            disabled={starting || !isConfigured}
          >
            {starting ? "Starting…" : hasActive ? "Resume workout" : "Start workout"}
          </button>
        </div>

        {/* This week — real numbers from Supabase */}
        <h2 className="section-title">This week</h2>
        {m === null ? (
          <p className="loading">Loading…</p>
        ) : (
          <div className="stat-grid-3">
            <div className="stat-card">
              <p className="stat-kicker">Workouts</p>
              <p className="stat-value">{m.weekWorkouts.length}</p>
              <p className="stat-label">this week</p>
            </div>
            <div className="stat-card">
              <p className="stat-kicker">Volume</p>
              <p className="stat-value">{fmtVol(m.weekVolume)}</p>
              <p className="stat-label">lb this week</p>
            </div>
            <div className="stat-card">
              <p className="stat-kicker">Sets</p>
              <p className="stat-value">{m.weekSetCount}</p>
              <p className="stat-label">this week</p>
            </div>
          </div>
        )}

        {/* Recent workouts */}
        <h2 className="section-title">Recent workouts</h2>
        {m === null ? (
          <p className="loading">Loading…</p>
        ) : m.finished.length === 0 ? (
          <div className="card">
            <p className="body">No workouts yet.</p>
            <div className="spacer-8" />
            <p className="footnote">
              Tap <strong>Start workout</strong> to log your first session.
            </p>
          </div>
        ) : (
          m.finished.slice(0, 5).map((w) => {
            const exs = workoutExercises(w);
            const first = exs[0];
            return (
              <button key={w.id} className="recent-row" onClick={() => router.push("/history")}>
                {first && <ThumbTile name={first.name} muscle={first.muscle} className="recent-thumb" />}
                <div className="recent-info">
                  <p className="headline">{formatDateTime(w.started_at)}</p>
                  <div className="spacer-8" />
                  <p className="footnote">
                    {(w.sets ?? []).length} {(w.sets ?? []).length === 1 ? "set" : "sets"} ·{" "}
                    {exs.length} {exs.length === 1 ? "exercise" : "exercises"}
                  </p>
                </div>
                <span className="chev">›</span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
