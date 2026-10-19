"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isConfigured } from "../../lib/supabase";
import { thumbFor } from "../../lib/catalog";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

function minutesBetween(a, b) {
  if (!a || !b) return 0;
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000));
}

function HistoryInner() {
  const router = useRouter();
  const params = useSearchParams();
  const focus = params.get("id");
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(focus);

  useEffect(() => { setOpenId(focus); }, [focus]);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("id, started_at, ended_at, template_id, sets(id, set_number, reps, weight, exercise_id, exercises(name, muscle_group))")
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(40);
      if (!error && data) setWorkouts(data);
      setLoading(false);
    })();
  }, []);

  const open = useMemo(() => workouts.find((w) => w.id === openId) || null, [workouts, openId]);

  if (open) {
    const groups = new Map();
    for (const s of [...(open.sets ?? [])].sort((a, b) => a.set_number - b.set_number)) {
      if (!groups.has(s.exercise_id)) {
        groups.set(s.exercise_id, { name: s.exercises?.name ?? "Exercise", sets: [] });
      }
      groups.get(s.exercise_id).sets.push(s);
    }
    const volume = (open.sets ?? []).reduce((sum, s) => sum + (s.reps ?? 0) * Number(s.weight ?? 0), 0);
    const mins = minutesBetween(open.started_at, open.ended_at);
    return (
      <section className="screen" data-screen="history-detail">
        <header className="subhead">
          <button type="button" aria-label="Back" onClick={() => { setOpenId(null); router.replace("/history"); }}>
            <Icon name="back" />
          </button>
          <h1>Workout</h1>
          <span />
        </header>
        <div className="pad">
          <p className="note">
            {new Date(open.started_at).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            {" · "}{mins} min · {Math.round(volume).toLocaleString()} lb
          </p>
          {[...groups.values()].map((g) => (
            <div className="day-line" key={g.name}>
              <strong>{g.name}</strong>
              <span>{g.sets.map((s) => `${s.weight} lb × ${s.reps}`).join("  ·  ")}</span>
            </div>
          ))}
          {groups.size === 0 && <p className="empty">No sets were logged.</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="screen" data-screen="history">
      <ConfigBanner />
      <header className="page-head">
        <h1>Workout History</h1>
      </header>
      {loading ? (
        <p className="loading">Loading…</p>
      ) : workouts.length === 0 ? (
        <div className="empty"><p>No workouts yet</p></div>
      ) : (
        <div id="history-list">
          {workouts.map((w) => {
            const names = [];
            for (const s of w.sets ?? []) {
              const n = s.exercises?.name;
              if (n && !names.includes(n)) names.push(n);
            }
            const mins = minutesBetween(w.started_at, w.ended_at);
            const when = new Date(w.started_at);
            return (
              <div key={w.id}>
                <p className="date-label">{when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                <button className="ex-row" type="button" onClick={() => setOpenId(w.id)}>
                  <img className="thumb" src={thumbFor(names[0])} alt="" />
                  <span className="ex-copy">
                    <strong>{names[0] || "Workout"}</strong>
                    <small>{names.length} exercises · {mins} min</small>
                  </span>
                  <Icon name="chevron" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function History() {
  return (
    <Suspense fallback={<p className="loading">Loading…</p>}>
      <HistoryInner />
    </Suspense>
  );
}
