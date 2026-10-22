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
  const [board, setBoard] = useState("history");
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
    const supabase = await getSupabase();
    if (supabase) {
      if (bwSheet.id) {
        await supabase.from("body_weights").update({ weight_lb: v }).eq("id", bwSheet.id);
      } else {
        await supabase.from("body_weights").insert({ user_id: user.id, weight_lb: v });
      }
    }
    setBwSaving(false);
    setBwSheet(null);
    refreshBody();
  }

  async function deleteWeight(id) {
    if (!confirm("Delete this weight entry?")) return;
    const supabase = await getSupabase();
    if (supabase) await supabase.from("body_weights").delete().eq("id", id);
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
  const finding = !model ? "Loading the log."
    : model.prs.length
      ? `${model.prs.length} lift${model.prs.length === 1 ? "" : "s"} set a heavier top weight this ${rangeName}.`
      : model.inRange.length
        ? `${model.inRange.length} session${model.inRange.length === 1 ? "" : "s"} this ${rangeName}, none with a heavier top weight.`
        : `No finished sessions this ${rangeName}.`;

  return (
    <section className="page">
      <ConfigBanner />
      <div className="title-row">
        <div>
          <h1>Progress</h1>
          <p className="lede">{finding}</p>
        </div>
        <div className="seg" role="group" aria-label="Range">
          {RANGES.map((r) => (
            <button key={r.id} type="button" className={range === r.id ? "is-on" : ""} onClick={() => setRange(r.id)}>{r.label}</button>
          ))}
        </div>
      </div>

      <div className="seg" role="tablist" aria-label="Progress">
        <button type="button" role="tab" aria-selected={board === "history"} onClick={() => setBoard("history")}>History</button>
        <button type="button" role="tab" aria-selected={board === "strength"} onClick={() => setBoard("strength")}>Strength</button>
      </div>

      {board === "history" ? (
        loading ? <p className="loading">Loading…</p> : <SessionMonths workouts={workouts} />
      ) : loading || !model ? <p className="loading">Loading…</p> : (
        <div className="columns">
          <section className="panel">
            <div className="panel-head">
              <h2>Volume</h2>
              <span className="note num">{Math.round(model.volume).toLocaleString()} lb</span>
            </div>
            <VolumeChart series={volumeSeries} />
          </section>
          <div className="stack">
            <section className="panel">
              <div className="panel-head"><h2>Heavier this {rangeName}</h2></div>
              {model.prs.length === 0 ? <p className="empty">No heavier top set in this range.</p> : model.prs.slice(0, 6).map(([name, b]) => (
                <div key={name} className="lift is-plain">
                  <span className="lift-copy"><strong>{name}</strong></span>
                  <span className="scheme num">{b.weight} lb</span>
                </div>
              ))}
            </section>
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
          </div>
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
  const w = 640, h = 200, l = 36, r = 8, t = 12, b = 24;
  const max = Math.max(...series.map((p) => p.v), 1);
  const top = Math.ceil(max / 1000) * 1000 || 1000;
  const slot = (w - l - r) / series.length;
  const y = (v) => t + (1 - v / top) * (h - t - b);
  const ticks = [0, top / 2, top];
  let hot = series.length - 1;
  for (let i = series.length - 1; i >= 0; i -= 1) if (series[i].v > 0) { hot = i; break; }
  const tickLabel = (tick) => {
    if (tick === 0) return "0";
    if (top >= 10000) return `${Math.round(tick / 1000)}k`;
    return String(Math.round(tick));
  };
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Volume in pounds">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={l} x2={w - r} y1={y(tick)} y2={y(tick)} stroke="#eceae6" />
          <text x={0} y={y(tick) + 4}>{tickLabel(tick)}</text>
        </g>
      ))}
      {series.map((p, i) => {
        const bh = Math.max(0, y(0) - y(p.v));
        const x = l + i * slot + 4;
        return <rect key={i} x={x} y={y(p.v)} width={Math.max(2, slot - 8)} height={bh} rx="3" fill={i === hot ? "#8d3b2e" : "#141414"} />;
      })}
      {series.map((p, i) => (series.length <= 12 || i % Math.ceil(series.length / 6) === 0 ? (
        <text key={`l${i}`} x={l + i * slot + slot / 2} y={h - 6} textAnchor="middle">{p.label}</text>
      ) : null))}
    </svg>
  );
}
