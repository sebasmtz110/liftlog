"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import { listPhotos, addPhoto, deletePhoto, shrinkPhoto } from "../../lib/photos";
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
  const { user } = useAuth();
  const [range, setRange] = useState("week");
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  // All date math happens inside the effect so the render stays deterministic
  // (Next.js prerender rejects `new Date()` during render).
  const [now, setNow] = useState(null);

  // Body: weight log (Supabase) + progress photos (on-device only).
  const [weights, setWeights] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [bwSheet, setBwSheet] = useState(null); // {id?, value}
  const [bwSaving, setBwSaving] = useState(false);
  const [confirmPhotoDel, setConfirmPhotoDel] = useState(null);
  const fileRef = useRef(null);

  async function refreshBody() {
    if (!user || !isConfigured) return;
    const { data } = await supabase
      .from("body_weights")
      .select("id, weight_lb, logged_at")
      .order("logged_at", { ascending: false })
      .limit(60);
    if (data) setWeights(data);
    try {
      setPhotos(await listPhotos());
    } catch {
      /* IndexedDB unavailable */
    }
  }

  useEffect(() => {
    refreshBody();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  async function saveWeight() {
    const v = Number(bwSheet?.value);
    if (!(v > 0) || !user || !isConfigured) return;
    setBwSaving(true);
    if (bwSheet.id) {
      await supabase.from("body_weights").update({ weight_lb: v }).eq("id", bwSheet.id);
    } else {
      await supabase.from("body_weights").insert({ user_id: user.id, weight_lb: v });
    }
    setBwSaving(false);
    setBwSheet(null);
    refreshBody();
  }

  async function deleteWeight(id) {
    if (!confirm("Delete this weight entry?")) return;
    await supabase.from("body_weights").delete().eq("id", id);
    refreshBody();
  }

  async function onPhotoFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const url = await shrinkPhoto(f);
      await addPhoto(url);
      setPhotos(await listPhotos());
    } catch {
      /* ignore */
    }
  }

  // Body-weight derived stats.
  const bwLatest = weights[0] ?? null;
  const bwWeek = weights.filter((w) => {
    if (!now) return false;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    return new Date(w.logged_at) >= cutoff;
  });
  const bwAvg =
    bwWeek.length > 0
      ? bwWeek.reduce((s, w) => s + Number(w.weight_lb), 0) / bwWeek.length
      : null;
  const bwDelta =
    bwWeek.length >= 2
      ? Number(bwWeek[0].weight_lb) - Number(bwWeek[bwWeek.length - 1].weight_lb)
      : null;

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

  const volumeSeries = useMemo(() => {
    if (!now) return [];
    const days = range === "month" ? 30 : range === "year" ? 12 : 7;
    return Array.from({ length: days }, (_, i) => {
      const start = new Date(now);
      if (range === "year") start.setMonth(start.getMonth() - (days - 1 - i), 1);
      else start.setDate(start.getDate() - (days - 1 - i));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      if (range === "year") end.setMonth(end.getMonth() + 1);
      else end.setDate(end.getDate() + 1);
      const vol = workouts
        .filter((w) => {
          const t = new Date(w.started_at);
          return t >= start && t < end;
        })
        .flatMap((w) => w.sets ?? [])
        .reduce((s, x) => s + (x.reps ?? 0) * Number(x.weight ?? 0), 0);
      const label = range === "year"
        ? start.toLocaleDateString(undefined, { month: "narrow" })
        : range === "week"
          ? start.toLocaleDateString(undefined, { weekday: "narrow" })
          : String(start.getDate());
      return { label, v: Math.round(vol) };
    });
  }, [workouts, range, now]);

  // Strava-style: weekly goal ring (workouts this week vs 5 goal)
  const weekWorkouts = model?.inRange?.length ?? 0;
  const goalPct = Math.min(100, Math.round((weekWorkouts / 5) * 100));
  const circ = 2 * Math.PI * 32;
  const off = circ * (1 - goalPct / 100);

  return (
    <section className="screen screen-progress" data-screen="progress">
      <ConfigBanner />
      {/* Small hero */}
      <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a1a1a, #2d2d2d)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.7), transparent 60%)" }} />
        <div style={{ position: "absolute", left: 20, bottom: 14, color: "#fff" }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>Progress</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, opacity: .8 }}>
            {range === "month" ? "This month" : "This week"} · {model?.inRange?.length ?? 0} workouts
          </p>
        </div>
      </div>

      <div className="screen-body">
        {loading || !model ? (
          <p className="loading">Loading…</p>
        ) : (
          <>
            <div className="chips dark-chips" role="tablist" style={{ margin: "12px 16px 0" }}>
              {RANGES.filter((r) => r.id !== "year").map((r) => (
                <button key={r.id} type="button" className={range === r.id ? "is-on" : ""} onClick={() => setRange(r.id)}>
                  {r.id === "week" ? "Week" : "Month"}
                </button>
              ))}
            </div>

            {/* Goal ring */}
            <div className="card" style={{ margin: "12px 16px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 76, height: 76, position: "relative", flex: "none" }}>
                  <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: "rotate(-90deg)", display: "block" }}>
                    <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="7" />
                    <circle cx="38" cy="38" r="32" fill="none" stroke="#F0372D" strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={circ.toFixed(0)} strokeDashoffset={off.toFixed(0)} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>
                    {goalPct}%
                  </div>
                </div>
                <div>
                  <p className="headline" style={{ margin: 0 }}>Weekly goal</p>
                  <p className="footnote" style={{ margin: "4px 0 0" }}>{weekWorkouts} of 5 workouts</p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 12, margin: "12px 16px 0" }}>
              <div className="card" style={{ flex: 1, margin: 0, textAlign: "center", padding: "14px 8px" }}>
                <p className="stat-value" style={{ fontSize: 22 }}>{model.inRange.length}</p>
                <p className="stat-label">Workouts</p>
              </div>
              <div className="card" style={{ flex: 1, margin: 0, textAlign: "center", padding: "14px 8px" }}>
                <p className="stat-value" style={{ fontSize: 22 }}>
                  {model.volume >= 1000 ? `${(model.volume / 1000).toFixed(1).replace(/\.0$/, "")}k` : Math.round(model.volume)}
                </p>
                <p className="stat-label">Volume lb</p>
              </div>
              <div className="card" style={{ flex: 1, margin: 0, textAlign: "center", padding: "14px 8px" }}>
                <p className="stat-value" style={{ fontSize: 22 }}>{model.prs.length}</p>
                <p className="stat-label">PRs</p>
              </div>
            </div>

            {/* Volume chart */}
            <div className="card" style={{ margin: "12px 16px 0" }}>
              <div className="chart-head"><h2>Volume</h2></div>
              <VolumeChart series={volumeSeries} />
            </div>

            {/* PRs */}
            {model.prs.length > 0 && (
              <div className="card" style={{ margin: "12px 16px 0" }}>
                <p className="headline" style={{ marginBottom: 8 }}>🏆 Personal records</p>
                {model.prs.slice(0, 3).map(([name, b], i) => (
                  <p key={i} className="footnote" style={{ margin: "6px 0" }}>
                    <strong>{name}</strong> · {b.weight} lb
                  </p>
                ))}
              </div>
            )}

            {/* Recent workouts feed */}
            <h2 className="section-title" style={{ margin: "20px 16px 0" }}>Recent</h2>
            {model.inRange.slice(0, 4).map((w) => {
              const wvol = (w.sets ?? []).reduce((s, x) => s + (x.reps ?? 0) * Number(x.weight ?? 0), 0);
              return (
                <div key={w.id} className="card" style={{ margin: "12px 16px 0" }}>
                  <p className="footnote">{new Date(w.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                  <p className="headline" style={{ margin: "4px 0" }}>{w.notes?.replace("Imported from SebasFit: ", "") || "Workout"}</p>
                  <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
                    <div><p className="stat-value" style={{ fontSize: 17 }}>{wvol >= 1000 ? `${(wvol/1000).toFixed(1)}k` : Math.round(wvol)}</p><p className="stat-label">Volume</p></div>
                    <div><p className="stat-value" style={{ fontSize: 17 }}>{(w.sets ?? []).length}</p><p className="stat-label">Sets</p></div>
                  </div>
                </div>
              );
            })}

            <div style={{ height: 24 }} />
          </>
        )}
      </div>

      {/* Log / edit body weight - kept from original */}
      {bwSheet && (
        <div className="sheet-backdrop" onClick={() => setBwSheet(null)}>
          <div className="sheet-light" role="dialog" aria-modal="true" aria-label="Log body weight" onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <div className="sheet-head">
              <p className="title-2">{bwSheet.id ? "Edit weight" : "Log body weight"}</p>
              <button className="btn btn-plain" onClick={() => setBwSheet(null)}>Cancel</button>
            </div>
            <p className="footnote">Logged in lb only — never invented.</p>
            <div className="spacer-12" />
            <input className="num-input" type="number" inputMode="decimal" min="1" step="0.1" placeholder="180"
              value={bwSheet.value} autoFocus onChange={(e) => setBwSheet((p) => ({ ...p, value: e.target.value }))} />
            <div className="spacer-16" />
            <button className="btn btn-filled" style={{ width: "100%" }} disabled={bwSaving} onClick={saveWeight}>
              {bwSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Delete progress photo - kept from original */}
      {confirmPhotoDel && (
        <div className="sheet-backdrop" onClick={() => setConfirmPhotoDel(null)}>
          <div className="sheet-light" role="dialog" aria-modal="true" aria-label="Delete photo" onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <p className="title-2">Delete photo?</p>
            <div className="spacer-8" />
            <p className="footnote">This photo will be removed from this device.</p>
            <div className="spacer-16" />
            <button className="btn btn-danger" style={{ width: "100%" }}
              onClick={async () => { await deletePhoto(confirmPhotoDel); setConfirmPhotoDel(null); setPhotos(await listPhotos()); }}>
              Delete
            </button>
            <div className="spacer-8" />
            <button className="btn btn-gray" style={{ width: "100%" }} onClick={() => setConfirmPhotoDel(null)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Volume">
      <path d={area} fill="rgba(240,55,45,0.12)" />
      <path d={d} fill="none" stroke="#F0372D" strokeWidth="3" strokeLinejoin="round" />
      {series.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.v)} r="3.5" fill="#0A0A0A" stroke="#F0372D" strokeWidth="2" />
      ))}
      {series.map((p, i) => (i % step === 0 ? (
        <text key={`l${i}`} x={x(i)} y={h - 6} textAnchor="middle" fill="#9A9A9A" fontSize="12">{p.label}</text>
      ) : null))}
    </svg>
  );
}
