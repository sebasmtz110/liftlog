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

            {/* Body — weight log + progress photos, like SebasFit */}
            <div className="spacer-16" />
            <h2 className="section-title">Body</h2>
            <div className="card bw-card">
              <div className="bw-row">
                <div>
                  <p className="kicker">BODY WEIGHT · LB</p>
                  <div className="spacer-8" />
                  {bwLatest ? (
                    <>
                      <p className="bw-latest">
                        {bwLatest.weight_lb}
                        <small> lb</small>
                      </p>
                      <p className="footnote">
                        Latest ·{" "}
                        {new Date(bwLatest.logged_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                        {bwAvg !== null && (
                          <>
                            {" "}· 7-day avg <strong>{bwAvg.toFixed(1)}</strong>
                            {bwDelta !== null && bwDelta !== 0 && (
                              <span style={{ color: bwDelta > 0 ? "var(--pink)" : "var(--green)" }}>
                                {" "}
                                {bwDelta > 0 ? "↑" : "↓"} {Math.abs(bwDelta).toFixed(1)}
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="headline">No weights yet</p>
                      <p className="footnote">Nothing logged yet — never invented.</p>
                    </>
                  )}
                </div>
                <button className="btn btn-filled" onClick={() => setBwSheet({ id: null, value: "" })}>
                  Log
                </button>
              </div>
            </div>

            {weights.length > 0 && (
              <div className="card" style={{ marginTop: 12 }}>
                <div className="quiz-head-row">
                  <p className="headline">History</p>
                  <p className="footnote">
                    {weights.length} {weights.length === 1 ? "entry" : "entries"}
                  </p>
                </div>
                {weights.slice(0, 20).map((w) => (
                  <div key={w.id} className="bw-hist-row">
                    <div>
                      <p className="headline">{w.weight_lb} lb</p>
                      <p className="footnote">
                        {new Date(w.logged_at).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-gray"
                        style={{ padding: "8px 12px", fontSize: 13 }}
                        onClick={() => setBwSheet({ id: w.id, value: String(w.weight_lb) })}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-gray"
                        style={{ padding: "8px 12px", fontSize: 13, color: "var(--danger)" }}
                        onClick={() => deleteWeight(w.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="spacer-16" />
            <h2 className="section-title">Progress photos</h2>
            <div className="card">
              <p className="footnote">Private on this device only — never uploaded.</p>
              <div className="spacer-12" />
              <button className="btn btn-filled" onClick={() => fileRef.current?.click()}>
                Add photo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onPhotoFile}
              />
              {photos.length > 0 && (
                <div className="photo-grid">
                  {photos.map((p) => (
                    <div key={p.id}>
                      <div className="photo-item">
                        <img src={p.url} alt="Progress" />
                        <button
                          className="photo-del"
                          aria-label="Delete photo"
                          onClick={() => setConfirmPhotoDel(p.id)}
                        >
                          ×
                        </button>
                      </div>
                      <p className="photo-date">
                        {new Date(p.t).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Log / edit body weight */}
      {bwSheet && (
        <div className="sheet-backdrop" onClick={() => setBwSheet(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Log body weight" onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <div className="sheet-head">
              <p className="title-2">{bwSheet.id ? "Edit weight" : "Log body weight"}</p>
              <button className="btn btn-plain" onClick={() => setBwSheet(null)}>
                Cancel
              </button>
            </div>
            <p className="footnote">Logged in lb only — never invented.</p>
            <div className="spacer-12" />
            <input
              className="num-input"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.1"
              placeholder="180"
              value={bwSheet.value}
              autoFocus
              onChange={(e) => setBwSheet((p) => ({ ...p, value: e.target.value }))}
            />
            <div className="spacer-16" />
            <button className="btn btn-filled" style={{ width: "100%" }} disabled={bwSaving} onClick={saveWeight}>
              {bwSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Delete progress photo */}
      {confirmPhotoDel && (
        <div className="sheet-backdrop" onClick={() => setConfirmPhotoDel(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Delete photo" onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <p className="title-2">Delete photo?</p>
            <div className="spacer-8" />
            <p className="footnote">This photo will be removed from this device.</p>
            <div className="spacer-16" />
            <button
              className="btn btn-danger"
              style={{ width: "100%" }}
              onClick={async () => {
                await deletePhoto(confirmPhotoDel);
                setConfirmPhotoDel(null);
                setPhotos(await listPhotos());
              }}
            >
              Delete
            </button>
            <div className="spacer-8" />
            <button className="btn btn-gray" style={{ width: "100%" }} onClick={() => setConfirmPhotoDel(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
