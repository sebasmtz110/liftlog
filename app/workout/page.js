"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, ACTIVE_WORKOUT_KEY } from "../../lib/supabase";
import { formatDateTime } from "../../lib/format";
import ConfigBanner from "../components/ConfigBanner";

/**
 * Active workout screen: add exercises from the catalog, log sets
 * (reps + weight), delete sets, finish the workout.
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
        // Stale id (workout already finished) — clean up.
        localStorage.removeItem(ACTIVE_WORKOUT_KEY);
        setWorkoutId(null);
        setLoading(false);
        return;
      }
      setStartedAt(workout.started_at);
      if (exercises) setCatalog(exercises);
      await refreshSets(id);
      setLoading(false);
    })();
  }, []);

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
        return [...new Set([...prev, ...fromSets])];
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
    setPickerOpen(false);
    setQuery("");
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
      setDrafts((d) => ({ ...d, [exerciseId]: { reps: "", weight: "" } }));
      await refreshSets(workoutId);
    }
  }

  async function deleteSet(setId, exerciseId) {
    const { error } = await supabase.from("sets").delete().eq("id", setId);
    if (error) return;
    const remaining = sets
      .filter((s) => s.exercise_id === exerciseId && s.id !== setId)
      .sort((a, b) => a.set_number - b.set_number);
    // Renumber remaining sets so set numbers stay sequential.
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
      router.push("/history");
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
    return (
      <>
        <ConfigBanner />
        <p className="loading">Loading…</p>
      </>
    );
  }

  if (!workoutId) {
    return (
      <>
        <ConfigBanner />
        <header className="screen-head">
          <h1 className="large-title">Workout</h1>
        </header>
        <div className="screen-body">
          <div className="empty">
            <p className="headline">No active workout</p>
            <div className="spacer-8" />
            <p className="footnote">Start one from the Home tab to begin logging sets.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <p className="caption">{startedAt ? formatDateTime(startedAt).toUpperCase() : "IN PROGRESS"}</p>
        <h1 className="large-title">Workout</h1>
      </header>

      <div className="screen-body">
        {grouped.length === 0 ? (
          <div className="card">
            <p className="body">Add your first exercise to start logging sets.</p>
          </div>
        ) : (
          grouped.map(({ exercise, sets: exSets }) => {
            const draft = drafts[exercise.id] ?? { reps: "", weight: "" };
            return (
              <div className="card" key={exercise.id}>
                <div className="workout-row-head">
                  <p className="headline">{exercise.name}</p>
                  <span className="muscle-tag">{exercise.muscle_group}</span>
                </div>
                <div className="spacer-8" />
                {exSets.map((s) => (
                  <div className="set-row" key={s.id}>
                    <span className="set-num">{s.set_number}</span>
                    <span className="body" style={{ textAlign: "center" }}>{s.reps} reps</span>
                    <span className="body" style={{ textAlign: "center" }}>{s.weight} lb</span>
                    <button
                      className="icon-btn"
                      aria-label={`Delete set ${s.set_number}`}
                      onClick={() => deleteSet(s.id, exercise.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="spacer-8" />
                <div className="row-2">
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor={`reps-${exercise.id}`}>Reps</label>
                    <input
                      id={`reps-${exercise.id}`}
                      className="input"
                      inputMode="numeric"
                      placeholder="10"
                      value={draft.reps}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [exercise.id]: { ...draft, reps: e.target.value } }))
                      }
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor={`weight-${exercise.id}`}>Weight (lb)</label>
                    <input
                      id={`weight-${exercise.id}`}
                      className="input"
                      inputMode="decimal"
                      placeholder="135"
                      value={draft.weight}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [exercise.id]: { ...draft, weight: e.target.value } }))
                      }
                    />
                  </div>
                </div>
                <div className="spacer-12" />
                <button className="btn btn-tinted" style={{ width: "100%" }} onClick={() => logSet(exercise.id)}>
                  + Log set
                </button>
              </div>
            );
          })
        )}

        <div className="spacer-16" />
        <button className="btn btn-gray" style={{ width: "100%" }} onClick={() => setPickerOpen(true)}>
          + Add exercise
        </button>

        <div className="spacer-24" />
        <button className="btn btn-filled" onClick={finishWorkout} disabled={finishing}>
          {finishing ? "Finishing…" : "Finish workout"}
        </button>
        <div className="spacer-12" />
        <button className="btn btn-plain" style={{ width: "100%" }} onClick={discardWorkout}>
          Discard workout
        </button>
      </div>

      {pickerOpen && (
        <div className="sheet-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Add exercise"
            onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            <div className="sheet-head">
              <p className="title-2">Exercises</p>
              <button className="btn btn-plain" onClick={() => setPickerOpen(false)}>Done</button>
            </div>
            <div className="field">
              <input
                className="input"
                placeholder="Search exercises"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            {filteredCatalog.length === 0 ? (
              <p className="footnote" style={{ padding: "12px 4px" }}>
                {catalog.length === 0 ? "No exercises found — run the seed data in supabase/schema.sql." : "No matches."}
              </p>
            ) : (
              filteredCatalog.map((e) => (
                <button key={e.id} className="exercise-option" onClick={() => addExercise(e.id)}>
                  <span>{e.name}</span>
                  <span className="muscle-tag">{e.muscle_group}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
