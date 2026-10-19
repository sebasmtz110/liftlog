"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, isConfigured } from "../../lib/supabase";
import { hasDemo } from "../../lib/exerciseDemos";
import { visualForExercise } from "../../lib/exerciseVisuals";
import { DemoThumb, GuideSheet } from "../components/ExerciseDemo";
import ConfigBanner from "../components/ConfigBanner";

/**
 * Exercise library: browse the catalog, add custom exercises,
 * edit them, and delete unused ones. Pre-made exercises show their
 * V7 3D animation preview where one exists (tap for a larger demo).
 * Custom exercises have no animation clip.
 */
export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // exercise object or null for "add"
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [saving, setSaving] = useState(false);
  const [guideEx, setGuideEx] = useState(null);
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // exercise id

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    refresh();
  }, []);

  async function refresh() {
    const { data } = await supabase
      .from("exercises")
      .select("id, name, muscle_group")
      .order("name");
    if (data) setExercises(data);
    setLoading(false);
  }

  const muscleGroups = useMemo(
    () => [...new Set(exercises.map((e) => e.muscle_group).filter(Boolean))].sort(),
    [exercises]
  );

  function openAdd() {
    setEditing(null);
    setName("");
    setMuscleGroup("");
    setNotice("");
    setFormOpen(true);
  }

  function openEdit(ex) {
    setEditing(ex);
    setName(ex.name);
    setMuscleGroup(ex.muscle_group);
    setNotice("");
    setFormOpen(true);
  }

  async function saveExercise() {
    const cleanName = name.trim();
    const cleanGroup = muscleGroup.trim();
    if (!cleanName || !cleanGroup) {
      setNotice("Give the exercise a name and a muscle group.");
      return;
    }
    setSaving(true);
    let error;
    if (editing) {
      ({ error } = await supabase
        .from("exercises")
        .update({ name: cleanName, muscle_group: cleanGroup })
        .eq("id", editing.id));
    } else {
      ({ error } = await supabase
        .from("exercises")
        .insert({ name: cleanName, muscle_group: cleanGroup }));
    }
    setSaving(false);
    if (error) {
      setNotice("Couldn't save that exercise — try again.");
      return;
    }
    setFormOpen(false);
    await refresh();
  }

  async function deleteExercise(ex) {
    setNotice("");
    const { error } = await supabase.from("exercises").delete().eq("id", ex.id);
    setConfirmDelete(null);
    if (error) {
      // FK restrict: sets reference this exercise.
      setNotice(
        `Can't delete "${ex.name}" — it has logged sets. Exercises with history stay in the library.`
      );
      return;
    }
    await refresh();
  }

  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <p className="kicker">BUILD A STRONGER YOU</p>
        <h1 className="large-title" style={{ fontSize: 40, lineHeight: "48px" }}>Exercise<br />Library</h1>
      </header>

      <div className="screen-body">
        <button className="btn btn-filled" style={{ width: "100%" }} onClick={openAdd}>
          + Add exercise
        </button>
        <div className="spacer-16" />

        {notice && (
          <>
            <div className="notice">
              <p className="body">{notice}</p>
            </div>
            <div className="spacer-12" />
          </>
        )}

        {loading ? (
          <p className="loading">Loading…</p>
        ) : exercises.length === 0 ? (
          <div className="card">
            <p className="body">No exercises yet.</p>
            <div className="spacer-8" />
            <p className="footnote">Tap + Add exercise to build your library.</p>
          </div>
        ) : (
          <div className="grouped-list">
            {exercises.map((e) => (
              <div className="grouped-row" key={e.id}>
                {(() => {
                  const photo = visualForExercise(e.name) || "/exercise-visuals/bench-press.jpg";
                  return (
                    <button
                      className="demo-thumb-btn"
                      onClick={() => setGuideEx(e)}
                      aria-label={`${e.name} details`}
                    >
                      <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </button>
                  );
                })()}
                <button
                  className="grouped-row-main"
                  style={{ textAlign: "left" }}
                  onClick={() => setGuideEx(e)}
                  aria-label={`${e.name} details`}
                >
                  <span className="grouped-row-title">{e.name}</span>
                  <div className="spacer-4" />
                  <span className="muscle-tag">{e.muscle_group}</span>
                </button>
                <div className="grouped-row-actions">
                  <button
                    className="icon-btn"
                    aria-label={`Edit ${e.name}`}
                    onClick={() => openEdit(e)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4.2 1.2L5 15Z" />
                    </svg>
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`Delete ${e.name}`}
                    onClick={() => setConfirmDelete(e.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                      strokeLinecap="round" aria-hidden="true">
                      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13h8l1-13" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <div className="sheet-backdrop" onClick={() => setFormOpen(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={editing ? "Edit exercise" : "Add exercise"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grabber" />
            <div className="sheet-head">
              <p className="title-2">{editing ? "Edit exercise" : "Add exercise"}</p>
              <button className="btn btn-plain" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
            </div>
            {notice && (
              <>
                <div className="notice">
                  <p className="body">{notice}</p>
                </div>
                <div className="spacer-12" />
              </>
            )}
            <div className="field">
              <label htmlFor="ex-name">Name</label>
              <input
                id="ex-name"
                className="input"
                placeholder="e.g. Incline Dumbbell Press"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="ex-muscle">Muscle group</label>
              <input
                id="ex-muscle"
                className="input"
                placeholder="e.g. Chest"
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                list="muscle-group-suggestions"
              />
              <datalist id="muscle-group-suggestions">
                {muscleGroups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div className="spacer-8" />
            <button
              className="btn btn-filled"
              style={{ width: "100%" }}
              onClick={saveExercise}
              disabled={saving}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Add exercise"}
            </button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="sheet-backdrop" onClick={() => setConfirmDelete(null)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Delete exercise"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grabber" />
            <p className="title-2">Delete this exercise?</p>
            <div className="spacer-8" />
            <p className="body">
              {exercises.find((e) => e.id === confirmDelete)?.name}{" "}will be removed
              from your library.
            </p>
            <div className="spacer-16" />
            <button
              className="btn btn-bad"
              onClick={() =>
                deleteExercise(exercises.find((e) => e.id === confirmDelete))
              }
            >
              Delete
            </button>
            <div className="spacer-12" />
            <button
              className="btn btn-plain"
              style={{ width: "100%" }}
              onClick={() => setConfirmDelete(null)}
            >
              Keep it
            </button>
          </div>
        </div>
      )}

      {guideEx && (
        <GuideSheet
          name={guideEx.name}
          muscleGroup={guideEx.muscle_group}
          onClose={() => setGuideEx(null)}
          onEdit={() => {
            openEdit(guideEx);
            setGuideEx(null);
          }}
          onDelete={() => {
            setConfirmDelete(guideEx.id);
            setGuideEx(null);
          }}
        />
      )}
    </>
  );
}
