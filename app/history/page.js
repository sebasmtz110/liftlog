"use client";

import { useEffect, useState } from "react";
import { supabase, isConfigured } from "../../lib/supabase";
import { formatDateTime } from "../../lib/format";
import ConfigBanner from "../components/ConfigBanner";

/** Past workouts with expandable per-exercise set details. */
export default function History() {
  const [workouts, setWorkouts] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select(
          "id, started_at, ended_at, sets(id, set_number, reps, weight, exercise_id, exercises(name, muscle_group))"
        )
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(30);
      if (!error && data) setWorkouts(data);
      setLoading(false);
    })();
  }, []);

  function toggle(id) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  /** Group a workout's sets by exercise, preserving set order. */
  function groupSets(sets) {
    const map = new Map();
    const sorted = [...sets].sort((a, b) => a.set_number - b.set_number);
    for (const s of sorted) {
      if (!map.has(s.exercise_id)) {
        map.set(s.exercise_id, {
          name: s.exercises?.name ?? "Exercise",
          muscle: s.exercises?.muscle_group ?? "",
          sets: [],
        });
      }
      map.get(s.exercise_id).sets.push(s);
    }
    return [...map.values()];
  }

  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <h1 className="large-title">History</h1>
      </header>

      <div className="screen-body">
        {loading ? (
          <p className="loading">Loading…</p>
        ) : workouts.length === 0 ? (
          <div className="empty">
            <p className="headline">No workouts yet</p>
            <div className="spacer-8" />
            <p className="footnote">Finished sessions will show up here.</p>
          </div>
        ) : (
          workouts.map((w) => {
            const open = Boolean(expanded[w.id]);
            return (
              <button key={w.id} className="workout-row" onClick={() => toggle(w.id)}
                aria-expanded={open}>
                <div className="workout-row-head">
                  <div>
                    <p className="headline">{formatDateTime(w.started_at)}</p>
                    <div className="spacer-8" />
                    <p className="footnote">
                      {w.sets.length} {w.sets.length === 1 ? "set" : "sets"} ·{" "}
                      {new Set(w.sets.map((s) => s.exercise_id)).size} exercises
                    </p>
                  </div>
                  <span className={`chev${open ? " open" : ""}`}>›</span>
                </div>
                {open && (
                  <div className="workout-detail">
                    {groupSets(w.sets).map((g) => (
                      <div key={g.name}>
                        <p className="detail-exercise">
                          {g.name} <span className="caption">· {g.muscle}</span>
                        </p>
                        {g.sets.map((s) => (
                          <p className="detail-set" key={s.id}>
                            Set {s.set_number}: {s.reps} reps × {s.weight} lb
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
