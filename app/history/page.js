"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isConfigured } from "../../lib/supabase";
import { thumbFor } from "../../lib/catalog";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

function minutesBetween(a, b) {
  if (!a || !b) return 0;
  return Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000));
}

function HistoryInner() {
  const router = useRouter();
  const params = useSearchParams();
  const focus = params.get("id");
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(focus);
  const [editing, setEditing] = useState(false);
  const [editSets, setEditSets] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setOpenId(focus); }, [focus]);

  const load = async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("workouts")
      .select("id, started_at, ended_at, template_id, sets(id, set_number, reps, weight, exercise_id, exercises(name, muscle_group))")
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(40);
    if (!error && data) setWorkouts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const open = useMemo(() => workouts.find((w) => w.id === openId) || null, [workouts, openId]);

  const startEdit = () => {
    const map = {};
    for (const s of open.sets ?? []) {
      map[s.id] = { reps: s.reps ?? 0, weight: s.weight ?? 0 };
    }
    setEditSets(map);
    setEditing(true);
  };

  const saveEdits = async () => {
    setSaving(true);
    for (const [setId, vals] of Object.entries(editSets)) {
      await supabase
        .from("sets")
        .update({ reps: Number(vals.reps) || 0, weight: Number(vals.weight) || 0 })
        .eq("id", setId);
    }
    setSaving(false);
    setEditing(false);
    await load();
  };

  const deleteWorkout = async () => {
    if (!confirm("Delete this workout? This can't be undone.")) return;
    await supabase.from("sets").delete().eq("workout_id", open.id);
    await supabase.from("workouts").delete().eq("id", open.id);
    setOpenId(null);
    router.replace("/history");
    await load();
  };

  if (open) {
    const groups = new Map();
    for (const s of [...(open.sets ?? [])].sort((a, b) => a.set_number - b.set_number)) {
      if (!groups.has(s.exercise_id)) {
        groups.set(s.exercise_id, { name: s.exercises?.name ?? "Exercise", sets: [] });
      }
      groups.get(s.exercise_id).sets.push(s);
    }
    const volume = (open.sets ?? []).reduce((sum, s) => sum + (s.reps ?? 0) * Number(s.weight ?? 0), 0);
    const mins = minutesBetween(open.started_at, open.ended_at);
    return (
      <section className="screen" data-screen="history-detail">
        <header className="subhead">
          <button type="button" aria-label="Back" onClick={() => { setOpenId(null); setEditing(false); router.replace("/history"); }}>
            <Icon name="back" />
          </button>
          <h1>Workout</h1>
          <span style={{ display: "flex", gap: 8 }}>
            {!editing ? (
              <>
                <button type="button" aria-label="Edit" onClick={startEdit} style={{ fontSize: 14, fontWeight: 600 }}>
                  Edit
                </button>
                <button type="button" aria-label="Delete" onClick={deleteWorkout} style={{ fontSize: 14, fontWeight: 600, color: "#d33" }}>
                  Delete
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setEditing(false)} style={{ fontSize: 14, fontWeight: 600 }} disabled={saving}>
                  Cancel
                </button>
                <button type="button" onClick={saveEdits} style={{ fontSize: 14, fontWeight: 700 }} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </>
            )}
          </span>
        </header>
        <div className="pad">
          <p className="note">
            {new Date(open.started_at).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            {" · "}{mins} min · {Math.round(volume).toLocaleString()} lb
          </p>
          {[...groups.values()].map((g) => (
            <div className="day-line" key={g.name}>
              <strong>{g.name}</strong>
              {!editing ? (
                <span>{g.sets.map((s) => `${s.weight} lb × ${s.reps}`).join("  ·  ")}</span>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {g.sets.map((s, idx) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, minWidth: 44 }}>Set {idx + 1}</span>
                      <input
                        type="number"
                        value={editSets[s.id]?.weight ?? ""}
                        onChange={(e) => setEditSets((m) => ({ ...m, [s.id]: { ...m[s.id], weight: e.target.value } }))}
                        placeholder="lb"
                        style={{ width: 70, padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
                      />
                      <span style={{ fontSize: 13 }}>lb ×</span>
                      <input
                        type="number"
                        value={editSets[s.id]?.reps ?? ""}
                        onChange={(e) => setEditSets((m) => ({ ...m, [s.id]: { ...m[s.id], reps: e.target.value } }))}
                        placeholder="reps"
                        style={{ width: 60, padding: "6px 8px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 }}
                      />
                      <span style={{ fontSize: 13 }}>reps</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {groups.size === 0 && <p className="empty">No sets were logged.</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="screen" data-screen="history">
      <ConfigBanner />
      <header className="page-head">
        <h1>Workout History</h1>
      </header>
      {loading ? (
        <p className="loading">Loading…</p>
      ) : workouts.length === 0 ? (
        <div className="empty"><p>No workouts yet</p></div>
      ) : (
        <div id="history-list">
          {workouts.map((w) => {
            const names = [];
            for (const s of w.sets ?? []) {
              const n = s.exercises?.name;
              if (n && !names.includes(n)) names.push(n);
            }
            const mins = minutesBetween(w.started_at, w.ended_at);
            const when = new Date(w.started_at);
            return (
              <div key={w.id}>
                <p className="date-label">{when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                <button className="ex-row" type="button" onClick={() => setOpenId(w.id)}>
                  <img className="thumb" src={thumbFor(names[0])} alt="" />
                  <span className="ex-copy">
                    <strong>{names[0] || "Workout"}</strong>
                    <small>{names.length} exercises · {mins} min</small>
                  </span>
                  <Icon name="chevron" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function History() {
  return (
    <Suspense fallback={<p className="loading">Loading…</p>}>
      <HistoryInner />
    </Suspense>
  );
}
