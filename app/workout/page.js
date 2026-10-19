"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, ACTIVE_WORKOUT_KEY, TEMPLATE_EXERCISES_KEY } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import { loadSplit, applySplit, buildSplit, PRESETS, PRESET_ORDER, DAY_NAMES } from "../../lib/presets";
import { muscleTagClass } from "../../lib/muscleColors";
import ConfigBanner from "../components/ConfigBanner";
import { DemoThumb } from "../components/ExerciseDemo";

/** Monday 00:00 of the week containing `d` (local time). */
function mondayOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
const todayIdx = () => (new Date().getDay() + 6) % 7;

function muscleChips(template) {
  const seen = [];
  for (const te of template?.template_exercises ?? []) {
    const m = te.exercises?.muscle_group;
    if (m && !seen.includes(m)) seen.push(m);
  }
  return seen;
}

export default function Workout() {
  const router = useRouter();
  const { user } = useAuth();
  const [split, setSplit] = useState(null);
  const [goal, setGoal] = useState(4);
  const [trainedDays, setTrainedDays] = useState(new Set());
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);

  // split editing
  const [editing, setEditing] = useState(false);
  const [draftDays, setDraftDays] = useState([]);
  const [switching, setSwitching] = useState(false);
  const [saving, setSaving] = useState(false);

  // template editor
  const [editor, setEditor] = useState(null); // {id, name, items:[{key, exercise_id, name, scheme}]}
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  // todayIdx in state: Next.js prerender rejects `new Date()` during render.
  const [ti, setTi] = useState(null);

  async function refresh() {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }
    const [s, { data: profile }, { data: workouts }, { data: exercises }] = await Promise.all([
      loadSplit(supabase, user.id),
      supabase.from("profiles").select("weekly_goal").eq("id", user.id).maybeSingle(),
      supabase.from("workouts").select("started_at").not("ended_at", "is", null),
      supabase.from("exercises").select("id, name, muscle_group").order("name"),
    ]);
    setSplit(s);
    if (profile?.weekly_goal) setGoal(profile.weekly_goal);
    if (exercises) setCatalog(exercises);
    const weekStart = mondayOf(new Date());
    const days = new Set();
    for (const w of workouts ?? []) {
      const d = new Date(w.started_at);
      if (d >= weekStart) days.add((d.getDay() + 6) % 7);
    }
    setTrainedDays(days);
    setLoading(false);
  }

  useEffect(() => {
    setTi(todayIdx());
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function startFromTemplate(tpl) {
    if (!user || starting) return;
    setStarting(tpl.id);
    const { data, error } = await supabase
      .from("workouts")
      .insert({ started_at: new Date().toISOString(), user_id: user.id, template_id: tpl.id })
      .select("id")
      .single();
    if (!error && data) {
      const exIds = (tpl.template_exercises ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((te) => te.exercises.id);
      if (exIds.length) localStorage.setItem(TEMPLATE_EXERCISES_KEY, JSON.stringify(exIds));
      localStorage.setItem(ACTIVE_WORKOUT_KEY, data.id);
      router.push("/session");
    }
    setStarting(null);
  }

  function beginEdit() {
    setDraftDays(split.days.map((d) => ({ ...d })));
    setEditing(true);
    setSwitching(false);
  }

  async function saveSplit() {
    setSaving(true);
    for (const d of draftDays) {
      await supabase
        .from("split_days")
        .update({ label: d.label, is_rest: d.is_rest, muscle_targets: d.is_rest ? "" : d.muscle_targets })
        .eq("id", d.id);
    }
    setSaving(false);
    setEditing(false);
    refresh();
  }

  async function switchPreset(key) {
    setSaving(true);
    const built = buildSplit(key);
    await applySplit(supabase, user.id, built);
    setSaving(false);
    setEditing(false);
    setSwitching(false);
    refresh();
  }

  function openEditor(tpl) {
    setEditor({
      id: tpl.id,
      name: tpl.name,
      items: (tpl.template_exercises ?? [])
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((te, i) => ({ key: `x${i}`, exercise_id: te.exercises.id, name: te.exercises.name, scheme: te.set_scheme })),
    });
    setQuery("");
  }

  async function newTemplate() {
    const { data, error } = await supabase
      .from("workout_templates")
      .insert({ user_id: user.id, name: "New workout" })
      .select("id, name")
      .single();
    if (!error && data) {
      setEditor({ id: data.id, name: data.name, items: [] });
      setQuery("");
    }
  }

  async function saveTemplate() {
    if (!editor) return;
    setSaving(true);
    const cleanName = editor.name.trim() || "Workout";
    await supabase.from("workout_templates").update({ name: cleanName }).eq("id", editor.id);
    await supabase.from("template_exercises").delete().eq("template_id", editor.id);
    let order = 0;
    for (const it of editor.items) {
      await supabase.from("template_exercises").insert({
        template_id: editor.id,
        exercise_id: it.exercise_id,
        set_scheme: it.scheme.trim(),
        sort_order: order++,
      });
    }
    setSaving(false);
    setEditor(null);
    refresh();
  }

  async function deleteTemplate() {
    if (!editor || !window.confirm(`Delete "${editor.name}"?`)) return;
    await supabase.from("workout_templates").delete().eq("id", editor.id);
    setEditor(null);
    refresh();
  }

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    const used = new Set((editor?.items ?? []).map((i) => i.exercise_id));
    return catalog.filter(
      (e) => !used.has(e.id) && (!q || e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q))
    );
  }, [catalog, query, editor]);

  if (loading) {
    return (
      <>
        <ConfigBanner />
        <p className="loading">Loading…</p>
      </>
    );
  }

  if (!split) {
    return (
      <>
        <ConfigBanner />
        <header className="screen-head">
          <h1 className="large-title">Workout</h1>
        </header>
        <div className="screen-body">
          <div className="card">
            <p className="kicker">NO SPLIT YET</p>
            <div className="spacer-8" />
            <p className="body">Set up your training split to get planned workouts with a single-tap Start.</p>
            <div className="spacer-16" />
            <button className="btn btn-filled" style={{ width: "100%" }} onClick={newTemplate}>
              + New workout
            </button>
          </div>
        </div>
      </>
    );
  }

  const doneCount = split.days.filter((d) => !d.is_rest && trainedDays.has(d.day_index)).length;
  const trainDays = split.days.filter((d) => !d.is_rest).length;
  const templates = split.days.map((d) => d.template).filter(Boolean);
  const progress = trainDays ? Math.min(100, Math.round((doneCount / trainDays) * 100)) : 0;

  return (
    <section className="screen" data-screen="templates">
      <ConfigBanner />
      <header className="page-head">
        <div className="quiz-head-row">
          <h1>My Split</h1>
          {!editing && (
            <button className="btn btn-plain" onClick={beginEdit}>Edit</button>
          )}
        </div>
        <p className="footnote">{doneCount}/{Math.max(trainDays, goal)} this week</p>
        <div className="spacer-8" />
        <div className="vol-bar"><div className="vol-fill" style={{ width: `${progress}%` }} /></div>
      </header>

      <div className="screen-body">
        {editing ? (
          <div className="card" style={{ padding: "6px 16px" }}>
            {!switching ? (
              <>
                {draftDays.map((d, i) => (
                  <div key={d.id} className="split-day-row">
                    <span className="split-day-name">{DAY_NAMES[d.day_index]}</span>
                    <input
                      className="input"
                      value={d.label}
                      onChange={(e) => setDraftDays((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                      style={{ flex: 1 }}
                    />
                    <button
                      className={`btn ${d.is_rest ? "btn-tinted" : "btn-gray"}`}
                      style={{ padding: "8px 12px", fontSize: 13 }}
                      onClick={() => setDraftDays((p) => p.map((x, j) => (j === i ? { ...x, is_rest: !x.is_rest } : x)))}
                    >
                      {d.is_rest ? "Rest" : "Train"}
                    </button>
                  </div>
                ))}
                <div className="spacer-12" />
                <div className="btn-row">
                  <button className="btn btn-filled" disabled={saving} onClick={saveSplit}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button className="btn btn-gray" onClick={() => setEditing(false)}>Cancel</button>
                </div>
                <div className="spacer-12" />
                <button className="btn btn-plain" style={{ width: "100%" }} onClick={() => setSwitching(true)}>
                  Switch to a different split
                </button>
                <div className="spacer-8" />
              </>
            ) : (
              <>
                {PRESET_ORDER.map((key) => (
                  <button key={key} className="choice-row" disabled={saving}
                    onClick={() => switchPreset(key)}>
                    <span className="headline">{PRESETS[key].name}</span>
                    <span className="footnote">{PRESETS[key].daysPerWeek} days/week · {PRESETS[key].blurb}</span>
                  </button>
                ))}
                <button className="btn btn-plain" style={{ width: "100%" }} onClick={() => setSwitching(false)}>
                  Back
                </button>
                <div className="spacer-8" />
              </>
            )}
          </div>
        ) : (
          <div>
            {split.days.map((d) => (
              <div key={d.id} className="split-day-row">
                <span className={`split-day-name${d.is_rest ? " is-rest" : ""}`}>{DAY_NAMES[d.day_index]}</span>
                <div className="split-day-info">
                  <p className="headline">{d.label}</p>
                  {!d.is_rest && d.muscle_targets && <p className="footnote">{d.muscle_targets}</p>}
                </div>
                {!d.is_rest && trainedDays.has(d.day_index) && <span className="split-check">✓</span>}
                {d.day_index === ti && <span className="today-pill">TODAY</span>}
              </div>
            ))}
          </div>
        )}

        {/* Workout templates */}
        <div className="spacer-24" />
        <div className="quiz-head-row">
          <h2 className="section-title" style={{ margin: 0 }}>Workouts</h2>
          <button className="btn btn-gray" style={{ padding: "8px 14px", fontSize: 14 }} onClick={newTemplate}>
            + New
          </button>
        </div>
        <div className="spacer-12" />
        {templates.map((t) => (
          <div key={t.id} className="template-card">
            <div className="template-head">
              <h3>{t.name}</h3>
              <button className="btn btn-plain" type="button" onClick={() => openEditor(t)}>Edit</button>
            </div>
            <p className="footnote">
              {(t.template_exercises ?? []).length} exercises
              {t.est_minutes ? ` · ~${t.est_minutes} min` : ""}
              {muscleChips(t).length ? ` · ${muscleChips(t).join(" · ")}` : ""}
            </p>
            {(t.template_exercises ?? [])
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((te) => (
                <div key={te.exercises.id} className="template-ex-row">
                  <span className="body">{te.exercises.name}</span>
                  <span className="scheme">{te.set_scheme}</span>
                </div>
              ))}
            <div className="spacer-12" />
            <button className="btn btn-filled" style={{ width: "100%" }}
              disabled={starting === t.id}
              onClick={() => startFromTemplate(t)}>
              {starting === t.id ? "Starting…" : "Start"}
            </button>
          </div>
        ))}
      </div>

      {/* Template editor sheet (picker is a view inside, not a second overlay) */}
      {editor && (
        <div className="sheet-backdrop" onClick={() => { setEditor(null); setPickerOpen(false); setQuery(""); }}>
          <div className="sheet-light" role="dialog" aria-modal="true" aria-label="Edit workout"
            onClick={(e) => e.stopPropagation()}>
            <div className="grabber" />
            {!pickerOpen ? (
              <>
                <div className="sheet-head">
                  <p className="title-2">Edit workout</p>
                  <button className="btn btn-plain" onClick={() => setEditor(null)}>Done</button>
                </div>
                <div className="field">
                  <label htmlFor="tpl-name">Name</label>
                  <input
                    id="tpl-name"
                    className="input"
                    value={editor.name}
                    onChange={(e) => setEditor((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                {editor.items.map((it, i) => (
                  <div key={it.key} className="set-row" style={{ marginBottom: 8 }}>
                    <span className="body" style={{ flex: 1 }}>{it.name}</span>
                    <input
                      className="input"
                      style={{ width: 90 }}
                      value={it.scheme}
                      placeholder="3x8-12"
                      aria-label={`Set scheme for ${it.name}`}
                      onChange={(e) =>
                        setEditor((p) => ({ ...p, items: p.items.map((x, j) => (j === i ? { ...x, scheme: e.target.value } : x)) }))
                      }
                    />
                    <button
                      className="icon-btn"
                      aria-label={`Remove ${it.name}`}
                      onClick={() => setEditor((p) => ({ ...p, items: p.items.filter((_, j) => j !== i) }))}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="spacer-8" />
                <button className="btn btn-gray" style={{ width: "100%" }} onClick={() => { setQuery(""); setPickerOpen(true); }}>
                  + Add exercise
                </button>
                <div className="spacer-12" />
                <button className="btn btn-filled" style={{ width: "100%" }} disabled={saving} onClick={saveTemplate}>
                  {saving ? "Saving…" : "Save workout"}
                </button>
                <div className="spacer-12" />
                <button className="btn btn-bad" style={{ width: "100%" }} onClick={deleteTemplate}>
                  Delete workout
                </button>
              </>
            ) : (
              <>
                <div className="sheet-head">
                  <p className="title-2">Add exercise</p>
                  <button className="btn btn-plain" onClick={() => { setPickerOpen(false); setQuery(""); }}>Back</button>
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
                <div className="grouped-list">
                  {filteredCatalog.map((e) => (
                    <button
                      key={e.id}
                      className="grouped-row"
                      onClick={() => {
                        setEditor((p) => ({
                          ...p,
                          items: [...p.items, { key: `n${Date.now()}`, exercise_id: e.id, name: e.name, scheme: "3x8-12" }],
                        }));
                        setPickerOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="grouped-row-thumb">
                        <DemoThumb name={e.name} />
                        <span className="grouped-row-title">{e.name}</span>
                      </span>
                      <span className={`muscle-tag ${muscleTagClass(e.muscle_group)}`}>{e.muscle_group}</span>
                    </button>
                  ))}
                  {filteredCatalog.length === 0 && (
                    <p className="footnote" style={{ textAlign: "center", padding: 16 }}>No exercises found</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
