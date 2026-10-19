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

  const monthLabel = now ? now.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase() : "";

  return (
    <section className="screen" data-screen="progress" style={{ background: "#F4F5F2", minHeight: "100dvh" }}>
      <ConfigBanner />
      {/* Small hero */}
      <div style={{ position: "relative", height: 150, overflow: "hidden" }}>
        <img src="/assets/gym-dark.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,25,22,.7), transparent 55%)" }} />
        <div style={{ position: "absolute", left: 20, bottom: 12, color: "#fff" }}>
          <div style={{ fontSize: 11, letterSpacing: ".12em", color: "rgba(255,255,255,.75)", fontWeight: 600 }}>{monthLabel}</div>
          <h1 style={{ margin: "2px 0 0", fontSize: 30, fontWeight: 800, letterSpacing: "-.02em" }}>Progress</h1>
        </div>
      </div>

      <div style={{ padding: "0 0 24px" }}>
        {loading || !model ? (
          <p className="loading" style={{ padding: 20 }}>Loading…</p>
        ) : (
          <>
            {/* Week / Month / Year */}
            <div style={{ display: "flex", background: "#E8ECE8", borderRadius: 12, margin: "14px 16px 0", padding: 3 }}>
              {RANGES.filter((r) => r.id !== "year").map((r) => (
                <button key={r.id} type="button" onClick={() => setRange(r.id)}
                  style={{ flex: 1, border: 0, background: range === r.id ? "#fff" : "transparent",
                    color: range === r.id ? "#101916" : "#69746F", fontSize: 14, fontWeight: 600,
                    padding: 8, borderRadius: 9, cursor: "pointer",
                    boxShadow: range === r.id ? "0 1px 3px rgba(0,0,0,.1)" : "none" }}>
                  {r.label}
                </button>
              ))}
            </div>

            {/* Stat tiles */}
            <div style={{ background: "#fff", border: "1px solid #DFE4DF", borderRadius: 16, margin: "12px 16px 0", padding: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: "linear-gradient(135deg,#0F706E,#0E6A52)", borderRadius: 12, padding: 12, color: "#fff" }}>
                  <div style={{ fontSize: 10, letterSpacing: ".08em", opacity: .8, fontWeight: 700 }}>VOLUME</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                    {model.volume >= 1000 ? `${(model.volume / 1000).toFixed(1).replace(/\.0$/, "")}k` : Math.round(model.volume)}
                  </div>
                  <div style={{ fontSize: 11, opacity: .85, marginTop: 2 }}>lb lifted</div>
                </div>
                <div style={{ flex: 1, background: "linear-gradient(135deg,#1a1a1a,#2d2d2d)", borderRadius: 12, padding: 12, color: "#fff" }}>
                  <div style={{ fontSize: 10, letterSpacing: ".08em", opacity: .8, fontWeight: 700 }}>WORKOUTS</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{model.inRange.length}</div>
                  <div style={{ fontSize: 11, opacity: .85, marginTop: 2 }}>this {range}</div>
                </div>
                <div style={{ flex: 1, background: "linear-gradient(135deg,#F0372D,#C92A20)", borderRadius: 12, padding: 12, color: "#fff" }}>
                  <div style={{ fontSize: 10, letterSpacing: ".08em", opacity: .8, fontWeight: 700 }}>NEW PRs</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{model.prs.length}</div>
                  <div style={{ fontSize: 11, opacity: .85, marginTop: 2 }}>this {range}</div>
                </div>
              </div>
            </div>

            {/* Volume chart */}
            <div style={{ background: "#fff", border: "1px solid #DFE4DF", borderRadius: 16, margin: "12px 16px 0", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Volume · this {range}</h2>
                <span style={{ fontSize: 12, color: "#69746F" }}>lb</span>
              </div>
              <VolumeChart series={volumeSeries} />
            </div>

            {/* Top set trend */}
            {model.topEx && model.trendSets.length >= 2 && (
              <div style={{ background: "#fff", border: "1px solid #DFE4DF", borderRadius: 16, margin: "12px 16px 0", padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{model.topEx} · top set</h2>
                  <span style={{ fontSize: 12, color: "#69746F" }}>lb</span>
                </div>
                {model.trendSets.map((s, i) => (
                  <p key={i} className="footnote" style={{ margin: "6px 0", color: "#69746F", fontSize: 13 }}>
                    {new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    {" — "}{s.weight} lb × {s.reps}
                  </p>
                ))}
              </div>
            )}

            {/* PRs */}
            {model.prs.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #DFE4DF", borderRadius: 16, margin: "12px 16px 0", padding: 16 }}>
                <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>🏆 Personal records</h2>
                {model.prs.slice(0, 5).map(([name, b], i) => (
                  <p key={i} style={{ margin: "6px 0", fontSize: 14 }}>
                    <strong>{name}</strong> <span style={{ color: "#69746F" }}>· {b.weight} lb</span>
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Body weight sheet - kept */}
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
    </section>
  );
}
function VolumeChart({ series }) {
  if (!series.length) return null;
  const w = 640;
  const h = 220;
  const l = 36;
  const r = 8;
  const t = 16;
  const b = 28;
  const max = Math.max(...series.map((p) => p.v), 1);
  const x = (i) => l + (i * (w - l - r)) / Math.max(1, series.length - 1);
  const y = (v) => t + (1 - v / max) * (h - t - b);
  const d = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const base = (h - b).toFixed(1);
  const area = `${d} L${x(series.length - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;
  const step = Math.max(1, Math.floor(series.length / 6));
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
