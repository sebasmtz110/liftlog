"use client";

import { useState } from "react";
import { getSupabase } from "../../lib/supabase";
import { PRESETS, PRESET_ORDER, DAY_NAMES, buildSplit, recommendPreset, applySplit } from "../../lib/presets";

const EXPERIENCE = [
  { id: "beginner", label: "Just starting", hint: "Less than a year of lifting" },
  { id: "intermediate", label: "Been lifting a while", hint: "One to three years" },
  { id: "advanced", label: "Advanced", hint: "Three or more years" },
];

const GOALS = [
  { id: "muscle", label: "Build muscle", hint: "Size and shape" },
  { id: "strength", label: "Get stronger", hint: "Heavier lifts" },
  { id: "fitness", label: "Stay fit", hint: "General training" },
];

const DAYS = [3, 4, 5, 6];

function SplitPreview({ built }) {
  return (
    <div className="panel">
      {built.days.map((d) => (
        <div key={d.day_index} className="lift">
          <span className="scheme">{DAY_NAMES[d.day_index]}</span>
          <span className="lift-copy">
            <strong>{d.label}</strong>
            {!d.is_rest && d.muscle_targets ? <small>{d.muscle_targets}</small> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Quiz({ userId, onDone }) {
  const [step, setStep] = useState("name");
  const [name, setName] = useState("");
  const [days, setDays] = useState(4);
  const [experience, setExperience] = useState("intermediate");
  const [goal, setGoal] = useState("muscle");
  const [presetKey, setPresetKey] = useState(null);
  const [saving, setSaving] = useState(false);

  async function finishWithSplit(built) {
    setSaving(true);
    try {
      const supabase = await getSupabase();
      if (supabase) {
        await applySplit(supabase, userId, built);
        await supabase.from("profiles").upsert({
          id: userId,
          display_name: name.trim() || null,
          weekly_goal: built.daysPerWeek,
          onboarding_done: true,
        });
      }
    } finally {
      setSaving(false);
    }
    onDone();
  }

  async function skipAll() {
    setSaving(true);
    try {
      const supabase = await getSupabase();
      if (supabase) {
        await supabase.from("profiles").upsert({
          id: userId,
          display_name: name.trim() || null,
          onboarding_done: true,
        });
      }
    } finally {
      setSaving(false);
    }
    onDone();
  }

  const recommended = presetKey ?? recommendPreset(days);
  const built = step === "recommend" || step === "browse" ? buildSplit(recommended, experience, goal) : null;

  return (
    <section className="page" style={{ maxWidth: 560 }}>
      <div className="title-row">
        <h1>Set up the week</h1>
        <button className="btn btn-quiet" type="button" onClick={skipAll} disabled={saving}>Skip</button>
      </div>
      <p className="lede">A split is optional. You can change it later.</p>

      {step === "name" && (
        <form style={{ marginTop: 16 }} onSubmit={(e) => { e.preventDefault(); setStep("days"); }}>
          <label className="field">
            <span>What should the log call you?</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button className="btn btn-primary" type="submit">Continue</button>
        </form>
      )}

      {step === "days" && (
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>How many days a week?</h2>
          <div className="seg">
            {DAYS.map((d) => (
              <button key={d} type="button" className={days === d ? "is-on" : ""} onClick={() => { setDays(d); setStep("experience"); }}>
                {d} days
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "experience" && (
        <div className="panel menu" style={{ marginTop: 16 }}>
          {EXPERIENCE.map((e) => (
            <button key={e.id} type="button" className={experience === e.id ? "is-on" : ""} onClick={() => { setExperience(e.id); setStep("goal"); }}>
              <span className="lift-copy"><strong>{e.label}</strong><small>{e.hint}</small></span>
            </button>
          ))}
        </div>
      )}

      {step === "goal" && (
        <div className="panel menu" style={{ marginTop: 16 }}>
          {GOALS.map((g) => (
            <button key={g.id} type="button" onClick={() => { setGoal(g.id); setStep("recommend"); }}>
              <span className="lift-copy"><strong>{g.label}</strong><small>{g.hint}</small></span>
            </button>
          ))}
        </div>
      )}

      {step === "recommend" && built && (
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 22, margin: "0 0 6px" }}>{built.name}</h2>
          <p className="lede">{PRESETS[recommended].blurb}</p>
          <SplitPreview built={built} />
          <div className="title-actions" style={{ marginTop: 14 }}>
            <button className="btn btn-primary" type="button" disabled={saving} onClick={() => finishWithSplit(built)}>
              {saving ? "Saving…" : "Use this split"}
            </button>
            <button className="btn btn-line" type="button" onClick={() => setStep("browse")}>Try another</button>
          </div>
        </div>
      )}

      {step === "browse" && (
        <div className="panel menu" style={{ marginTop: 16 }}>
          {PRESET_ORDER.map((key) => (
            <button key={key} type="button" className={key === recommended ? "is-on" : ""} onClick={() => { setPresetKey(key); setStep("recommend"); }}>
              <span className="lift-copy">
                <strong>{PRESETS[key].name}</strong>
                <small>{PRESETS[key].daysPerWeek} days a week. {PRESETS[key].blurb}</small>
              </span>
            </button>
          ))}
          <button type="button" onClick={() => setStep("recommend")}>Back</button>
        </div>
      )}
    </section>
  );
}
