"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, ACTIVE_WORKOUT_KEY, TEMPLATE_EXERCISES_KEY } from "../../lib/supabase";
import { catalogByName } from "../../lib/catalog";
import { visualForExercise, plateForExercise } from "../../lib/exerciseVisuals";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

const REST_DEFAULT = 90;
const RING_C = 326.73;

function clock(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fmtVol(v) {
  const n = Math.round(v || 0);
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function Session() {
  const router = useRouter();
  const [workoutId, setWorkoutId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [sets, setSets] = useState([]);
  const [addedExerciseIds, setAddedExerciseIds] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const [metric, setMetric] = useState("weight");
  const [restLeft, setRestLeft] = useState(null);
  const [restOn, setRestOn] = useState(false);
  const [restDur, setRestDur] = useState(REST_DEFAULT);
  const [showRest, setShowRest] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [motionOpen, setMotionOpen] = useState(false);
  const [motionTime, setMotionTime] = useState(12);
  const [now, setNow] = useState(0);
  const slotRef = useRef(null);
  const motionRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (!id || !isConfigured) {
      setLoading(false);
      return;
    }
    setWorkoutId(id);
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
      let seeded = [];
      try {
        const raw = localStorage.getItem(TEMPLATE_EXERCISES_KEY);
        if (raw) {
          const ids = JSON.parse(raw);
          if (Array.isArray(ids)) seeded = ids;
          localStorage.removeItem(TEMPLATE_EXERCISES_KEY);
        }
      } catch { /* ignore */ }
      if (seeded.length) {
        setAddedExerciseIds(seeded);
        setFocusId(seeded[0]);
        const next = {};
        for (const exId of seeded) {
          const row = (exercises || []).find((e) => e.id === exId);
          const meta = catalogByName(row?.name);
          next[exId] = { reps: String(meta?.reps ?? 8), weight: meta?.bodyweight ? "0" : String(meta?.weight ?? 45) };
        }
        setDrafts(next);
      }
      await refreshSets(id, seeded);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!restOn || restLeft === null || restLeft <= 0) {
      if (restLeft === 0) {
        setRestOn(false);
        setShowRest(false);
        setRestLeft(null);
      }
      return;
    }
    const t = setInterval(() => setRestLeft((s) => Math.max(0, (s ?? 1) - 1)), 1000);
    return () => clearInterval(t);
  }, [restOn, restLeft === null, restLeft <= 0]);

  async function refreshSets(id, seeded = []) {
    const { data } = await supabase
      .from("sets")
      .select("id, set_number, reps, weight, exercise_id, exercises(name, muscle_group)")
      .eq("workout_id", id)
      .order("created_at", { ascending: true });
    if (!data) return;
    setSets(data);
    setAddedExerciseIds((prev) => {
      const fromSets = data.map((s) => s.exercise_id);
      const next = [...new Set([...seeded, ...prev, ...fromSets])];
      setFocusId((cur) => cur || next[0] || null);
      return next;
    });
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

  const focus = grouped.find((g) => g.exercise.id === focusId) ?? grouped[0];
  const meta = catalogByName(focus?.exercise.name);
  const slug = meta?.id || "exercise";
  const cinematic = Boolean(meta?.cinematic && visualForExercise(focus?.exercise.name));

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || !focus) return;
    slot.dataset.exerciseId = slug;
    if (typeof window.ALDER_MOTION_MOUNT === "function" && slot.dataset.mounted !== slug) {
      window.ALDER_MOTION_MOUNT(slot);
      slot.dataset.mounted = slug;
    }
  }, [slug, focus]);

  useEffect(() => {
    if (!motionOpen) return;
    const slot = motionRef.current;
    if (!slot) return;
    slot.dataset.exerciseId = slug;
    if (typeof window.ALDER_MOTION_MOUNT === "function" && slot.dataset.mounted !== slug) {
      window.ALDER_MOTION_MOUNT(slot);
      slot.dataset.mounted = slug;
    }
    const phase = motionTime < 8 ? "setup" : motionTime < 22 ? "movement" : "finish";
    document.dispatchEvent(new CustomEvent("alder:motion", {
      detail: { exerciseId: slug, phase, time: motionTime, duration: 30 },
    }));
  }, [motionOpen, motionTime, slug]);

  function bump(field, delta) {
    if (!focus) return;
    const id = focus.exercise.id;
    setDrafts((d) => {
      const cur = d[id] ?? { reps: "8", weight: "0" };
      const n = Math.max(0, (parseFloat(cur[field]) || 0) + delta);
      return { ...d, [id]: { ...cur, [field]: String(field === "weight" ? n : Math.round(n)) } };
    });
  }

  function nudge(dir) {
    if (restOn) {
      setRestDur((v) => Math.min(600, Math.max(15, v + dir * 15)));
      setRestLeft((v) => v == null ? v : Math.min(600, Math.max(0, v + dir * 15)));
      return;
    }
    bump(metric, metric === "weight" ? dir * 5 : dir);
  }

  async function logSet() {
    if (!focus || !workoutId) return;
    const draft = drafts[focus.exercise.id] ?? {};
    const reps = parseInt(draft.reps, 10);
    const weight = parseFloat(draft.weight);
    if (!reps || reps <= 0) return;
    const existing = sets.filter((s) => s.exercise_id === focus.exercise.id).length;
    const { error } = await supabase.from("sets").insert({
      workout_id: workoutId,
      exercise_id: focus.exercise.id,
      set_number: existing + 1,
      reps,
      weight: Number.isFinite(weight) ? weight : 0,
    });
    if (error) return;
    await refreshSets(workoutId);
    setLogOpen(false);
    setRestLeft(restDur);
    setRestOn(true);
    setShowRest(true);
  }

  function padKey(key) {
    if (!focus) return;
    const id = focus.exercise.id;
    setDrafts((d) => {
      const cur = d[id] ?? { reps: "", weight: "" };
      let val = cur[metric] || "";
      if (key === "back") val = val.slice(0, -1);
      else {
        val = (val + key).slice(0, 5);
        if (/^0\d/.test(val)) val = val.slice(1);
      }
      return { ...d, [id]: { ...cur, [metric]: val } };
    });
  }

  async function finishWorkout() {
    if (!workoutId) return;
    setFinishing(true);
    const { error } = await supabase.from("workouts").update({ ended_at: new Date().toISOString() }).eq("id", workoutId);
    setFinishing(false);
    if (!error) {
      localStorage.removeItem(ACTIVE_WORKOUT_KEY);
      router.push(`/complete?id=${workoutId}`);
    }
  }

  async function discardWorkout() {
    if (!workoutId) return;
    if (!window.confirm("Discard this workout and all its sets?")) return;
    await supabase.from("sets").delete().eq("workout_id", workoutId);
    await supabase.from("workouts").delete().eq("id", workoutId);
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    router.push("/");
  }

  if (loading) {
    return <section className="screen screen-fill workout"><p className="loading">Loading…</p></section>;
  }

  if (!workoutId) {
    return (
      <section className="screen screen-fill workout">
        <ConfigBanner />
        <div className="workout-panel">
          <header className="wk-top">
            <button className="icon-btn light" type="button" aria-label="Close" onClick={() => router.push("/")}><Icon name="close" /></button>
            <span />
          </header>
          <div className="wk-title"><h1>No active workout</h1><p>Start one from Home or Workouts.</p></div>
        </div>
      </section>
    );
  }

  const exSets = focus?.sets ?? [];
  const draft = (focus && drafts[focus.exercise.id]) ?? { reps: "8", weight: "45" };
  const planned = meta?.sets || Math.max(exSets.length + 1, 4);
  const setNum = Math.min(planned, exSets.length + 1);
  const volume = sets.reduce((s, x) => s + (Number(x.weight) || 0) * (x.reps || 0), 0);
  const elapsed = startedAt ? Math.floor((now - new Date(startedAt).getTime()) / 1000) : 0;
  const ringLeft = restLeft ?? restDur;
  const ringFrac = restOn || showRest ? ringLeft / restDur : 1;
  const dash = RING_C * (1 - Math.max(0, Math.min(1, ringFrac)));
  const photo = focus ? visualForExercise(focus.exercise.name) : null;
  const weightLabel = meta?.bodyweight && Number(draft.weight) < 0.5 ? "BW" : (draft.weight || "0");

  if (motionOpen && focus) {
    const phase = motionTime < 8 ? "setup" : motionTime < 22 ? "movement" : "finish";
    const cues = meta?.cues || meta?.steps || [focus.exercise.name];
    const cue = phase === "setup" ? cues[0] : phase === "movement" ? (cues[1] || cues[0]) : cues.at(-1);
    return (
      <section className={`screen screen-fill motion${cinematic ? "" : " is-framed"} is-${phase}`}>
        <div className="motion-stage" ref={motionRef} data-muse-slot="exercise-motion" data-exercise-id={slug}>
          <img src={meta?.motion || meta?.still || plateForExercise(focus.exercise.name)} alt={meta?.motionName || focus.exercise.name} />
          <div className="motion-shade" />
        </div>
        <header className="motion-top">
          <button className="icon-btn light" type="button" aria-label="Close" onClick={() => setMotionOpen(false)}><Icon name="close" /></button>
          <span />
        </header>
        <div className="motion-copy">
          <h1>{meta?.motionName || focus.exercise.name}</h1>
          <p>{meta ? `${meta.region} · ${meta.type}` : focus.exercise.muscle_group}</p>
        </div>
        <div className="motion-controls">
          <div className="scrub">
            <span>{clock(motionTime)}</span>
            <input type="range" min="0" max="30" step="0.1" value={motionTime} aria-label="Movement timeline" onChange={(e) => setMotionTime(Number(e.target.value))} />
            <span>0:30</span>
          </div>
          <div className="phases">
            {["Setup", "Movement", "Finish"].map((label, i) => {
              const p = ["setup", "movement", "finish"][i];
              return <button key={p} type="button" className={phase === p ? "is-on" : ""} onClick={() => setMotionTime([2, 14, 26][i])}>{i + 1} {label}</button>;
            })}
          </div>
          <p className="cue">{cue}</p>
        </div>
      </section>
    );
  }

  if (logOpen && focus) {
    return (
      <section className="screen screen-fill log">
        <header className="log-top">
          <button className="icon-btn light" type="button" aria-label="Close" onClick={() => setLogOpen(false)}><Icon name="close" /></button>
          <div>
            <h1>{focus.exercise.name}</h1>
            <p>Set {setNum} of {planned}</p>
          </div>
        </header>
        <div className="log-card">
          <div className="log-field">
            <span>Weight (lb)</span>
            <div className="log-step">
              <button type="button" aria-label="Decrease weight" onClick={() => bump("weight", -5)}>−</button>
              <button className={`log-value${metric === "weight" ? " is-on" : ""}`} type="button" onClick={() => setMetric("weight")}>{draft.weight || "0"}</button>
              <button type="button" aria-label="Increase weight" onClick={() => bump("weight", 5)}>+</button>
            </div>
          </div>
          <div className="log-field">
            <span>Reps</span>
            <div className="log-step">
              <button type="button" aria-label="Decrease reps" onClick={() => bump("reps", -1)}>−</button>
              <button className={`log-value${metric === "reps" ? " is-on" : ""}`} type="button" onClick={() => setMetric("reps")}>{draft.reps || "0"}</button>
              <button type="button" aria-label="Increase reps" onClick={() => bump("reps", 1)}>+</button>
            </div>
          </div>
          <button className="btn btn-mint btn-block" type="button" onClick={logSet} disabled={!parseInt(draft.reps, 10)}>Log Set</button>
        </div>
        <div className="keys">
          {["1","2","3","4","5","6","7","8","9"].map((d) => <button key={d} type="button" onClick={() => padKey(d)}>{d}</button>)}
          <span />
          <button type="button" onClick={() => padKey("0")}>0</button>
          <button type="button" aria-label="Delete" onClick={() => padKey("back")}><Icon name="backspace" /></button>
        </div>
      </section>
    );
  }

  return (
    <section className={`screen screen-fill workout${cinematic ? "" : " is-studio"}`}>
      <ConfigBanner />
      <img
        ref={slotRef}
        className="workout-bg"
        src={photo || "/assets/gym-dark.jpg"}
        alt=""
        data-muse-slot="exercise-motion"
        data-exercise-id={slug}
      />
      <div className="workout-fade" />
      {!cinematic && focus && (
        <div className="workout-plate">
          <img src={plateForExercise(focus.exercise.name)} alt={focus.exercise.name} />
        </div>
      )}
      <div className="workout-panel">
        <header className="wk-top">
          <button className="icon-btn light" type="button" aria-label="Close workout" onClick={discardWorkout}><Icon name="close" /></button>
          <button className="icon-btn light" type="button" onClick={finishWorkout} disabled={finishing} aria-label="Finish workout">
            <Icon name="check" />
          </button>
        </header>
        {focus ? (
          <>
            <div className="wk-title">
              <h1>{focus.exercise.name}</h1>
              <p id="wk-meta">{meta ? `${meta.region} · ${meta.type}` : (focus.exercise.muscle_group || "Exercise")}</p>
            </div>
            <div className="wk-progress">
              <div className="track"><span style={{ width: `${Math.min(100, (setNum / planned) * 100)}%` }} /></div>
              <button type="button" onClick={() => setPickerOpen(true)}>{setNum}/{planned}</button>
            </div>
            <div className="wk-spacer" role="presentation" onClick={() => setMotionOpen(true)} />
            <div className="wk-dock">
              <p className="wk-set">Set {setNum}/{planned}</p>
              <button className={`wk-weight metric-btn${metric === "weight" ? " is-selected" : ""}`} type="button" onClick={() => { setMetric("weight"); setLogOpen(true); }}>
                <strong>{weightLabel}</strong>{weightLabel === "BW" ? null : <small>lb</small>}
              </button>
              <button className={`wk-reps metric-btn${metric === "reps" ? " is-selected" : ""}`} type="button" onClick={() => { setMetric("reps"); setLogOpen(true); }}>
                <strong>{draft.reps || "0"}</strong> <span>reps</span>
              </button>
              <div className="ring-row">
                <button className="step" type="button" aria-label="Decrease" onClick={() => nudge(-1)}><Icon name="minus" /></button>
                <button className="ring ring-sm" type="button" aria-label="Rest timer" onClick={() => { if (restLeft == null) { setRestLeft(restDur); setRestOn(true); } setShowRest(true); }}>
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    <defs>
                      <linearGradient id="mintGradA" x1="0" y1="1" x2="1" y2="0">
                        <stop offset="0" stopColor="#D92D20" />
                        <stop offset="1" stopColor="#FF5A4F" />
                      </linearGradient>
                    </defs>
                    <circle className="ring-track" cx="60" cy="60" r="52" />
                    <circle className="ring-value" cx="60" cy="60" r="52" strokeDasharray={RING_C} strokeDashoffset={dash} />
                  </svg>
                  <span className="ring-label"><strong>{clock(ringLeft)}</strong><small>Rest Time</small></span>
                </button>
                <button className="step" type="button" aria-label="Increase" onClick={() => nudge(1)}><Icon name="plus" /></button>
              </div>
              <div className="session-stats">
                <div><strong>{fmtVol(volume)}</strong><span>Volume</span></div>
                <div><strong>{sets.length}</strong><span>Sets</span></div>
                <div><strong>{clock(elapsed)}</strong><span>Elapsed</span></div>
              </div>
              <button className="btn btn-white btn-block" type="button" onClick={() => setLogOpen(true)}>Log Set</button>
            </div>
          </>
        ) : (
          <div className="wk-title">
            <h1>Add an exercise</h1>
            <button className="btn btn-white" type="button" onClick={() => setPickerOpen(true)} style={{ marginTop: 16 }}>Choose exercise</button>
          </div>
        )}
      </div>

      {showRest && focus && (
        <section className="screen screen-fill rest" role="dialog" aria-label="Rest timer">
          <img className="rest-bg" src="/assets/gym-dark.jpg" alt="" />
          <div className="rest-shade" />
          <header className="rest-top">
            <button className="icon-btn light" type="button" aria-label="Close rest" onClick={() => setShowRest(false)}><Icon name="close" /></button>
            <h1>Rest Timer</h1>
            <span />
          </header>
          <button className="ring ring-lg" type="button" aria-label={restOn ? "Pause rest" : "Resume rest"} onClick={() => setRestOn((v) => !v)}>
            <svg viewBox="0 0 200 200" aria-hidden="true">
              <defs>
                <linearGradient id="mintGradB" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#D92D20" />
                  <stop offset="0.55" stopColor="#F0372D" />
                  <stop offset="1" stopColor="#FF5A4F" />
                </linearGradient>
              </defs>
              <circle className="ring-track" cx="100" cy="100" r="78" />
              <circle className="ring-value" id="rest-ring" cx="100" cy="100" r="78" strokeDasharray="490.09" strokeDashoffset={490.09 * (1 - Math.max(0, Math.min(1, ringLeft / restDur)))} />
            </svg>
            <span className="ring-label">
              <strong>{clock(ringLeft)}</strong>
              <small>{restOn ? "Tap to pause" : "Tap to resume"}</small>
            </span>
          </button>
          <div className="rest-next">
            <p>Next Set</p>
            <h2>{focus.exercise.name}</h2>
            <p>{draft.reps || "—"} reps · {weightLabel === "BW" ? "BW" : `${draft.weight || "—"} lb`}</p>
          </div>
          <button className="btn btn-white" type="button" onClick={() => { setShowRest(false); setPickerOpen(true); }} style={{ marginBottom: 8 }}>Switch Exercise</button>
          <button className="btn btn-ghost" type="button" onClick={() => { setRestOn(false); setRestLeft(null); setShowRest(false); }}>Skip Rest</button>
        </section>
      )}

      {pickerOpen && (
        <div className="sheet">
          <button className="sheet-scrim" type="button" aria-label="Close" onClick={() => setPickerOpen(false)} />
          <div className="sheet-card" role="dialog" aria-modal="true">
            <div className="grab" />
            <header>
              <h2>Exercises</h2>
              <button type="button" onClick={() => setPickerOpen(false)}>Close</button>
            </header>
            <label className="search" style={{ margin: "10px 0" }}>
              <Icon name="search" />
              <input value={query} placeholder="Search exercises..." onChange={(e) => setQuery(e.target.value)} />
            </label>
            {catalog.filter((e) => {
              const q = query.trim().toLowerCase();
              return !q || e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q);
            }).map((e) => (
              <button key={e.id} className="seq-item" type="button" onClick={() => {
                setAddedExerciseIds((prev) => prev.includes(e.id) ? prev : [...prev, e.id]);
                const cat = catalogByName(e.name);
                setDrafts((d) => ({ ...d, [e.id]: d[e.id] ?? { reps: String(cat?.reps ?? 8), weight: String(cat?.weight ?? 45) } }));
                setFocusId(e.id);
                setPickerOpen(false);
                setQuery("");
              }}>
                <img src={plateForExercise(e.name)} alt="" />
                <span><strong>{e.name}</strong></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
