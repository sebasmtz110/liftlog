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
const STEPS = ["name", "days", "experience", "goal", "recommend"];
const BACK_TO = { days: "name", experience: "days", goal: "experience", recommend: "goal", browse: "recommend" };

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
  const stepIndex = Math.max(0, STEPS.indexOf(step));
  const backTo = BACK_TO[step];

  return (
    <section className="page" style={{ maxWidth: 560 }}>
      <div className="quiz-hero">
        <img src="/photos/split-bells.jpg" alt="" />
        <div className="stats-shade" />
        <div className="quiz-hero-copy">
          <div className="quiz-kicker">Welcome to LiftLog</div>
          <h1>Set up your week</h1>
        </div>
      </div>

      <div className="quiz-meta">
        <div className="quiz-track" aria-hidden="true">
          <div className="quiz-fill" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
        </div>
        <span className="quiz-count">Step {stepIndex + 1} of {STEPS.length}</span>
        <button className="text-btn" type="button" onClick={skipAll} disabled={saving}>Skip</button>
      </div>
      <p className="lede" style={{ marginTop: 10 }}>A split is optional. You can change it later.</p>

      <div className="quiz-step" key={step}>
        {step === "name" && (
          <form onSubmit={(e) => { e.preventDefault(); setStep("days"); }}>
            <label className="field">
              <span>What should the log call you?</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="given-name" placeholder="Your name" />
            </label>
            <button className="block-btn" type="submit">Continue</button>
          </form>
        )}

        {step === "days" && (
          <div>
            <h2>How many days a week?</h2>
            <div className="quiz-days" style={{ marginTop: 10 }}>
              {DAYS.map((d) => (
                <button key={d} type="button" className={days === d ? "is-on" : ""} onClick={() => { setDays(d); setStep("experience"); }}>
                  <span className="n num">{d}</span>
                  <span className="u">days</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "experience" && (
          <div>
            <h2>How long have you been lifting?</h2>
            <div className="quiz-opts" style={{ marginTop: 10 }}>
              {EXPERIENCE.map((e) => (
                <button key={e.id} type="button" className={`quiz-opt${experience === e.id ? " is-on" : ""}`} onClick={() => { setExperience(e.id); setStep("goal"); }}>
                  <span><strong>{e.label}</strong><small>{e.hint}</small></span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "goal" && (
          <div>
            <h2>What are you training for?</h2>
            <div className="quiz-opts" style={{ marginTop: 10 }}>
              {GOALS.map((g) => (
                <button key={g.id} type="button" className={`quiz-opt${goal === g.id ? " is-on" : ""}`} onClick={() => { setGoal(g.id); setStep("recommend"); }}>
                  <span><strong>{g.label}</strong><small>{g.hint}</small></span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "recommend" && built && (
          <div>
            <p className="quiz-kicker is-dark">Your split</p>
            <h2 style={{ fontSize: 22, margin: "2px 0 6px" }}>{built.name}</h2>
            <p className="lede">{PRESETS[recommended].blurb}</p>
            <div style={{ marginTop: 12 }}>
              <SplitPreview built={built} />
            </div>
            <button className="block-btn" type="button" style={{ marginTop: 14 }} disabled={saving} onClick={() => finishWithSplit(built)}>
              {saving ? "Saving…" : "Use this split"}
            </button>
            <button className="block-btn is-line" type="button" style={{ marginTop: 8 }} onClick={() => setStep("browse")}>See other splits</button>
          </div>
        )}

        {step === "browse" && (
          <div>
            <h2>Other splits</h2>
            <div className="quiz-opts" style={{ marginTop: 10 }}>
              {PRESET_ORDER.map((key) => (
                <button key={key} type="button" className={`quiz-opt${key === recommended ? " is-on" : ""}`} onClick={() => { setPresetKey(key); setStep("recommend"); }}>
                  <span>
                    <strong>{PRESETS[key].name}</strong>
                    <small>{PRESETS[key].daysPerWeek} days a week. {PRESETS[key].blurb}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {backTo ? (
          <button className="text-btn quiz-back" type="button" onClick={() => setStep(backTo)}>Back</button>
        ) : null}
      </div>
    </section>
  );
}
