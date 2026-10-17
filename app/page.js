"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, ACTIVE_WORKOUT_KEY } from "../lib/supabase";
import { formatDateTime } from "../lib/format";
import ConfigBanner from "./components/ConfigBanner";

export default function Home() {
  const router = useRouter();
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [hasActive, setHasActive] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(
      new Date()
        .toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
        .toUpperCase()
    );
    setHasActive(Boolean(localStorage.getItem(ACTIVE_WORKOUT_KEY)));
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("id, started_at, ended_at, sets(id)")
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(5);
      if (!error && data) setRecent(data);
      setLoading(false);
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

  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <p className="kicker">{today}</p>
        <h1 className="large-title">LiftLog</h1>
      </header>

      <div className="screen-body">
        {hasActive && (
          <>
            <div className="card">
              <p className="headline">Workout in progress</p>
              <div className="spacer-8" />
              <p className="footnote">You have an unfinished session waiting.</p>
              <div className="spacer-12" />
              <button className="btn btn-tinted" onClick={() => router.push("/workout")}>
                Resume workout
              </button>
            </div>
            <div className="spacer-16" />
          </>
        )}

        <button className="btn btn-filled" onClick={startWorkout} disabled={starting || !isConfigured}>
          {starting ? "Starting…" : "Start workout"}
        </button>

        <div className="spacer-24" />
        <p className="section-label">Recent workouts</p>

        {loading ? (
          <p className="loading">Loading…</p>
        ) : recent.length === 0 ? (
          <div className="card">
            <p className="body">No workouts yet.</p>
            <div className="spacer-8" />
            <p className="footnote">
              Tap <strong>Start workout</strong> to log your first session.
            </p>
          </div>
        ) : (
          recent.map((w) => (
            <div className="card" key={w.id}>
              <div className="workout-row-head">
                <div>
                  <p className="headline">{formatDateTime(w.started_at)}</p>
                  <div className="spacer-8" />
                  <p className="footnote">
                    {w.sets.length} {w.sets.length === 1 ? "set" : "sets"} logged
                  </p>
                </div>
                <span className="chev">›</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
