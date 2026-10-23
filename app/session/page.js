"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured, ACTIVE_WORKOUT_KEY, TEMPLATE_EXERCISES_KEY, loadWorkoutSnapshot, saveWorkoutSnapshot, clearWorkoutSnapshot } from "../../lib/supabase";
import { catalogByName } from "../../lib/catalog";
import { visualForExercise, plateForExercise } from "../../lib/exerciseVisuals";
import ConfigBanner from "../components/ConfigBanner";
import { volumeOf } from "../../lib/volume";
import Icon from "../components/Icon";
import Plates from "../components/Plates";

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

const StablePlates = memo(Plates);

/** Elapsed session clock. Owns the 1s tick so the page does not re-render for it. */
const ElapsedClock = memo(function ElapsedClock({ startedAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const elapsed = startedAt ? Math.floor((now - new Date(startedAt).getTime()) / 1000) : 0;
  return <>{clock(elapsed)} in</>;
});

const LoggedPanel = memo(function LoggedPanel({ sets, volume }) {
  if (!sets.length) return null;
  return (
    <section className="panel" style={{ marginTop: 14 }}>
      <div className="panel-head"><h2>Logged</h2><span className="note num">{Math.round(volume).toLocaleString()} lb</span></div>
      {sets.map((s) => (
        <div key={s.id} className="lift">
          <span className="lift-copy"><strong>Set {s.set_number}</strong></span>
          <span className="scheme num">{s.weight} lb × {s.reps}</span>
        </div>
      ))}
    </section>
  );
});

const QueuePanel = memo(function QueuePanel({ grouped, focusId, onFocus, onAdd }) {
  const rows = grouped.map((g) => {
    const planned = catalogByName(g.exercise.name)?.sets || null;
    const logged = g.sets.length;
    const last = logged ? g.sets[logged - 1] : null;
    return { g, planned, logged, last, done: Boolean(planned && logged >= planned) };
  });
  const doneCount = rows.filter((r) => r.done).length;
  return (
    <section className="panel queue" style={{ marginTop: 14 }}>
      <div className="panel-head">
        <h2>Queue</h2>
        <span className="note">{doneCount} of {rows.length} done</span>
        <button className="text-btn" type="button" onClick={onAdd}>Add exercise</button>
      </div>
      {rows.map(({ g, planned, logged, last, done }) => {
        const current = g.exercise.id === focusId;
        const lastText = last ? (Number(last.weight) > 0 ? `${last.weight} lb × ${last.reps}` : `BW × ${last.reps}`) : null;
        const meta = planned
          ? (logged ? `${logged} of ${planned} sets${lastText ? ` · last ${lastText}` : ""}` : `${planned} sets planned`)
          : (logged ? `${logged} ${logged === 1 ? "set" : "sets"} logged${lastText ? ` · last ${lastText}` : ""}` : "Not started");
        return (
          <button
            key={g.exercise.id}
            type="button"
            className={current ? "is-current" : ""}
            aria-current={current || undefined}
            onClick={() => onFocus(g.exercise.id)}
          >
            <img src={visualForExercise(g.exercise.name) || plateForExercise(g.exercise.name)} alt="" loading="lazy" decoding="async" />
            <span>
              <strong>{g.exercise.name}</strong>
              <small>{meta}</small>
              {planned ? (
                <span className="q-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, (logged / planned) * 100)}%` }} /></span>
              ) : null}
            </span>
            {current ? <span className="q-pill">Now</span> : done ? <span className="q-done" aria-label="Done">✓</span> : <span className="q-chev" aria-hidden="true">›</span>}
          </button>
        );
      })}
    </section>
  );
});

/** Keeps the previous cover until the next photo has loaded. */
const StableCover = memo(function StableCover({ src }) {
  const [shown, setShown] = useState(src);
  useEffect(() => {
    if (!src || src === shown) return undefined;
    let cancel = false;
    const img = new Image();
    img.onload = () => { if (!cancel) setShown(src); };
    img.src = src;
    if (img.complete && img.naturalWidth) setShown(src);
    return () => { cancel = true; };
  }, [src, shown]);
  return (
    <div className="cover-full">
      <img src={shown || src} alt="" />
    </div>
  );
});

const OrderSheet = memo(function OrderSheet({ rows, onClose, onPick, onReorder }) {
  const listRef = useRef(null);
  const dragState = useRef(null);
  const justDraggedRef = useRef(false);

  function rowEls() {
    return listRef.current ? [...listRef.current.querySelectorAll("[data-exid]")] : [];
  }

  function clearStyles(els) {
    for (const el of els) {
      el.style.transform = "";
      el.style.zIndex = "";
    }
  }

  function placeRows(d) {
    const order = d.rows.map((_, i) => i);
    const [moved] = order.splice(d.index, 1);
    order.splice(d.target, 0, moved);
    let y = d.rows[0]?.top ?? 0;
    const nextTop = new Array(d.rows.length);
    for (const i of order) {
      nextTop[i] = y;
      y += d.rows[i].height;
    }
    d.rows.forEach((row, i) => {
      if (i === d.index) {
        row.el.style.transform = `translateY(${d.dy}px)`;
        row.el.style.zIndex = "5";
        return;
      }
      const shift = nextTop[i] - row.top;
      row.el.style.transform = shift ? `translateY(${shift}px)` : "";
      row.el.style.zIndex = "";
    });
  }

  function startDrag(e, index) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    const els = rowEls();
    dragState.current = {
      pid: e.pointerId,
      startY: e.clientY,
      index,
      target: index,
      active: false,
      dy: 0,
      rows: els.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, top: r.top, height: r.height || 64 };
      }),
    };
  }

  function moveDrag(e) {
    const d = dragState.current;
    if (!d || e.pointerId !== d.pid) return;
    const dy = e.clientY - d.startY;
    if (!d.active) {
      if (Math.abs(dy) < 10) return;
      d.active = true;
      justDraggedRef.current = true;
      d.rows = rowEls().map((el) => {
        const r = el.getBoundingClientRect();
        return { el, top: r.top, height: r.height || 64 };
      });
    }
    d.dy = dy;
    let target = 0;
    let seen = 0;
    for (let i = 0; i < d.rows.length; i++) {
      if (i === d.index) continue;
      const mid = d.rows[i].top + d.rows[i].height / 2;
      if (e.clientY < mid) {
        target = seen;
        break;
      }
      seen += 1;
      target = seen;
    }
    const targetChanged = target !== d.target;
    d.target = target;
    if (targetChanged) placeRows(d);
    else if (d.rows[d.index]) {
      d.rows[d.index].el.style.transform = `translateY(${dy}px)`;
      d.rows[d.index].el.style.zIndex = "5";
    }
  }

  function endDrag(e) {
    const d = dragState.current;
    if (!d || (e && e.pointerId !== d.pid)) return;
    dragState.current = null;
    clearStyles(d.rows.map((row) => row.el));
    if (d.active && d.target !== d.index) {
      const next = rows.map((g) => g.exercise.id);
      const [moved] = next.splice(d.index, 1);
      next.splice(d.target, 0, moved);
      onReorder(next);
    }
    if (d.active) setTimeout(() => { justDraggedRef.current = false; }, 80);
  }

  return (
    <div className="sheet">
      <button className="sheet-scrim" type="button" aria-label="Close" onClick={onClose} />
      <div className="sheet-card" role="dialog" aria-modal="true" aria-label="Exercise order">
        <header>
          <h2>Exercise order</h2>
          <button className="text-btn" type="button" onClick={onClose}>Done</button>
        </header>
        <p className="note">Hold the handle and drag. Tap a name to switch to it.</p>
        <div ref={listRef} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
          {rows.map((g, i) => {
            const done = g.sets.length;
            return (
              <div
                key={g.exercise.id}
                data-exid={g.exercise.id}
                className="reorder-row"
                onClick={() => {
                  if (justDraggedRef.current) return;
                  onPick(g.exercise.id);
                }}
              >
                <span className="drag-handle" role="button" aria-label={`Drag to reorder ${g.exercise.name}`} onPointerDown={(e) => startDrag(e, i)} onClick={(e) => e.stopPropagation()}>
                  <Icon name="grip" />
                </span>
                <span className="lift-copy">
                  <strong>{g.exercise.name}</strong>
                  <small>{`${done} ${done === 1 ? "set" : "sets"}`}</small>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

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
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const [metric, setMetric] = useState("weight");
  const [restLeft, setRestLeft] = useState(null);
  const [restOn, setRestOn] = useState(false);
  const [restDur, setRestDur] = useState(REST_DEFAULT);
  const [showRest, setShowRest] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [motionOpen, setMotionOpen] = useState(false);
  const [motionTime, setMotionTime] = useState(12);
  const [logError, setLogError] = useState("");
  const slotRef = useRef(null);
  const motionRef = useRef(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [logging, setLogging] = useState(false);
  const [history, setHistory] = useState([]);
  const hydratedRef = useRef(false);
  const orderRef = useRef([]);
  const setsRef = useRef([]);
  const refreshGen = useRef(0);
  const loggingRef = useRef(false);
  const restEndsRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem(ACTIVE_WORKOUT_KEY);
    if (!id || !isConfigured) {
      setLoading(false);
      return;
    }
    setWorkoutId(id);
    (async () => {
      const supabase = await getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
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
        orderRef.current = seeded;
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
      // Restore the saved session snapshot (if any): exercise order, drafts,
      // focused exercise, and a still-running rest timer.
      const snap = loadWorkoutSnapshot(id);
      if (snap) {
        if (Array.isArray(snap.order) && snap.order.length) {
          const pos = new Map(snap.order.map((x, i) => [x, i]));
          setAddedExerciseIds((prev) => [...prev].sort((a, b) => {
            const pa = pos.has(a) ? pos.get(a) : 1e9;
            const pb = pos.has(b) ? pos.get(b) : 1e9;
            return pa - pb;
          }));
        }
        if (snap.drafts && typeof snap.drafts === "object") {
          setDrafts((d) => ({ ...d, ...snap.drafts }));
        }
        if (snap.focusId) setFocusId(snap.focusId);
        if (snap.rest && snap.rest.endsAt > Date.now()) {
          restEndsRef.current = snap.rest.endsAt;
          setRestDur(snap.rest.dur || REST_DEFAULT);
          setRestLeft(Math.max(1, Math.ceil((snap.rest.endsAt - Date.now()) / 1000)));
          setRestOn(true);
          setShowRest(true);
        }
      }
      hydratedRef.current = true;
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    (async () => {
      const supabase = await getSupabase();
      if (!supabase) return;
      const { data } = await supabase
        .from("workouts")
        .select("started_at, ended_at, sets(exercise_id, reps, weight)")
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(40);
      if (data) setHistory(data);
    })();
  }, []);

  // Mirror the exercise order for use inside pointer handlers.
  useEffect(() => {
    orderRef.current = addedExerciseIds;
  }, [addedExerciseIds]);

  // Persist the session snapshot (order, drafts, focus, rest) so the workout
  // survives navigation and reloads. Guarded until the initial restore runs.
  useEffect(() => {
    if (!workoutId || !hydratedRef.current) return;
    saveWorkoutSnapshot(workoutId, {
      order: addedExerciseIds,
      drafts,
      focusId,
      rest: restOn && restEndsRef.current ? { endsAt: restEndsRef.current, dur: restDur } : null,
      savedAt: Date.now(),
    });
  }, [workoutId, addedExerciseIds, drafts, focusId, restOn, restDur]);

  // Countdown is the time left until restEndsRef, not a decrement. A throttled
  // background interval then catches up on the next tick instead of drifting.
  useEffect(() => {
    if (!restOn || !restEndsRef.current) return undefined;
    const tick = () => {
      if (!restEndsRef.current) return;
      const left = Math.max(0, Math.ceil((restEndsRef.current - Date.now()) / 1000));
      setRestLeft(left);
      if (left <= 0) {
        restEndsRef.current = null;
        setRestOn(false);
        setShowRest(false);
        setRestLeft(null);
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [restOn]);

  useEffect(() => {
    if (!catalog.length || !addedExerciseIds.length) return;
    for (const id of addedExerciseIds) {
      const row = catalog.find((e) => e.id === id);
      if (!row) continue;
      const src = visualForExercise(row.name) || plateForExercise(row.name);
      if (!src) continue;
      const img = new Image();
      img.src = src;
    }
  }, [addedExerciseIds, catalog]);

  async function refreshSets(id, seeded = []) {
    const gen = ++refreshGen.current;
    const supabase = await getSupabase();
    if (!supabase || gen !== refreshGen.current) return;
    const { data } = await supabase
      .from("sets")
      .select("id, set_number, reps, weight, exercise_id, exercises(name, muscle_group)")
      .eq("workout_id", id)
      .order("created_at", { ascending: true });
    if (!data || gen !== refreshGen.current) return;
    const extras = setsRef.current.filter((s) => {
      if (data.some((row) => row.id === s.id)) return false;
      if (s.pending && data.some((row) => row.exercise_id === s.exercise_id && row.set_number === s.set_number)) return false;
      return Boolean(s.pending) || data.every((row) => row.id !== s.id);
    });
    const nextSets = [...data, ...extras];
    setsRef.current = nextSets;
    setSets(nextSets);
    const fromSets = data.map((s) => s.exercise_id);
    const nextIds = [...new Set([...seeded, ...orderRef.current, ...fromSets])];
    orderRef.current = nextIds;
    setAddedExerciseIds(nextIds);
    setFocusId((cur) => cur || nextIds[0] || null);
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
    if (restOn && restEndsRef.current) {
      const nextEnd = restEndsRef.current + dir * 15 * 1000;
      const left = Math.min(600, Math.max(0, Math.ceil((nextEnd - Date.now()) / 1000)));
      restEndsRef.current = Date.now() + left * 1000;
      setRestLeft(left);
      setRestDur((v) => Math.min(600, Math.max(15, v + dir * 15)));
      return;
    }
    bump(metric, metric === "weight" ? dir * 5 : dir);
  }

  function toggleRest() {
    if (restOn) {
      const left = restEndsRef.current
        ? Math.max(0, Math.ceil((restEndsRef.current - Date.now()) / 1000))
        : restLeft;
      setRestLeft(left);
      setRestOn(false);
      return;
    }
    const left = restLeft ?? restDur;
    restEndsRef.current = Date.now() + left * 1000;
    setRestLeft(left);
    setRestOn(true);
    setShowRest(true);
  }

  function skipRest() {
    restEndsRef.current = null;
    setRestOn(false);
    setRestLeft(null);
    setShowRest(false);
  }

  async function logSet() {
    if (!focus || !workoutId || loggingRef.current) return;
    const exercise = focus.exercise;
    const draft = drafts[exercise.id] ?? {};
    const reps = parseInt(draft.reps, 10);
    const weight = parseFloat(draft.weight);
    if (!reps || reps <= 0) return;
    loggingRef.current = true;
    const existing = setsRef.current.filter((s) => s.exercise_id === exercise.id).length;
    const tempId = `pending-${Date.now()}-${existing + 1}`;
    const optimistic = {
      id: tempId,
      set_number: existing + 1,
      reps,
      weight: Number.isFinite(weight) ? weight : 0,
      exercise_id: exercise.id,
      exercises: { name: exercise.name, muscle_group: exercise.muscle_group },
      pending: true,
    };
    const nextSets = [...setsRef.current, optimistic];
    setsRef.current = nextSets;
    setSets(nextSets);
    setLogError("");
    setLogOpen(false);
    restEndsRef.current = Date.now() + restDur * 1000;
    setRestLeft(restDur);
    setRestOn(true);
    setShowRest(true);
    setLogging(false);
    loggingRef.current = false;
    try {
      const supabase = await getSupabase();
      if (!supabase) throw new Error("no-client");
      const { data, error } = await supabase.from("sets").insert({
        workout_id: workoutId,
        exercise_id: exercise.id,
        set_number: optimistic.set_number,
        reps,
        weight: optimistic.weight,
      }).select("id, set_number, reps, weight, exercise_id").single();
      if (error || !data) throw error || new Error("insert");
      setsRef.current = setsRef.current.map((s) => (s.id === tempId ? { ...data, exercises: optimistic.exercises } : s));
      setSets(setsRef.current);
      refreshSets(workoutId);
    } catch {
      setsRef.current = setsRef.current.filter((s) => s.id !== tempId);
      setSets(setsRef.current);
      setLogError("That set didn't save. Log it again.");
    }
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
    const supabase = await getSupabase();
    const { error } = supabase
      ? await supabase.from("workouts").update({ ended_at: new Date().toISOString() }).eq("id", workoutId)
      : { error: new Error("no-client") };
    setFinishing(false);
    if (error) {
      setLogError("That didn't save. Try again.");
      return;
    }
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    clearWorkoutSnapshot(workoutId);
    router.push(`/complete?id=${workoutId}`);
  }

  async function discardWorkout() {
    if (!workoutId) return;
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      setTimeout(() => setConfirmDiscard(false), 4000);
      return;
    }
    setConfirmDiscard(false);
    const supabase = await getSupabase();
    if (supabase) {
      const setsDel = await supabase.from("sets").delete().eq("workout_id", workoutId);
      if (setsDel.error) {
        setLogError("That didn't save. Try again.");
        return;
      }
      const workoutDel = await supabase.from("workouts").delete().eq("id", workoutId);
      if (workoutDel.error) {
        setLogError("That didn't save. Try again.");
        return;
      }
    }
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    clearWorkoutSnapshot(workoutId);
    router.push("/");
  }

  const orderList = useMemo(
    () => addedExerciseIds.map((id) => grouped.find((g) => g.exercise.id === id)).filter(Boolean),
    [addedExerciseIds, grouped]
  );

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const focusExercise = useCallback((id) => setFocusId(id), []);
  const closeOrder = useCallback(() => setOrderOpen(false), []);
  const pickFromOrder = useCallback((id) => {
    setFocusId(id);
    setOrderOpen(false);
  }, []);
  const reorderExercises = useCallback((next) => {
    orderRef.current = next;
    setAddedExerciseIds(next);
  }, []);

  if (loading) {
    return <section className="page"><p className="loading">Loading the session…</p></section>;
  }

  if (!workoutId) {
    return (
      <section className="page">
        <ConfigBanner />
        <h1>No session open</h1>
        <p className="lede">Start one from Today or the split.</p>
        <button className="btn btn-primary" type="button" onClick={() => router.push("/")}>Back to today</button>
      </section>
    );
  }

  const exSets = focus?.sets ?? [];
  const draft = (focus && drafts[focus.exercise.id]) ?? { reps: "8", weight: "45" };
  const planned = meta?.sets || Math.max(exSets.length + 1, 4);
  const setNum = Math.min(planned, exSets.length + 1);
  const volume = volumeOf(sets);
  const photo = focus ? visualForExercise(focus.exercise.name) : null;
  const weightLabel = meta?.bodyweight && Number(draft.weight) < 0.5 ? "BW" : (draft.weight || "0");
  const pounds = Number(draft.weight);
  let previous = null;
  if (focus) {
    for (const w of history) {
      const rows = (w.sets ?? []).filter((s) => s.exercise_id === focus.exercise.id);
      if (!rows.length) continue;
      const row = rows[rows.length - 1];
      previous = { weight: Number(row.weight) || 0, reps: row.reps ?? 0 };
      break;
    }
  }

  if (motionOpen && focus) {
    const phase = motionTime < 8 ? "setup" : motionTime < 22 ? "movement" : "finish";
    const cues = meta?.cues || meta?.steps || [focus.exercise.name];
    const cue = phase === "setup" ? cues[0] : phase === "movement" ? (cues[1] || cues[0]) : cues.at(-1);
    return (
      <section className={`library-keep screen screen-fill motion${cinematic ? "" : " is-framed"} is-${phase}`}>
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
              return <button key={p} type="button" className={phase === p ? "is-on" : ""} onClick={() => setMotionTime([2, 14, 26][i])}>{label}</button>;
            })}
          </div>
          <p className="cue">{cue}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <ConfigBanner />
      <img ref={slotRef} style={{ display: "none" }} src={photo || plateForExercise(focus?.exercise.name || "")} alt="" hidden data-muse-slot="exercise-motion" data-exercise-id={slug} />
      <div className="session-top">
        <button className="btn btn-quiet" type="button" onClick={discardWorkout}>
          {confirmDiscard ? "Tap again to discard" : "Discard"}
        </button>
        <div className="title-actions">
          <button className="btn btn-line" type="button" onClick={() => setOrderOpen(true)}>Order</button>
          <button className="btn btn-line" type="button" onClick={finishWorkout} disabled={finishing}>
            {finishing ? "Saving…" : "Finish"}
          </button>
        </div>
      </div>

      {focus ? (
        <>
          <div className="focus-swap" key={focus.exercise.id}>
          <div className="title-row" style={{ marginTop: 12 }}>
            <div>
              <h1>{focus.exercise.name}</h1>
              <p className="lede">
                Set {setNum} of {planned}
                {previous ? ` · Last time ${previous.weight} lb × ${previous.reps}` : " · No earlier set in the log"}
                {" · "}<ElapsedClock startedAt={startedAt} />
              </p>
            </div>
          </div>
          </div>
          <StableCover src={photo || plateForExercise(focus.exercise.name || "")} />
          <div className="focus-swap" key={`${focus.exercise.id}-set`}>
          {weightLabel === "BW" ? <p className="figure">Bodyweight</p> : <StablePlates pounds={pounds} />}
          <div className="pair">
            <div className={`metric${metric === "weight" ? " is-on" : ""}`}>
              <span>Weight</span>
              <div className="stepper">
                <button className="step" type="button" aria-label="Decrease weight" onClick={() => { setMetric("weight"); bump("weight", -5); }}>−</button>
                <button className="figure" type="button" onClick={() => { setMetric("weight"); setLogOpen(true); }}>
                  {weightLabel}{weightLabel === "BW" ? null : <small>lb</small>}
                </button>
                <button className="step" type="button" aria-label="Increase weight" onClick={() => { setMetric("weight"); bump("weight", 5); }}>+</button>
              </div>
            </div>
            <div className={`metric${metric === "reps" ? " is-on" : ""}`}>
              <span>Reps</span>
              <div className="stepper">
                <button className="step" type="button" aria-label="Decrease reps" onClick={() => { setMetric("reps"); bump("reps", -1); }}>−</button>
                <button className="figure" type="button" onClick={() => { setMetric("reps"); setLogOpen(true); }}>{draft.reps || "0"}</button>
                <button className="step" type="button" aria-label="Increase reps" onClick={() => { setMetric("reps"); bump("reps", 1); }}>+</button>
              </div>
            </div>
          </div>
          <div className="title-actions" style={{ marginTop: 14 }}>
            <button className="btn btn-primary" type="button" onClick={logSet} disabled={logging || !parseInt(draft.reps, 10)}>
              {logging ? "Logging…" : "Log set"}
            </button>
            <button className="btn btn-line" type="button" onClick={() => { if (restLeft == null) { restEndsRef.current = Date.now() + restDur * 1000; setRestLeft(restDur); setRestOn(true); } setShowRest(true); }}>
              Rest {clock(restLeft ?? restDur)}
            </button>
            <button className="btn btn-line" type="button" onClick={() => setMotionOpen(true)}>Movement</button>
            <button className="btn btn-quiet" type="button" onClick={() => router.push("/coach")}>Coach</button>
          </div>
          </div>
          {logError ? <p className="note" role="alert">{logError}</p> : null}
          {showRest && (
            <div className="rest" role="region" aria-label="Rest">
              <div className="stripe" />
              <p className="figure">{clock(restLeft ?? 0)}</p>
              <p>{restOn ? "Resting before the next set." : "Rest is paused."}</p>
              <div className="title-actions" style={{ marginTop: 10 }}>
                <button className="btn btn-line" type="button" onClick={toggleRest}>{restOn ? "Pause" : "Resume"}</button>
                <button className="btn btn-line" type="button" onClick={() => nudge(1)}>+15s</button>
                <button className="btn btn-line" type="button" onClick={() => nudge(-1)}>−15s</button>
                <button className="btn btn-quiet" type="button" onClick={skipRest}>Skip rest</button>
              </div>
            </div>
          )}
          {logOpen && (
            <div className="panel" style={{ marginTop: 14 }}>
              <div className="panel-head">
                <h2>Type the {metric}</h2>
                <button className="text-btn" type="button" onClick={() => setLogOpen(false)}>Close</button>
              </div>
              <div className="keys">
                {["1","2","3","4","5","6","7","8","9","0"].map((d) => <button key={d} type="button" onClick={() => padKey(d)}>{d}</button>)}
                <button type="button" aria-label="Delete" onClick={() => padKey("back")}>Delete</button>
                <button type="button" onClick={logSet}>Log set</button>
              </div>
            </div>
          )}
          <LoggedPanel sets={exSets} volume={volume} />
          <QueuePanel grouped={grouped} focusId={focus.exercise.id} onFocus={focusExercise} onAdd={openPicker} />
        </>
      ) : (
        <>
          <h1>Add an exercise</h1>
          <p className="lede">The session has no lifts yet.</p>
          <button className="btn btn-primary" type="button" onClick={openPicker}>Choose exercise</button>
        </>
      )}

      {orderOpen && (
        <OrderSheet rows={orderList} onClose={closeOrder} onPick={pickFromOrder} onReorder={reorderExercises} />
      )}

      {pickerOpen && (
        <div className="sheet">
          <button className="sheet-scrim" type="button" aria-label="Close" onClick={() => { setPickerOpen(false); setQuery(""); }} />
          <div className="sheet-card" role="dialog" aria-modal="true" aria-label="Add exercise">
            <header>
              <h2>Add exercise</h2>
              <button className="text-btn" type="button" onClick={() => { setPickerOpen(false); setQuery(""); }}>Close</button>
            </header>
            <label className="field">
              <span>Search</span>
              <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            </label>
            {catalog.filter((e) => {
              const q = query.trim().toLowerCase();
              return !q || (e.name || "").toLowerCase().includes(q) || (e.muscle_group || "").toLowerCase().includes(q);
            }).map((e) => (
              <button key={e.id} className="row-link" type="button" onClick={() => {
                const prevIds = orderRef.current;
                const nextIds = prevIds.includes(e.id) ? prevIds : [...prevIds, e.id];
                orderRef.current = nextIds;
                setAddedExerciseIds(nextIds);
                const cat = catalogByName(e.name);
                setDrafts((d) => ({ ...d, [e.id]: d[e.id] ?? { reps: String(cat?.reps ?? 8), weight: String(cat?.weight ?? 45) } }));
                setFocusId(e.id);
                setPickerOpen(false);
                setQuery("");
              }}>
                <img src={plateForExercise(e.name)} alt="" loading="lazy" decoding="async" />
                <span className="row-copy"><strong>{e.name}</strong><small>{e.muscle_group}</small></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
