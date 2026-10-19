"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { PRESETS, PRESET_ORDER, DAY_NAMES, buildSplit, recommendPreset, applySplit } from "../../lib/presets";

const EXPERIENCE = [
  { id: "beginner", label: "Just starting", hint: "Less than a year of lifting" },
  { id: "intermediate", label: "Been lifting a while", hint: "1-3 years, know the basics" },
  { id: "advanced", label: "Advanced", hint: "3+ years, chasing numbers" },
];

const GOALS = [
  { id: "muscle", label: "Build muscle", hint: "Size and shape" },
  { id: "strength", label: "Get stronger", hint: "Heavier lifts" },
  { id: "fitness", label: "Stay fit", hint: "General health" },
];

const DAYS = [3, 4, 5, 6];

/** Split preview rows, SebasFit-style. */
function SplitPreview({ built }) {
  return (
    <div className="card" style={{ padding: "6px 16px" }}>
      {built.days.map((d) => (
        <div key={d.day_index} className="split-day-row">
          <span className={`split-day-name${d.is_rest ? " is-rest" : ""}`}>{DAY_NAMES[d.day_index]}</span>
          <div className="split-day-info">
            <p className="headline">{d.label}</p>
            {!d.is_rest && d.muscle_targets && <p className="footnote">{d.muscle_targets}</p>}
          </div>
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
      await applySplit(supabase, userId, built);
      await supabase.from("profiles").upsert({
        id: userId,
        display_name: name.trim() || null,
        weekly_goal: built.daysPerWeek,
        onboarding_done: true,
      });
    } finally {
      setSaving(false);
    }
    onDone();
  }

  async function skipAll() {
    setSaving(true);
    try {
      await supabase.from("profiles").upsert({
        id: userId,
        display_name: name.trim() || null,
        onboarding_done: true,
      });
    } finally {
      setSaving(false);
    }
    onDone();
  }

  const recommended = presetKey ?? recommendPreset(days);
  const built = step === "recommend" || step === "browse" ? buildSplit(recommended, experience, goal) : null;

  return (
    <>
      <header className="screen-head">
        <div className="quiz-head-row">
          <p className="kicker">SETUP</p>
          <button className="btn btn-plain" onClick={skipAll} disabled={saving}>Skip</button>
        </div>
      </header>
      <div className="screen-body">
        {step === "name" && (
          <>
            <h1 className="large-title">What should we call you?</h1>
            <div className="spacer-16" />
            <div className="field">
              <input
                className="input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="spacer-16" />
            <button className="btn btn-filled" style={{ width: "100%" }} onClick={() => setStep("days")}>
              Continue
            </button>
          </>
        )}

        {step === "days" && (
          <>
            <h1 className="large-title">How many days per week can you train?</h1>
            <div className="spacer-16" />
            {DAYS.map((d) => (
              <button key={d} className={`choice-row${days === d ? " selected" : ""}`}
                onClick={() => { setDays(d); setStep("experience"); }}>
                <span className="headline">{d} days</span>
              </button>
            ))}
          </>
        )}

        {step === "experience" && (
          <>
            <h1 className="large-title">How long have you been lifting?</h1>
            <div className="spacer-16" />
            {EXPERIENCE.map((e) => (
              <button key={e.id} className="choice-row" onClick={() => { setExperience(e.id); setStep("goal"); }}>
                <span className="headline">{e.label}</span>
                <span className="footnote">{e.hint}</span>
              </button>
            ))}
          </>
        )}

        {step === "goal" && (
          <>
            <h1 className="large-title">What's the main goal?</h1>
            <div className="spacer-16" />
            {GOALS.map((g) => (
              <button key={g.id} className="choice-row" onClick={() => { setGoal(g.id); setStep("recommend"); }}>
                <span className="headline">{g.label}</span>
                <span className="footnote">{g.hint}</span>
              </button>
            ))}
          </>
        )}

        {step === "recommend" && built && (
          <>
            <p className="kicker">YOUR SPLIT</p>
            <h1 className="large-title">{built.name}</h1>
            <p className="footnote">{PRESETS[recommended].blurb}</p>
            <div className="spacer-16" />
            <SplitPreview built={built} />
            <div className="spacer-16" />
            <button className="btn btn-filled" style={{ width: "100%" }}
              disabled={saving} onClick={() => finishWithSplit(built)}>
              {saving ? "Setting up…" : "Use this split"}
            </button>
            <div className="spacer-12" />
            <button className="btn btn-tinted" style={{ width: "100%" }} onClick={() => setStep("browse")}>
              Try another split
            </button>
            <div className="spacer-12" />
            <button className="btn btn-plain" style={{ width: "100%" }} onClick={skipAll} disabled={saving}>
              Skip for now
            </button>
            <p className="footnote" style={{ textAlign: "center", marginTop: 8 }}>
              You can customize everything after — days, workouts, exercises.
            </p>
          </>
        )}

        {step === "browse" && (
          <>
            <h1 className="large-title">Pick a split</h1>
            <div className="spacer-16" />
            {PRESET_ORDER.map((key) => (
              <button key={key} className={`choice-row${key === recommended ? " selected" : ""}`}
                onClick={() => { setPresetKey(key); setStep("recommend"); }}>
                <span className="headline">{PRESETS[key].name}</span>
                <span className="footnote">{PRESETS[key].daysPerWeek} days/week · {PRESETS[key].blurb}</span>
              </button>
            ))}
            <div className="spacer-12" />
            <button className="btn btn-plain" style={{ width: "100%" }} onClick={() => setStep("recommend")}>
              Back
            </button>
          </>
        )}
      </div>
    </>
  );
}
