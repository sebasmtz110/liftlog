"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, ACTIVE_WORKOUT_KEY, TEMPLATE_EXERCISES_KEY } from "../../lib/supabase";
import ConfigBanner from "../components/ConfigBanner";
import { DemoThumb, ExerciseVisual } from "../components/ExerciseDemo";
import { visualForExercise } from "../../lib/exerciseVisuals";

const REST_DEFAULT = 90; // seconds

function fmtVol(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(v)}`;
}

function fmtElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Active workout — concept-board dark focused flow:
 * one exercise at a time, big visual, steppers, Log Set, rest timer ring.
 */
export default function Workout() {
  const router = useRouter();
  const [workoutId, setWorkoutId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [sets, setSets] = useState([]);
  const [addedExerciseIds, setAddedExerciseIds] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState({}); // exerciseId -> { reps, weight }
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [focusId, setFocusId] = useState(null);
  // Rest timer
  const [restLeft, setRestLeft] = useState(null);
  const [restOn, setRestOn] = useState(false);
  const [restDur, setRestDur] = useState(REST_DEFAULT);
  const [showRest, setShowRest] = useState(false);
  const timerRef = useRef(null);
  // Log Set sheet (board-exact) + numpad target
  const [logSheet, setLogSheet] = useState(false);
  const [padTarget, setPadTarget] = useState("reps");

  useEffect(() => {
    const id = localStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (!id) {
      setLoading(false);
      return;
    }
    setWorkoutId(id);
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: workout }, { data: exercises }] = await Promise.all([
        supabase.from("workouts").select("id, started_at, ended_at").eq("id", id).single(),
        supabase.from("exercises").select("id, name, muscle_group").order("name"),
      ]);
      if (!workout || workout.ended_at) {
        localStorage.removeItem(ACTIVE_WORKOUT_KEY);
        setWorkoutId(null);
        setLoading(false);
        return;
      }
      setStartedAt(workout.started_at);
      if (exercises) setCatalog(exercises);
      try {
        const seeded = localStorage.getItem(TEMPLATE_EXERCISES_KEY);
        if (seeded) {
          const ids = JSON.parse(seeded);
          if (Array.isArray(ids) && ids.length) {
            setAddedExerciseIds(ids);
            if (!focusId) setFocusId(ids[0]);
            ids.forEach((exId) =>
              setDrafts((d) => ({ ...d, [exId]: d[exId] ?? { reps: "", weight: "" } }))
            );
          }
          localStorage.removeItem(TEMPLATE_EXERCISES_KEY);
        }
      } catch {}
      await refreshSets(id);
      setLoading(false);
    })();
  }, []);

  // Rest timer countdown
  useEffect(() => {
    if (!restOn || restLeft === null || restLeft <= 0) {
      if (restLeft === 0) {
        setRestOn(false);
        setShowRest(false); // Rest done — back to workout
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setRestLeft((s) => Math.max(0, (s ?? 1) - 1));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [restOn, restLeft === null, restLeft <= 0]);

  function skipRest() {
    setRestOn(false);
    setRestLeft(null);
    setShowRest(false);
  }

  async function refreshSets(id) {
    const { data } = await supabase
      .from("sets")
      .select("id, set_number, reps, weight, exercise_id, exercises(name, muscle_group)")
      .eq("workout_id", id)
      .order("created_at", { ascending: true });
    if (data) {
      setSets(data);
      setAddedExerciseIds((prev) => {
        const fromSets = [...new Set(data.map((s) => s.exercise_id))];
        const next = [...new Set([...prev, ...fromSets])];
        if (!focusId && next.length) setFocusId(next[0]);
        return next;
      });
    }
  }

  const grouped = useMemo(() => {
    const map = new Map();
    for (const exId of addedExerciseIds) {
      const ex = catalog.find((e) => e.id === exId);
      if (ex) map.set(exId, { exercise: ex, sets: [] });
    }
    for (const s of sets) {
      if (!map.has(s.exercise_id)) {
        map.set(s.exercise_id, {
          exercise: { id: s.exercise_id, name: s.exercises?.name ?? "Exercise", muscle_group: s.exercises?.muscle_group ?? "" },
          sets: [],
        });
      }
      map.get(s.exercise_id).sets.push(s);
    }
    return [...map.values()];
  }, [addedExerciseIds, catalog, sets]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter(
      (e) =>
        !addedExerciseIds.includes(e.id) &&
        (!q || e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q))
    );
  }, [catalog, addedExerciseIds, query]);

  function addExercise(id) {
    setAddedExerciseIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setDrafts((d) => ({ ...d, [id]: d[id] ?? { reps: "", weight: "" } }));
    setFocusId(id);
    setPickerOpen(false);
    setQuery("");
  }

  function bump(exId, field, delta) {
    setDrafts((d) => {
      const cur = d[exId] ?? { reps: "", weight: "" };
      const n = (parseFloat(cur[field]) || 0) + delta;
      return { ...d, [exId]: { ...cur, [field]: String(Math.max(0, n)) } };
    });
  }

  async function logSet(exerciseId) {
    const draft = drafts[exerciseId] ?? {};
    const reps = parseInt(draft.reps, 10);
    const weight = parseFloat(draft.weight);
    if (!reps || reps <= 0) return;
    const existing = sets.filter((s) => s.exercise_id === exerciseId).length;
    const { error } = await supabase.from("sets").insert({
      workout_id: workoutId,
      exercise_id: exerciseId,
      set_number: existing + 1,
      reps,
      weight: Number.isFinite(weight) ? weight : 0,
    });
    if (!error) {
      // Carry weight forward, clear reps — the fast path for the next set.
      setDrafts((d) => ({ ...d, [exerciseId]: { reps: "", weight: draft.weight || "" } }));
      await refreshSets(workoutId);
      setRestLeft(restDur);
      setRestOn(true);
      setLogSheet(false);
      setShowRest(true); // Prototype: dedicated rest screen
    }
  }

  function padInput(digit) {
    const f = grouped.find((g) => g.exercise.id === focusId) ?? grouped[0];
    if (!f) return;
    const id = f.exercise.id;
    setDrafts((d) => {
      const cur = d[id] ?? { reps: "", weight: "" };
      let val = (cur[padTarget] || "") + digit;
      if (val.length > 5) val = val.slice(0, 5);
      if (/^0\d/.test(val)) val = val.slice(1);
      return { ...d, [id]: { ...cur, [padTarget]: val } };
    });
  }

  function padBack() {
    const f = grouped.find((g) => g.exercise.id === focusId) ?? grouped[0];
    if (!f) return;
    const id = f.exercise.id;
    setDrafts((d) => {
      const cur = d[id] ?? { reps: "", weight: "" };
      return { ...d, [id]: { ...cur, [padTarget]: (cur[padTarget] || "").slice(0, -1) } };
    });
  }

  function adjustRest(delta) {
    setRestDur((v) => Math.min(600, Math.max(15, v + delta)));
  }

  async function deleteSet(setId, exerciseId) {
    const { error } = await supabase.from("sets").delete().eq("id", setId);
    if (error) return;
    const remaining = sets
      .filter((s) => s.exercise_id === exerciseId && s.id !== setId)
      .sort((a, b) => a.set_number - b.set_number);
    await Promise.all(
      remaining.map((s, i) =>
        supabase.from("sets").update({ set_number: i + 1 }).eq("id", s.id)
      )
    );
    await refreshSets(workoutId);
  }

  async function finishWorkout() {
    if (!workoutId) return;
    setFinishing(true);
    const { error } = await supabase
      .from("workouts")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", workoutId);
    setFinishing(false);
    if (!error) {
      localStorage.removeItem(ACTIVE_WORKOUT_KEY);
      router.push(`/complete?id=${workoutId}`);
    }
  }

  function discardWorkout() {
    if (!workoutId) return;
    if (!window.confirm("Discard this workout and all its sets?")) return;
    (async () => {
      await supabase.from("sets").delete().eq("workout_id", workoutId);
      await supabase.from("workouts").delete().eq("id", workoutId);
      localStorage.removeItem(ACTIVE_WORKOUT_KEY);
      router.push("/");
    })();
  }

  if (loading) {
    return (
      <div className="dark-screen">
        <p className="loading" style={{ color: "var(--dark-mu)" }}>Loading…</p>
      </div>
    );
  }

  if (!workoutId) {
    return (
      <div className="dark-screen">
        <ConfigBanner />
        <header className="screen-head">
          <h1 className="large-title" style={{ color: "#fff" }}>Workout</h1>
        </header>
        <div className="screen-body">
          <div className="empty">
            <p className="headline" style={{ color: "#fff" }}>No active workout</p>
            <div className="spacer-8" />
            <p className="footnote" style={{ color: "var(--dark-mu)" }}>Start one from the Home or Workout tab to begin logging sets.</p>
          </div>
        </div>
      </div>
    );
  }

  const focus = grouped.find((g) => g.exercise.id === focusId) ?? grouped[0];
  const exSets = focus?.sets ?? [];
  const draft = (focus && drafts[focus.exercise.id]) ?? { reps: "", weight: "" };
  const setNum = exSets.length + 1;
  const totalSets = Math.max(exSets.length + 1, 4);

  const R = 84;
  const CIRC = 2 * Math.PI * R;
  const ringVal = restLeft ?? restDur;
  const ringFrac = ringVal / restDur;

  return (
    <div className="dark-screen" style={{ position: "relative", overflow: "hidden" }}>
      <ConfigBanner />
      {/* Full-bleed exercise photo — exact from Sebas-Training.html */}
      {(() => {
        const photo = focus ? visualForExercise(focus.exercise.name) : null;
        return photo ? (
          <>
            <img className="workout-bg" src={photo} alt="" aria-hidden="true" />
            <div className="workout-fade" aria-hidden="true" />
          </>
        ) : null;
      })()}
      {/* Top bar — board: X | title | Finish */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 20px 0" }}>
        <button className="icon-btn" style={{ color: "#fff" }} aria-label="Discard workout" onClick={discardWorkout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <p style={{ flex: 1, textAlign: "center", color: "#fff", fontSize: 16, lineHeight: "24px", fontWeight: 600 }}>
          {focus ? focus.exercise.name : "Workout"}
        </p>
        <button className="btn btn-plain btn-sm" style={{ color: "#fff" }} onClick={finishWorkout} disabled={finishing}>
          {finishing ? "…" : "Finish"}
        </button>
      </div>

      <div className="screen-body" style={{ paddingTop: 8, paddingBottom: 40 }}>
        {grouped.length === 0 || !focus ? (
          <div className="empty">
            <p className="headline" style={{ color: "#fff" }}>Add your first exercise</p>
            <div className="spacer-12" />
            <button className="btn btn-white btn-block" onClick={() => setPickerOpen(true)}>
              + Add exercise
            </button>
          </div>
        ) : (
          <>
            {/* Muscle + set position, thin progress */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <p style={{ fontSize: 12, lineHeight: "16px", color: "var(--dark-mu)" }}>
                {focus.exercise.muscle_group || "Exercise"}
              </p>
              <p style={{ fontSize: 12, lineHeight: "16px", color: "var(--dark-mu)", fontVariantNumeric: "tabular-nums" }}>
                {exSets.length}/{totalSets}
              </p>
            </div>
            <div className="set-progress" aria-hidden="true">
              <div style={{ width: `${Math.min(100, (exSets.length / totalSets) * 100)}%` }} />
            </div>

            {/* Big lift readout — exact from Sebas-Training.html */}
            <div className="big-lift">
              <p className="dark-kicker" style={{ textAlign: "center", marginBottom: 4 }}>Set {setNum} of {totalSets}</p>
              <button
                className={`metric-btn${padTarget !== "reps" ? " is-selected" : ""}`}
                style={{ display: "block", margin: "0 auto" }}
                onClick={() => { setPadTarget("weight"); setLogSheet(true); }}
                aria-label="Edit weight">
                <span className="wk-weight"><strong>{draft.weight || "—"}</strong><small> lb</small></span>
              </button>
              <button
                className={`metric-btn${padTarget === "reps" ? " is-selected" : ""}`}
                style={{ display: "block", margin: "0 auto" }}
                onClick={() => { setPadTarget("reps"); setLogSheet(true); }}
                aria-label="Edit reps">
                <p className="wk-reps"><strong>{draft.reps || "—"}</strong> reps</p>
              </button>
            </div>

            {/* Rest timer — board: − | ring | + */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, margin: "4px 0 20px" }}>
              <button className="step-btn" style={{ width: 48, height: 48 }} aria-label="Less rest"
                onClick={() => adjustRest(-15)}>−</button>
              <div className="timer-wrap" onClick={() => restLeft !== null && setRestOn((v) => !v)}
                role="button" aria-label={restOn ? "Pause rest" : "Resume rest"}>
                <svg className="timer-ring" width="120" height="120" viewBox="0 0 200 200">
                  <circle className="bg" cx="100" cy="100" r={R} fill="none" strokeWidth="14" />
                  <circle className="fg" cx="100" cy="100" r={R} fill="none" strokeWidth="14"
                    strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - ringFrac)} />
                </svg>
                <p className="timer-time">
                  {Math.floor(ringVal / 60)}:{String(ringVal % 60).padStart(2, "0")}
                </p>
                <p className="timer-sub">
                  {restLeft === null ? "Rest Time" : restOn ? "Tap to pause" : "Paused"}
                </p>
              </div>
              <button className="step-btn" style={{ width: 48, height: 48 }} aria-label="More rest"
                onClick={() => adjustRest(15)}>+</button>
            </div>

            {/* Log Set — board: white pill */}
            <button className="btn btn-white btn-block" style={{ minHeight: 52, fontSize: 17 }}
              onClick={() => { setPadTarget("reps"); setLogSheet(true); }}>
              Log Set
            </button>

            {/* Session stats — exact from Sebas-Training.html */}
            <div className="session-stats">
              <div>
                <strong className="tnum">{fmtVol(sets.reduce((s, x) => s + (x.weight || 0) * (x.reps || 0), 0))} lb</strong>
                Volume
              </div>
              <div>
                <strong className="tnum">{sets.length}</strong>
                Sets
              </div>
              <div>
                <strong className="tnum">{startedAt ? fmtElapsed(Date.now() - new Date(startedAt).getTime()) : "0:00"}</strong>
                Elapsed
              </div>
            </div>

            {/* Logged sets */}
            {exSets.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {exSets.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={{ color: "var(--dark-mu)", fontSize: 14, width: 44 }}>Set {s.set_number}</span>
                    <span style={{ flex: 1, color: "#fff", fontSize: 16, fontVariantNumeric: "tabular-nums" }}>
                      {s.weight} lb × {s.reps}
                    </span>
                    <button className="icon-btn" style={{ width: 36, height: 36, color: "var(--dark-mu)" }}
                      aria-label={`Delete set ${s.set_number}`} onClick={() => deleteSet(s.id, focus.exercise.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Exercise switcher */}
            {grouped.length > 1 && (
              <div className="pill-row" style={{ marginTop: 16 }}>
                {grouped.map((g) => (
                  <button key={g.exercise.id}
                    className="pill"
                    style={g.exercise.id === focus.exercise.id
                      ? { background: "#fff", color: "#111827" }
                      : { background: "rgba(255,255,255,0.1)", color: "#fff" }}
                    onClick={() => setFocusId(g.exercise.id)}>
                    {g.exercise.name}
                  </button>
                ))}
              </div>
            )}

            <div className="spacer-16" />
            <button className="btn btn-block" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
              onClick={() => setPickerOpen(true)}>
              + Add exercise
            </button>
          </>
        )}
      </div>

      {/* Log Set sheet — board-exact: steppers + mint button + numpad */}
      {logSheet && focus && (
        <div className="sheet-backdrop" style={{ background: "rgba(0,0,0,0.72)" }} onClick={() => setLogSheet(false)}>
          <div className="sheet sheet-dark" role="dialog" aria-modal="true" aria-label="Log set"
            onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <div className="sheet-head" style={{ marginBottom: 0 }}>
              <button className="icon-btn" style={{ color: "#fff" }} aria-label="Close" onClick={() => setLogSheet(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <div style={{ flex: 1, textAlign: "center" }}>
                <p style={{ color: "#fff", fontSize: 16, lineHeight: "24px", fontWeight: 600 }}>{focus.exercise.name}</p>
                <p style={{ fontSize: 12, lineHeight: "16px", color: "var(--dark-mu)" }}>Set {setNum} of {totalSets}</p>
              </div>
              <span style={{ width: 40 }} />
            </div>
            <div className="sheet-body">
              <div className="stepper">
                <span className="step-label">Weight (lb)</span>
                <div className="step-row">
                  <button className="step-btn" aria-label="Decrease weight" onClick={() => bump(focus.exercise.id, "weight", -5)}>−</button>
                  <button className="step-val" style={{ background: "none", border: 0, cursor: "pointer",
                    color: padTarget === "weight" ? "var(--mint)" : "#fff" }}
                    onClick={() => setPadTarget("weight")}>{draft.weight || "0"}</button>
                  <button className="step-btn" aria-label="Increase weight" onClick={() => bump(focus.exercise.id, "weight", 5)}>+</button>
                </div>
              </div>
              <div className="stepper">
                <span className="step-label">Reps</span>
                <div className="step-row">
                  <button className="step-btn" aria-label="Decrease reps" onClick={() => bump(focus.exercise.id, "reps", -1)}>−</button>
                  <button className="step-val" style={{ background: "none", border: 0, cursor: "pointer",
                    color: padTarget === "reps" ? "var(--mint)" : "#fff" }}
                    onClick={() => setPadTarget("reps")}>{draft.reps || "0"}</button>
                  <button className="step-btn" aria-label="Increase reps" onClick={() => bump(focus.exercise.id, "reps", 1)}>+</button>
                </div>
              </div>
              <div className="spacer-12" />
              <button className="btn btn-mint btn-block" style={{ minHeight: 52, fontSize: 17 }}
                onClick={() => logSet(focus.exercise.id)} disabled={!parseInt(draft.reps, 10)}>
                Log Set
              </button>
              <div className="spacer-12" />
              <div className="numpad">
                {["1","2","3","4","5","6","7","8","9"].map((d) => (
                  <button key={d} onClick={() => padInput(d)}>{d}</button>
                ))}
                <span />
                <button onClick={() => padInput("0")}>0</button>
                <button onClick={padBack} aria-label="Delete">⌫</button>
              </div>
              <div className="spacer-8" />
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Rest screen — prototype: full-screen timer */}
      {showRest && focus && (
        <div className="rest-screen" role="dialog" aria-modal="true" aria-label="Rest timer">
          <div className="rest-head">
            <button className="icon-btn" style={{ color: "#fff" }} aria-label="Close rest timer"
              onClick={() => setShowRest(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <p style={{ flex: 1, textAlign: "center", color: "#fff", fontSize: 18, fontWeight: 600 }}>Rest Timer</p>
            <span style={{ width: 40 }} />
          </div>
          <div className="rest-body">
            <div className="timer-wrap rest-big" onClick={() => setRestOn((v) => !v)}
              role="button" aria-label={restOn ? "Pause rest" : "Resume rest"}>
              <svg className="timer-ring" width="220" height="220" viewBox="0 0 200 200">
                <circle className="bg" cx="100" cy="100" r={R} fill="none" strokeWidth="10" />
                <circle className="fg" cx="100" cy="100" r={R} fill="none" strokeWidth="10"
                  strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - ringFrac)} />
              </svg>
              <p className="timer-time" style={{ fontSize: 56 }}>
                {Math.floor(ringVal / 60)}:{String(ringVal % 60).padStart(2, "0")}
              </p>
              <p className="timer-sub">{restOn ? "Tap to pause" : "Paused"}</p>
            </div>
            <div className="spacer-32" />
            <p style={{ fontSize: 15, color: "var(--dark-mu)" }}>Next Set</p>
            <p style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 4 }}>{focus.exercise.name}</p>
            <p style={{ fontSize: 16, color: "var(--dark-mu)", marginTop: 4 }}>
              {draft.reps || "—"} reps · {draft.weight || "—"} lb
            </p>
          </div>
          <div style={{ padding: "0 20px 40px" }}>
            <button className="btn btn-block"
              style={{ minHeight: 56, fontSize: 17, borderRadius: 999, background: "transparent",
                color: "#fff", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.25)" }}
              onClick={skipRest}>
              Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* Exercise picker */}
      {pickerOpen && (
        <div className="sheet-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="sheet sheet-dark" role="dialog" aria-modal="true" aria-label="Add exercise"
            onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <div className="sheet-head">
              <p className="title-2" style={{ color: "#fff" }}>Exercises</p>
              <button className="btn btn-plain" style={{ color: "var(--mint)" }} onClick={() => setPickerOpen(false)}>Done</button>
            </div>
            <div className="sheet-body">
              <div className="search-field dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
                </svg>
                <input placeholder="Search exercises" value={query}
                  onChange={(e) => setQuery(e.target.value)} />
              </div>
              {filteredCatalog.length === 0 ? (
                <p className="footnote" style={{ color: "var(--dark-mu)", padding: "12px 4px" }}>No matches.</p>
              ) : (
                filteredCatalog.map((e) => (
                  <button key={e.id} className="row-item" style={{ borderBottomColor: "rgba(255,255,255,0.08)" }}
                    onClick={() => addExercise(e.id)}>
                    <span className="grouped-row-thumb"><DemoThumb name={e.name} /></span>
                    <span className="row-title" style={{ color: "#fff" }}>{e.name}</span>
                    <span className="tag" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>{e.muscle_group}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
