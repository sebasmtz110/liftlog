"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import { loadSplit, applySplit, buildSplit, PRESETS, PRESET_ORDER, DAY_NAMES } from "../../lib/presets";
import { ensureCatalog, thumbFor } from "../../lib/catalog";
import { BUILTIN_ROUTINES, resolveNames, routineLabel } from "../../lib/routines";
import { loadDayPlans, saveDayPlan } from "../../lib/dayPlans";
import { startSession } from "../../lib/startSession";
import { volumeOf } from "../../lib/volume";
import ConfigBanner from "../components/ConfigBanner";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function mondayOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function localIso(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function setLine(name, sets) {
  if (!sets?.length) return "No sets yet";
  const top = [...sets].sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0))[0];
  const count = `${sets.length} ${sets.length === 1 ? "set" : "sets"}`;
  if (!(Number(top.weight) > 0)) return `${count} · ${top.reps} reps`;
  return `${count} · ${Number(top.weight)}×${top.reps}`;
}

export default function Workout() {
  return (
    <Suspense fallback={<section className="page"><p className="loading">Loading…</p></section>}>
      <WorkoutInner />
    </Suspense>
  );
}

function WorkoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const [split, setSplit] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [idByName, setIdByName] = useState({});
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(null);
  const [tab, setTab] = useState(params.get("tab") === "routines" ? "routines" : params.get("tab") === "recent" ? "recent" : "week");
  const [selected, setSelected] = useState("");
  const [plans, setPlans] = useState({});
  const [routineKey, setRoutineKey] = useState("push-a");
  const [editing, setEditing] = useState(false);
  const [draftDays, setDraftDays] = useState([]);
  const [switching, setSwitching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState("");

  async function refresh() {
    if (!user || !isConfigured) {
      setLoading(false);
      return;
    }
    const supabase = await getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const [s, rows, { data: sessions }] = await Promise.all([
      loadSplit(supabase, user.id),
      ensureCatalog(supabase),
      supabase
        .from("workouts")
        .select("id, started_at, ended_at, sets(reps, weight, exercises(id, name))")
        .not("ended_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(80),
    ]);
    setSplit(s);
    const map = {};
    for (const row of rows || []) map[row.name.toLowerCase()] = row.id;
    setIdByName(map);
    setCatalog(rows || []);
    setWorkouts(sessions ?? []);
    setPlans(loadDayPlans(user.id));
    setLoading(false);
  }

  const dayParam = params.get("day");
  useEffect(() => {
    // Open on today unless a specific day was linked to. Kept apart from the
    // data effect so an auth refresh can never move the day mid-browse.
    setSelected(dayParam || localIso(new Date()));
  }, [dayParam]);

  useEffect(() => {
    const clock = new Date();
    setNow(clock);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const routines = useMemo(() => {
    const builtins = BUILTIN_ROUTINES.map((routine) => ({
      ...routine,
      exerciseIds: resolveNames(routine.names, idByName),
      templateId: null,
    })).filter((routine) => routine.exerciseIds.length);
    const saved = [];
    for (const day of split?.days ?? []) {
      const tpl = day.template;
      if (!tpl || saved.some((item) => item.templateId === tpl.id)) continue;
      saved.push({
        key: `tpl:${tpl.id}`,
        name: tpl.name,
        detail: tpl.name,
        focus: day.muscle_targets || "Saved split",
        exerciseIds: (tpl.template_exercises ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map((te) => te.exercises?.id).filter(Boolean),
        templateId: tpl.id,
        names: (tpl.template_exercises ?? []).map((te) => te.exercises?.name),
      });
    }
    return [...builtins, ...saved];
  }, [idByName, split]);

  const nameById = useMemo(() => {
    const map = new Map();
    for (const row of catalog) map.set(row.id, row.name);
    return map;
  }, [catalog]);

  const lastSets = useMemo(() => {
    const map = new Map();
    for (const w of workouts) {
      const grouped = new Map();
      for (const set of w.sets ?? []) {
        const id = set.exercises?.id;
        if (!id) continue;
        if (!grouped.has(id)) grouped.set(id, []);
        grouped.get(id).push(set);
      }
      for (const [id, sets] of grouped) {
        if (!map.has(id)) map.set(id, sets);
      }
    }
    return map;
  }, [workouts]);

  const days = useMemo(() => {
    if (!now) return [];
    const start = mondayOf(now);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const iso = localIso(date);
      const splitDay = split?.days?.find((d) => d.day_index === i) || null;
      const logged = workouts.find((w) => localIso(w.started_at) === iso) || null;
      return { iso, date, dow: DOW[i], day: date.getDate(), index: i, splitDay, logged, today: iso === localIso(now) };
    });
  }, [now, split, workouts]);

  const day = days.find((d) => d.iso === selected) || days.find((d) => d.today) || days[0];

  function planFor(entry) {
    if (!entry) return null;
    if (plans[entry.iso]) return plans[entry.iso];
    if (!entry.splitDay || entry.splitDay.is_rest || !entry.splitDay.template) return null;
    const tpl = entry.splitDay.template;
    const match = routines.find((r) => r.templateId === tpl.id) || routines.find((r) => r.name === tpl.name);
    return {
      routineKey: match?.key || `tpl:${tpl.id}`,
      label: tpl.name,
      focus: entry.splitDay.muscle_targets || "",
      exerciseIds: (tpl.template_exercises ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map((te) => te.exercises?.id).filter(Boolean),
      templateId: tpl.id,
    };
  }

  function assign(entry, routine) {
    const next = saveDayPlan(user.id, entry.iso, {
      routineKey: routine.key,
      label: routine.name,
      focus: routine.focus,
      exerciseIds: routine.exerciseIds.slice(),
      templateId: routine.templateId,
    });
    setPlans(next);
  }

  async function begin(plan) {
    if (!user || starting || !plan?.exerciseIds?.length) return;
    setStarting(true);
    setActionError("");
    const supabase = await getSupabase();
    const id = supabase ? await startSession(supabase, user, { templateId: plan.templateId, exerciseIds: plan.exerciseIds }) : null;
    setStarting(false);
    if (id) router.push("/session");
    else setActionError("That workout didn't start. Try again.");
  }

  function beginEdit() {
    setDraftDays(split.days.map((d) => ({ ...d })));
    setEditing(true);
    setSwitching(false);
  }

  async function saveSplit() {
    setSaving(true);
    setActionError("");
    const supabase = await getSupabase();
    if (!supabase) {
      setSaving(false);
      setActionError("That didn't save. Try again.");
      return;
    }
    for (const d of draftDays) {
      const { error } = await supabase.from("split_days").update({
        label: d.label,
        is_rest: d.is_rest,
        muscle_targets: d.is_rest ? "" : d.muscle_targets,
      }).eq("id", d.id);
      if (error) {
        setSaving(false);
        setActionError("That didn't save. Try again.");
        return;
      }
    }
    setSaving(false);
    setEditing(false);
    refresh();
  }

  async function switchPreset(key) {
    setSaving(true);
    setActionError("");
    try {
      const built = buildSplit(key);
      const supabase = await getSupabase();
      if (!supabase) throw new Error("no-client");
      await applySplit(supabase, user.id, built);
      setEditing(false);
      setSwitching(false);
      refresh();
    } catch {
      setActionError("That didn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function openEditor(tpl) {
    setEditor({
      id: tpl.id,
      name: tpl.name,
      items: (tpl.template_exercises ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).flatMap((te, i) => {
        if (!te.exercises?.id) return [];
        return [{
          key: `x${i}`,
          exercise_id: te.exercises.id,
          name: te.exercises.name,
          scheme: te.set_scheme,
        }];
      }),
    });
  }

  async function saveTemplate() {
    if (!editor) return;
    setSaving(true);
    setActionError("");
    const supabase = await getSupabase();
    if (!supabase) {
      setSaving(false);
      setActionError("That didn't save. Try again.");
      return;
    }
    const { data: oldRows, error: readErr } = await supabase.from("template_exercises").select("id").eq("template_id", editor.id);
    if (readErr) {
      setSaving(false);
      setActionError("That didn't save. Try again.");
      return;
    }
    const { error: nameErr } = await supabase.from("workout_templates").update({ name: editor.name.trim() || "Workout" }).eq("id", editor.id);
    if (nameErr) {
      setSaving(false);
      setActionError("That didn't save. Try again.");
      return;
    }
    let order = 0;
    for (const it of editor.items) {
      const { error } = await supabase.from("template_exercises").insert({
        template_id: editor.id,
        exercise_id: it.exercise_id,
        set_scheme: it.scheme.trim(),
        sort_order: order++,
      });
      if (error) {
        setSaving(false);
        setActionError("That didn't save. Try again.");
        refresh();
        return;
      }
    }
    if (oldRows?.length) {
      const { error } = await supabase.from("template_exercises").delete().in("id", oldRows.map((row) => row.id));
      if (error) {
        setSaving(false);
        setActionError("That didn't save. Try again.");
        refresh();
        return;
      }
    }
    setSaving(false);
    setEditor(null);
    refresh();
  }

  const filteredCatalog = catalog.filter((e) => {
    const q = query.trim().toLowerCase();
    const used = new Set((editor?.items ?? []).map((i) => i.exercise_id));
    return !used.has(e.id) && (!q || e.name.toLowerCase().includes(q));
  });

  if (loading || !now) {
    return <section className="page"><ConfigBanner /><p className="loading">Loading…</p></section>;
  }

  if (!split) {
    return (
      <section className="page">
        <ConfigBanner />
        <h1>Workouts</h1>
        <p className="lede">No split is saved. Pick one and the week fills in.</p>
        {actionError ? <p className="err" role="alert">{actionError}</p> : null}
        <div className="panel" style={{ marginTop: 16 }}>
          {PRESET_ORDER.map((key) => (
            <button key={key} className="choice" type="button" disabled={saving} onClick={() => switchPreset(key)}>
              <span className="lift-copy">
                <strong>{PRESETS[key].name}</strong>
                <small>{PRESETS[key].daysPerWeek} days a week. {PRESETS[key].blurb}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  const current = routines.find((r) => r.key === routineKey) || routines[0];
  const activePlan = day ? planFor(day) : null;
  const nextUp = (() => {
    if (!day || day.logged || activePlan) return null;
    for (let k = 1; k <= 7; k += 1) {
      const entry = days[(day.index + k) % 7];
      if (!entry?.splitDay || entry.splitDay.is_rest) continue;
      const plan = planFor(entry);
      return { entry, label: plan?.label || entry.splitDay.label, nextWeek: day.index + k >= 7 };
    }
    return null;
  })();

  function rows(ids, { swapDate, performed }) {
    const byId = new Map();
    for (const set of performed ?? []) {
      const id = set.exercises?.id;
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push(set);
    }
    return ids.map((id, index) => {
      const name = nameById.get(id) || "Exercise";
      const sets = byId.get(id) || (!performed ? lastSets.get(id) : null);
      return (
        <div className="move" key={`${id}-${index}`}>
          <button type="button" className="move-open" onClick={() => router.push(`/exercises?open=${encodeURIComponent(name)}`)}>
            <img src={thumbFor(name)} alt="" />
            <span>
              <span className="name">{name}</span>
              <span className="sets">{setLine(name, sets)}</span>
            </span>
          </button>
          {swapDate ? (
            <button type="button" className="swap" onClick={() => {
              if (!plans[swapDate]) {
                const entry = days.find((d) => d.iso === swapDate);
                const plan = planFor(entry);
                if (plan && user) saveDayPlan(user.id, swapDate, plan);
              }
              router.push(`/exercises?swap=${swapDate}&index=${index}`);
            }}>Switch</button>
          ) : null}
        </div>
      );
    });
  }

  return (
    <section className="page">
      <ConfigBanner />
      <div className="title-row">
        <h1>Workouts</h1>
        <button className="text-btn" type="button" onClick={beginEdit}>Edit split</button>
      </div>
      {actionError ? <p className="err" role="alert">{actionError}</p> : null}
      <div className="seg" role="tablist">
        {[["week", "This week"], ["routines", "Routines"], ["recent", "Recent"]].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {editing && (
        <section className="panel" style={{ marginTop: 16 }}>
          {!switching ? (
            <>
              {draftDays.map((d, i) => (
                <div key={d.id} className="lift">
                  <strong style={{ width: 40 }}>{DAY_NAMES[d.day_index]}</strong>
                  <input className="input" aria-label={`${DAY_NAMES[d.day_index]} label`} value={d.label} onChange={(e) => setDraftDays((prev) => prev.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <button className="btn btn-line" type="button" onClick={() => setDraftDays((prev) => prev.map((x, j) => (j === i ? { ...x, is_rest: !x.is_rest } : x)))}>{d.is_rest ? "Rest" : "Train"}</button>
                </div>
              ))}
              <div className="title-actions" style={{ marginTop: 12 }}>
                <button className="btn btn-primary" type="button" disabled={saving} onClick={saveSplit}>{saving ? "Saving…" : "Save days"}</button>
                <button className="btn btn-line" type="button" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-quiet" type="button" onClick={() => setSwitching(true)}>Switch preset</button>
              </div>
            </>
          ) : (
            <>
              {PRESET_ORDER.map((key) => (
                <button key={key} className="choice" type="button" disabled={saving} onClick={() => switchPreset(key)}>
                  <span className="lift-copy"><strong>{PRESETS[key].name}</strong><small>{PRESETS[key].blurb}</small></span>
                </button>
              ))}
              <button className="btn btn-quiet" type="button" onClick={() => setSwitching(false)}>Back</button>
            </>
          )}
        </section>
      )}

      {tab === "week" && day && (
        <>
          <div className="switch" role="group" aria-label="Days">
            {days.map((entry) => (
              <button
                key={entry.iso}
                type="button"
                aria-pressed={entry.iso === day.iso}
                data-rest={entry.splitDay?.is_rest && !plans[entry.iso] ? "true" : "false"}
                data-done={entry.logged ? "true" : "false"}
                onClick={() => setSelected(entry.iso)}
              >
                <span>{entry.dow}</span>
                <span className="date num">{entry.day}</span>
              </button>
            ))}
          </div>
          {day.logged ? (
            <>
              <h2 className="day-title">{day.logged.sets?.[0]?.exercises?.name ? sessionTitle(day.logged) : "Session"}</h2>
              <p className="day-sub">{day.today ? "Today" : `${day.dow} ${day.day}`} · <span className="num">{Math.round(volumeOf(day.logged.sets)).toLocaleString()} lb</span></p>
              <div className="moves">{rows(uniqueExerciseIds(day.logged), { performed: day.logged.sets })}</div>
              <button className="block-btn" type="button" onClick={() => router.push(`/history?id=${day.logged.id}`)}>View workout</button>
            </>
          ) : (
            <>
              <div className="picks">
                {routines.map((routine) => (
                  <button key={routine.key} type="button" aria-pressed={activePlan?.routineKey === routine.key} onClick={() => assign(day, routine)}>{routineLabel(routine)}</button>
                ))}
              </div>
              {activePlan ? (
                <>
                  <h2 className="day-title">{activePlan.label}</h2>
                  <p className="day-sub">{day.today ? "Today" : `${day.dow} ${day.day}`} · {activePlan.exerciseIds.length} exercises · {activePlan.focus}</p>
                  <div className="moves">{rows(activePlan.exerciseIds, { swapDate: day.iso })}</div>
                  <button className="block-btn" type="button" disabled={starting} onClick={() => begin(activePlan)}>{starting ? "Starting…" : "Start workout"}</button>
                </>
              ) : (
                <>
                  <h2 className="day-title">{nextUp ? nextUp.label : "Rest day"}</h2>
                  <p className="day-sub">
                    {day.today ? "Today" : `${day.dow} ${day.day}`} · Rest day in your split
                    {nextUp ? <> · Next: {nextUp.label} — {nextUp.nextWeek ? `next ${nextUp.entry.dow}` : `${nextUp.entry.dow} ${nextUp.entry.day}`}</> : ""}
                    . Pick a workout above to train anyway.
                  </p>
                </>
              )}
            </>
          )}
        </>
      )}

      {tab === "routines" && current && (
        <>
          <div className="picks">
            {routines.map((routine) => (
              <button key={routine.key} type="button" aria-pressed={routine.key === current.key} onClick={() => setRoutineKey(routine.key)}>{routineLabel(routine)}</button>
            ))}
          </div>
          <h2 className="day-title">{current.name}</h2>
          <p className="day-sub">{current.detail} · {current.focus}</p>
          <div className="moves">{rows(current.exerciseIds, {})}</div>
          <button className="block-btn" type="button" disabled={starting} onClick={() => begin(current)}>{starting ? "Starting…" : "Start workout"}</button>
          <button className="text-btn" type="button" style={{ marginTop: 12 }} onClick={() => {
            const tpl = split.days.map((d) => d.template).find((t) => t?.id === current.templateId);
            if (tpl) openEditor(tpl);
          }}>{current.templateId ? "Edit this saved routine" : ""}</button>
        </>
      )}

      {tab === "recent" && (
        <div>
          {workouts.length === 0 ? <p className="empty">No finished sessions yet.</p> : workouts.map((w, i) => {
            const when = new Date(w.started_at);
            const month = when.toLocaleDateString(undefined, { month: "long", year: "numeric" });
            const prev = i > 0 ? new Date(workouts[i - 1].started_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "";
            return (
              <div key={w.id}>
                {month !== prev ? <h2 className="work-month">{month}</h2> : null}
                <button className="log" type="button" data-latest={i === 0 ? "true" : "false"} onClick={() => router.push(`/history?id=${w.id}`)}>
                  <span className="log-name">{sessionTitle(w)}</span>
                  <span className="log-vol num">{Math.round(volumeOf(w.sets)).toLocaleString()} lb</span>
                  <span className="log-meta">{when.toLocaleDateString(undefined, { weekday: "long", day: "numeric" })} · {(w.sets ?? []).length} {(w.sets ?? []).length === 1 ? "set" : "sets"}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editor && (
        <div className="sheet">
          <button className="sheet-scrim" type="button" aria-label="Close" onClick={() => setEditor(null)} />
          <div className="sheet-card" role="dialog" aria-modal="true" aria-label="Edit session">
            {!pickerOpen ? (
              <>
                <header><h2>Edit session</h2><button className="text-btn" type="button" onClick={() => setEditor(null)}>Done</button></header>
                <label className="field"><span>Name</span><input className="input" value={editor.name} onChange={(e) => setEditor((prev) => ({ ...prev, name: e.target.value }))} /></label>
                {editor.items.map((it, i) => (
                  <div key={it.key} className="lift">
                    <span className="lift-copy"><strong>{it.name}</strong></span>
                    <input className="input" style={{ width: 110 }} value={it.scheme} aria-label={`Set scheme for ${it.name}`} onChange={(e) => setEditor((prev) => ({ ...prev, items: prev.items.map((x, j) => (j === i ? { ...x, scheme: e.target.value } : x)) }))} />
                    <button className="btn btn-quiet" type="button" onClick={() => setEditor((prev) => ({ ...prev, items: prev.items.filter((_, j) => j !== i) }))}>Remove</button>
                  </div>
                ))}
                <div className="title-actions" style={{ marginTop: 12 }}>
                  <button className="btn btn-line" type="button" onClick={() => setPickerOpen(true)}>Add exercise</button>
                  <button className="btn btn-primary" type="button" disabled={saving} onClick={saveTemplate}>{saving ? "Saving…" : "Save session"}</button>
                </div>
              </>
            ) : (
              <>
                <header><h2>Add exercise</h2><button className="text-btn" type="button" onClick={() => setPickerOpen(false)}>Back</button></header>
                <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises" />
                {filteredCatalog.map((e) => (
                  <button key={e.id} className="log" type="button" onClick={() => {
                    setEditor((prev) => ({ ...prev, items: [...prev.items, { key: `n${Date.now()}`, exercise_id: e.id, name: e.name, scheme: "3x8-12" }] }));
                    setPickerOpen(false);
                    setQuery("");
                  }}>
                    <span className="log-name" style={{ fontSize: 16 }}>{e.name}</span>
                    <span className="log-meta">{e.muscle_group}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function uniqueExerciseIds(workout) {
  const ids = [];
  for (const set of workout.sets ?? []) {
    const id = set.exercises?.id;
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function sessionTitle(workout) {
  const names = [];
  for (const set of workout.sets ?? []) {
    const name = set.exercises?.name;
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return "Session";
  return names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
}
