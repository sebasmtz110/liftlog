"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, isConfigured } from "../../lib/supabase";
import ConfigBanner from "../components/ConfigBanner";

const RANGES = [
  { id: "week", label: "Week", days: 7 },
  { id: "month", label: "Month", days: 30 },
  { id: "year", label: "Year", days: 365 },
];

function startOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function Stats() {
  const [range, setRange] = useState("week");
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  // All date math happens inside the effect so the render stays deterministic
  // (Next.js prerender rejects `new Date()` during render).
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("workouts")
        .select("id, started_at, sets(id, reps, weight, exercises(name, muscle_group))")
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(200);
      setWorkouts(data ?? []);
      setLoading(false);
    })();
  }, []);

  const model = useMemo(() => {
    if (!now) return null;
    const r = RANGES.find((x) => x.id === range);
    const cutoff = startOf(now);
    cutoff.setDate(cutoff.getDate() - r.days);
    const inRange = workouts.filter((w) => new Date(w.started_at) >= cutoff);
    const sets = inRange.flatMap((w) =>
      (w.sets ?? []).map((s) => ({ ...s, date: w.started_at }))
    );
    const volume = sets.reduce((s, x) => s + (x.reps ?? 0) * Number(x.weight ?? 0), 0);

    // PRs: exercises whose all-time best weight happened inside the range.
    const bestByEx = new Map();
    for (const w of workouts) {
      for (const s of w.sets ?? []) {
        const name = s.exercises?.name;
        if (!name || !(Number(s.weight) > 0)) continue;
        const cur = bestByEx.get(name);
        const wt = Number(s.weight);
        if (!cur || wt > cur.weight) bestByEx.set(name, { weight: wt, date: w.started_at });
      }
    }
    const prs = [...bestByEx.entries()].filter(([, b]) => new Date(b.date) >= cutoff);

    // Per-muscle hard sets in range.
    const muscleSets = {};
    for (const s of sets) {
      const m = s.exercises?.muscle_group || "Other";
      muscleSets[m] = (muscleSets[m] || 0) + 1;
    }

    // Trend: most-logged exercise in range.
    const countByEx = {};
    for (const s of sets) {
      const n = s.exercises?.name;
      if (n) countByEx[n] = (countByEx[n] || 0) + 1;
    }
    const topEx = Object.entries(countByEx).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const trendSets = topEx
      ? sets
          .filter((s) => s.exercises?.name === topEx && Number(s.weight) > 0)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5)
      : [];

    return { inRange, sets, volume, prs, muscleSets, topEx, trendSets };
  }, [workouts, range, now]);

  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <h1 className="large-title">Progress</h1>
      </header>

      <div className="screen-body">
        {loading || !model ? (
          <p className="loading">Loading…</p>
        ) : (
          <>
            <div className="seg" role="tablist" aria-label="Range">
              {RANGES.map((r) => (
                <button key={r.id} className={range === r.id ? "on" : ""} onClick={() => setRange(r.id)}>
                  {r.label}
                </button>
              ))}
            </div>

            <div className="stat-grid-3">
              <div className="stat-card">
                <p className="stat-kicker">Workouts</p>
                <p className="stat-value">{model.inRange.length}</p>
                <p className="stat-label">{range}</p>
              </div>
              <div className="stat-card">
                <p className="stat-kicker">Volume</p>
                <p className="stat-value">
                  {model.volume >= 1000 ? `${(model.volume / 1000).toFixed(1).replace(/\.0$/, "")}k` : Math.round(model.volume)}
                </p>
                <p className="stat-label">lb lifted</p>
              </div>
              <div className="stat-card">
                <p className="stat-kicker">PRs</p>
                <p className="stat-value">{model.prs.length}</p>
                <p className="stat-label">{range}</p>
              </div>
            </div>

            <div className="spacer-16" />
            {model.topEx && (
              <div className="card">
                <p className="headline">{model.topEx}</p>
                {model.trendSets.length >= 2 ? (
                  model.trendSets.map((s, i) => (
                    <p key={i} className="footnote">
                      {new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {" — "}{s.weight} lb × {s.reps}
                    </p>
                  ))
                ) : (
                  <p className="footnote">Log more sessions to see the trend.</p>
                )}
              </div>
            )}

            <div className="spacer-16" />
            <h2 className="section-title">Volume by muscle</h2>
            <div className="card" style={{ padding: "6px 16px" }}>
              <p className="footnote" style={{ paddingTop: 8 }}>10–20 hard sets per week is the productive range.</p>
              {Object.entries(model.muscleSets)
                .sort((a, b) => b[1] - a[1])
                .map(([muscle, n]) => (
                  <div key={muscle} className="vol-row">
                    <div className="vol-top">
                      <span className="headline">
                        {muscle}
                        {n >= 10 && <span className="vol-badge">Building</span>}
                      </span>
                      <span className="footnote">{n} / 20</span>
                    </div>
                    <div className="vol-bar">
                      <div className="vol-fill" style={{ width: `${Math.min(100, (n / 20) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              {Object.keys(model.muscleSets).length === 0 && (
                <p className="footnote" style={{ padding: "8px 0" }}>No sets logged in this range yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
