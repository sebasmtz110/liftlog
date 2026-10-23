"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import { listPhotos, addPhoto, deletePhoto, shrinkPhoto } from "../../lib/photos";
import ConfigBanner from "../components/ConfigBanner";
import { volumeOf } from "../../lib/volume";

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

/** Monday 00:00, same week window as Today. */
function mondayOf(d) {
  const x = startOf(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

function rangeStart(range, now) {
  if (range === "week") return mondayOf(now);
  const cutoff = startOf(now);
  const days = RANGES.find((x) => x.id === range)?.days ?? 7;
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export default function Stats() {
  const { user } = useAuth();
  const [range, setRange] = useState("week");
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
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
    const supabase = await getSupabase();
    if (!supabase) return;
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
      const supabase = await getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("workouts")
        .select("id, started_at, sets(id, reps, weight, exercises(name, muscle_group))")
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(200);
      if (error) setActionError("Couldn't load your sessions. Try again.");
      else {
        setActionError("");
        setWorkouts(data ?? []);
      }
      setLoading(false);
    })();
  }, []);

  async function saveWeight() {
    const v = Number(bwSheet?.value);
    if (!(v > 0) || !user || !isConfigured) return;
    setBwSaving(true);
    setActionError("");
    const supabase = await getSupabase();
    const result = !supabase
      ? { error: new Error("no-client") }
      : bwSheet.id
        ? await supabase.from("body_weights").update({ weight_lb: v }).eq("id", bwSheet.id)
        : await supabase.from("body_weights").insert({ user_id: user.id, weight_lb: v });
    setBwSaving(false);
    if (result.error) {
      setActionError("That didn't save. Try again.");
      return;
    }
    setBwSheet(null);
    refreshBody();
  }

  async function deleteWeight(id) {
    if (!confirm("Delete this weight entry?")) return;
    setActionError("");
    const supabase = await getSupabase();
    if (!supabase) {
      setActionError("That didn't save. Try again.");
      return;
    }
    const { error } = await supabase.from("body_weights").delete().eq("id", id);
    if (error) {
      setActionError("That didn't save. Try again.");
      return;
    }
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
    const cutoff = rangeStart(range, now);
    const inRange = workouts.filter((w) => new Date(w.started_at) >= cutoff);
    const sets = inRange.flatMap((w) =>
      (w.sets ?? []).map((s) => ({ ...s, date: w.started_at }))
    );
    const volume = volumeOf(sets);

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
    const days = range === "month" ? 31 : range === "year" ? 12 : 7;
    const weekStart = range === "week" ? mondayOf(now) : null;
    return Array.from({ length: days }, (_, i) => {
      const start = weekStart ? new Date(weekStart) : new Date(now);
      if (range === "year") start.setMonth(start.getMonth() - (days - 1 - i), 1);
      else if (weekStart) start.setDate(weekStart.getDate() + i);
      else start.setDate(start.getDate() - (days - 1 - i));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      if (range === "year") end.setMonth(end.getMonth() + 1);
      else end.setDate(end.getDate() + 1);
      const vol = volumeOf(
        workouts
          .filter((w) => {
            const t = new Date(w.started_at);
            return t >= start && t < end;
          })
          .flatMap((w) => w.sets ?? [])
      );
      const label = range === "year"
        ? start.toLocaleDateString(undefined, { month: "narrow" })
        : range === "week"
          ? start.toLocaleDateString(undefined, { weekday: "narrow" })
          : String(start.getDate());
      return { label, v: Math.round(vol) };
    });
  }, [workouts, range, now]);


  const rangeName = RANGES.find((r) => r.id === range).label.toLowerCase();
  const monthLabel = now ? now.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase() : "";

  return (
    <section className="page">
      <ConfigBanner />
      <div className="stats-hero">
        <img src="/photos/progress-pullup.jpg" alt="" />
        <div className="stats-shade" />
        <div className="stats-copy">
          <div className="stats-month">{monthLabel}</div>
          <h1>Progress</h1>
        </div>
      </div>

      <div className="seg" role="group" aria-label="Range">
        {RANGES.map((r) => (
          <button key={r.id} type="button" className={range === r.id ? "is-on" : ""} onClick={() => setRange(r.id)}>{r.label}</button>
        ))}
      </div>
      {actionError ? <p className="err" role="alert">{actionError}</p> : null}

      {loading || !model ? <p className="loading">Loading…</p> : actionError ? null : (
        <div className="stack" style={{ marginTop: "var(--gap)" }}>
          <section className="panel">
            <div className="stat-tiles">
              <div className="stat-tile is-vol">
                <div className="k">VOLUME</div>
                <div className="v num">{model.volume >= 1000 ? `${(model.volume / 1000).toFixed(1).replace(/\.0$/, "")}k` : Math.round(model.volume)}</div>
                <div className="s">lb lifted</div>
              </div>
              <div className="stat-tile">
                <div className="k">WORKOUTS</div>
                <div className="v num">{model.inRange.length}</div>
                <div className="s">this {rangeName}</div>
              </div>
              <div className="stat-tile is-pr">
                <div className="k">NEW PRs</div>
                <div className="v num">{model.prs.length}</div>
                <div className="s">this {rangeName}</div>
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Volume · this {rangeName}</h2>
              <span className="note">lb</span>
            </div>
            <VolumeChart series={volumeSeries} />
          </section>
          {model.topEx && model.trendSets.length >= 2 ? (
            <section className="panel">
              <div className="panel-head">
                <h2>{model.topEx} · top set</h2>
                <span className="note">lb</span>
              </div>
              {model.trendSets.map((s, i) => (
                <p key={i} className="note" style={{ margin: "6px 0" }}>
                  {new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} — {s.weight} lb × {s.reps}
                </p>
              ))}
            </section>
          ) : null}
          {model.prs.length > 0 ? (
            <section className="panel">
              <div className="panel-head"><h2>🏆 Personal records</h2></div>
              {model.prs.slice(0, 5).map(([name, b]) => (
                <div key={name} className="lift is-plain">
                  <span className="lift-copy"><strong>{name}</strong></span>
                  <span className="scheme num">{b.weight} lb</span>
                </div>
              ))}
            </section>
          ) : null}
            <section className="panel">
              <div className="panel-head">
                <h2>Body weight</h2>
                <button className="text-btn" type="button" onClick={() => setBwSheet({ value: "" })}>Log</button>
              </div>
              <p className="note">
                {bwLatest ? `${bwLatest.weight_lb} lb latest` : "Nothing logged yet."}
                {bwDelta != null ? ` · ${bwDelta > 0 ? "+" : ""}${bwDelta.toFixed(1)} lb across this week's entries` : ""}
                {bwAvg != null ? ` · ${bwAvg.toFixed(1)} lb average this week` : ""}
              </p>
              {weights.slice(0, 5).map((w) => (
                <div key={w.id} className="lift is-plain">
                  <span className="lift-copy">
                    <strong className="num">{Number(w.weight_lb).toFixed(1)} lb</strong>
                    <small>{new Date(w.logged_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small>
                  </span>
                  <button className="text-btn" type="button" onClick={() => setBwSheet({ id: w.id, value: String(w.weight_lb) })}>Edit</button>
                  <button className="btn btn-bad" type="button" onClick={() => deleteWeight(w.id)}>Delete</button>
                </div>
              ))}
            </section>
            <section className="panel">
              <div className="panel-head">
                <h2>Photos</h2>
                <button className="text-btn" type="button" onClick={() => fileRef.current?.click()}>Add</button>
              </div>
              <p className="note">Stored in this browser. They are not uploaded.</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhotoFile} />
              {photos.length === 0 ? <p className="empty">No photos yet.</p> : (
                <div className="bays" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                  {photos.slice(0, 4).map((ph) => (
                    <button key={ph.id} className="bay" type="button" onClick={() => { if (confirmPhotoDel === ph.id) deletePhoto(ph.id).then(listPhotos).then(setPhotos); else setConfirmPhotoDel(ph.id); }}>
                      <img src={ph.url} alt="Progress" style={{ width: "100%", height: 88, objectFit: "cover" }} />
                      <small>{confirmPhotoDel === ph.id ? "Tap to delete" : ""}</small>
                    </button>
                  ))}
                </div>
              )}
            </section>
            <section className="panel">
              <div className="panel-head"><h2>History</h2></div>
              <SessionMonths workouts={workouts} />
            </section>
        </div>
      )}

      {bwSheet && (
        <div className="sheet">
          <button className="sheet-scrim" type="button" aria-label="Close" onClick={() => setBwSheet(null)} />
          <div className="sheet-card" role="dialog" aria-modal="true" aria-label="Log body weight">
            <header>
              <h2>{bwSheet.id ? "Edit body weight" : "Log body weight"}</h2>
              <button className="text-btn" type="button" onClick={() => setBwSheet(null)}>Cancel</button>
            </header>
            <label className="field">
              <span>Pounds</span>
              <input className="input" type="number" inputMode="decimal" min="1" step="0.1" value={bwSheet.value} onChange={(e) => setBwSheet((prev) => ({ ...prev, value: e.target.value }))} />
            </label>
            {actionError ? <p className="err" role="alert">{actionError}</p> : null}
            <button className="btn btn-primary" type="button" disabled={bwSaving} onClick={saveWeight}>{bwSaving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}
    </section>
  );
}

function SessionMonths({ workouts }) {
  let month = "";
  return (
    <div>
      {workouts.length === 0 ? <p className="empty">No finished sessions yet.</p> : workouts.map((w, i) => {
        const when = new Date(w.started_at);
        const label = when.toLocaleDateString(undefined, { month: "long", year: "numeric" });
        const show = label !== month;
        month = label;
        const names = [];
        for (const s of w.sets ?? []) {
          const n = s.exercises?.name;
          if (n && !names.includes(n)) names.push(n);
        }
        const vol = volumeOf(w.sets);
        const setCount = (w.sets ?? []).length;
        return (
          <div key={w.id}>
            {show ? <h2 className="work-month">{label}</h2> : null}
            <Link className="log" href={`/history?id=${w.id}`} data-latest={i === 0 ? "true" : "false"}>
              <span className="log-name">{names[0] || "Session"}{names.length > 1 ? ` +${names.length - 1}` : ""}</span>
              <span className="log-vol num">{Math.round(vol).toLocaleString()} lb</span>
              <span className="log-meta">{when.toLocaleDateString(undefined, { weekday: "long", day: "numeric" })} · {setCount} {setCount === 1 ? "set" : "sets"}</span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function VolumeChart({ series }) {
  if (!series.length) return null;
  const w = 640, h = 220, l = 36, r = 8, t = 16, b = 28;
  const max = Math.max(...series.map((p) => p.v), 1);
  const x = (i) => l + (i * (w - l - r)) / Math.max(1, series.length - 1);
  const y = (v) => t + (1 - v / max) * (h - t - b);
  const d = series.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const base = (h - b).toFixed(1);
  const area = `${d} L${x(series.length - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;
  const step = Math.max(1, Math.floor(series.length / 6));
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Volume">
      <path d={area} fill="rgba(141,59,46,0.12)" />
      <path d={d} fill="none" stroke="#8d3b2e" strokeWidth="3" strokeLinejoin="round" />
      {series.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.v)} r="3.5" fill="#141414" stroke="#8d3b2e" strokeWidth="2" />
      ))}
      {series.map((p, i) => (i % step === 0 ? (
        <text key={`l${i}`} x={x(i)} y={h - 6} textAnchor="middle" fill="#8a8783" fontSize="12">{p.label}</text>
      ) : null))}
    </svg>
  );
}
