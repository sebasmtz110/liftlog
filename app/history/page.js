"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase, isConfigured } from "../../lib/supabase";
import { thumbFor } from "../../lib/catalog";
import { volumeOf } from "../../lib/volume";
import ConfigBanner from "../components/ConfigBanner";

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
    const supabase = await getSupabase();
    if (!supabase) {
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
    const supabase = await getSupabase();
    if (supabase) {
      for (const [setId, vals] of Object.entries(editSets)) {
        await supabase
          .from("sets")
          .update({ reps: Number(vals.reps) || 0, weight: Number(vals.weight) || 0 })
          .eq("id", setId);
      }
    }
    setSaving(false);
    setEditing(false);
    await load();
  };

  const deleteWorkout = async () => {
    if (!confirm("Delete this workout? This can't be undone.")) return;
    const supabase = await getSupabase();
    if (!supabase) return;
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
        groups.set(s.exercise_id, { name: s.exercises?.name ?? "Exercise", muscle: s.exercises?.muscle_group ?? "", sets: [] });
      }
      groups.get(s.exercise_id).sets.push(s);
    }
    const volume = volumeOf(open.sets);
    const mins = minutesBetween(open.started_at, open.ended_at);
    const totalSets = (open.sets ?? []).length;
    const when = new Date(open.started_at);
    const dateStr = when.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    return (
      <section className="page">
        <div className="title-row">
          <div>
            <h1>{dateStr}</h1>
            <p className="lede">{mins} min · {Math.round(volume).toLocaleString()} lb · {totalSets} {totalSets === 1 ? "set" : "sets"}</p>
          </div>
          <div className="title-actions">
            <button className="btn btn-line" type="button" onClick={() => { setOpenId(null); setEditing(false); router.replace("/history"); }}>Back</button>
            {!editing ? (
              <button className="btn btn-line" type="button" onClick={startEdit}>Edit</button>
            ) : (
              <button className="btn btn-primary" type="button" onClick={saveEdits} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            )}
          </div>
        </div>
        {[...groups.values()].map((g) => (
          <section key={g.name} className="panel" style={{ marginTop: 12 }}>
            <div className="panel-head">
              <h2>{g.name}</h2>
              <span className="note">{g.muscle}</span>
            </div>
            {g.sets.map((s, idx) => editing ? (
              <div key={s.id} className="lift">
                <span className="scheme">Set {idx + 1}</span>
                <input className="input" style={{ width: 90 }} type="number" aria-label={`Weight for set ${idx + 1}`} value={editSets[s.id]?.weight ?? ""} onChange={(e) => setEditSets((m) => ({ ...m, [s.id]: { ...m[s.id], weight: e.target.value } }))} />
                <span className="note">lb</span>
                <input className="input" style={{ width: 80 }} type="number" aria-label={`Reps for set ${idx + 1}`} value={editSets[s.id]?.reps ?? ""} onChange={(e) => setEditSets((m) => ({ ...m, [s.id]: { ...m[s.id], reps: e.target.value } }))} />
                <span className="note">reps</span>
              </div>
            ) : (
              <div key={s.id} className="lift">
                <span className="lift-copy"><strong>Set {idx + 1}</strong></span>
                <span className="scheme num">{s.weight} lb × {s.reps}</span>
              </div>
            ))}
          </section>
        ))}
        {groups.size === 0 && <p className="empty">No sets were logged.</p>}
        {!editing && <button className="btn btn-bad" type="button" style={{ marginTop: 16 }} onClick={deleteWorkout}>Delete session</button>}
      </section>
    );
  }

  return (
    <section className="page">
      <ConfigBanner />
      <h1>History</h1>
      <p className="lede">Finished sessions, newest first.</p>
      {loading ? <p className="loading">Loading…</p> : workouts.length === 0 ? (
        <p className="empty">No finished sessions yet.</p>
      ) : (
        <section className="panel" style={{ marginTop: 16 }}>
          {workouts.map((w) => {
            const names = [];
            for (const s of w.sets ?? []) {
              const n = s.exercises?.name;
              if (n && !names.includes(n)) names.push(n);
            }
            const mins = minutesBetween(w.started_at, w.ended_at);
            const vol = volumeOf(w.sets);
            const when = new Date(w.started_at);
            return (
              <button key={w.id} className="row-link" type="button" onClick={() => { setOpenId(w.id); router.replace(`/history?id=${w.id}`); }}>
                <img src={thumbFor(names[0])} alt="" />
                <span className="row-copy">
                  <strong>{names[0] || "Session"}{names.length > 1 ? ` +${names.length - 1}` : ""}</strong>
                  <small>{when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {mins} min</small>
                </span>
                <span className="scheme num">{Math.round(vol).toLocaleString()} lb</span>
              </button>
            );
          })}
        </section>
      )}
    </section>
  );
}

export default function History() {
  return (
    <Suspense fallback={<section className="page"><p className="loading">Loading…</p></section>}>
      <HistoryInner />
    </Suspense>
  );
}
