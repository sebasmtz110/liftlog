"use client";

import { useState } from "react";
import { getSupabase } from "../../lib/supabase";
import { PRESETS, PRESET_ORDER, DAY_NAMES, buildSplit, recommendPreset, applySplit } from "../../lib/presets";

const EXPERIENCE = [
  { id: "beginner", label: "Just starting", hint: "Less than a year of lifting", icon: "🌱" },
  { id: "intermediate", label: "Been lifting a while", hint: "1-3 years, know the basics", icon: "💪" },
  { id: "advanced", label: "Advanced", hint: "3+ years, chasing numbers", icon: "🔥" },
];

const GOALS = [
  { id: "muscle", label: "Build muscle", hint: "Size and shape", icon: "🦾", color: "#0F706E" },
  { id: "strength", label: "Get stronger", hint: "Heavier lifts", icon: "🏋️", color: "#F0372D" },
  { id: "fitness", label: "Stay fit", hint: "General health", icon: "❤️", color: "#1a1a1a" },
];

const DAYS = [3, 4, 5, 6];
const STEPS = ["name", "days", "experience", "goal", "recommend"];

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
  const stepIdx = STEPS.indexOf(step);

  const choiceStyle = (selected) => ({
    display: "flex", alignItems: "center", gap: 14, width: "100%",
    background: selected ? "#0F706E" : "#fff",
    color: selected ? "#fff" : "#101916",
    border: selected ? "2px solid #0F706E" : "1.5px solid #DFE4DF",
    borderRadius: 16, padding: "16px", marginBottom: 10,
    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
  });

  return (
    <div style={{ background: "#F4F5F2", minHeight: "100dvh" }}>
      {/* Hero */}
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        <img src="/assets/gym-dark.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(16,25,22,.75), transparent 60%)" }} />
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".12em", color: "rgba(255,255,255,.75)", fontWeight: 700 }}>SETUP</div>
            <h1 style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>Let's get you set up</h1>
          </div>
          <button onClick={skipAll} disabled={saving}
            style={{ background: "rgba(255,255,255,.15)", border: 0, color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 20, cursor: "pointer", backdropFilter: "blur(4px)" }}>
            Skip
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "16px 0 4px" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ width: i === stepIdx ? 24 : 8, height: 8, borderRadius: 4,
            background: i <= stepIdx ? "#0F706E" : "#DFE4DF", transition: "all .2s" }} />
        ))}
      </div>

      <div style={{ padding: "12px 20px 40px", maxWidth: 480, margin: "0 auto" }}>
        {step === "name" && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 4px", letterSpacing: "-.01em" }}>What should we call you?</h2>
            <p style={{ color: "#69746F", fontSize: 14, margin: "0 0 20px" }}>This shows on your profile and workout feed.</p>
            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              style={{ width: "100%", fontSize: 17, padding: "16px", borderRadius: 14, border: "1.5px solid #DFE4DF", background: "#fff", outline: "none", fontFamily: "inherit" }}
            />
            <div style={{ height: 20 }} />
            <button onClick={() => setStep("days")}
              style={{ width: "100%", background: "#0F706E", color: "#fff", border: 0, borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Continue →
            </button>
          </>
        )}

        {step === "days" && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 4px" }}>How many days per week?</h2>
            <p style={{ color: "#69746F", fontSize: 14, margin: "0 0 20px" }}>Pick what fits your schedule — you can change it later.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {DAYS.map((d) => (
                <button key={d} onClick={() => { setDays(d); setStep("experience"); }}
                  style={{ ...choiceStyle(days === d), flexDirection: "column", alignItems: "center", padding: "24px 16px", marginBottom: 0 }}>
                  <span style={{ fontSize: 32, fontWeight: 800 }}>{d}</span>
                  <span style={{ fontSize: 13, opacity: .8 }}>days</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "experience" && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 4px" }}>How long have you been lifting?</h2>
            <p style={{ color: "#69746F", fontSize: 14, margin: "0 0 20px" }}>We'll tailor your starting weights.</p>
            {EXPERIENCE.map((e) => (
              <button key={e.id} style={choiceStyle(experience === e.id)}
                onClick={() => { setExperience(e.id); setStep("goal"); }}>
                <span style={{ fontSize: 28 }}>{e.icon}</span>
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 16 }}>{e.label}</span>
                  <span style={{ display: "block", fontSize: 13, opacity: .7 }}>{e.hint}</span>
                </span>
              </button>
            ))}
          </>
        )}

        {step === "goal" && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 4px" }}>What's the main goal?</h2>
            <p style={{ color: "#69746F", fontSize: 14, margin: "0 0 20px" }}>This shapes your program split.</p>
            {GOALS.map((g) => (
              <button key={g.id} style={choiceStyle(false)}
                onClick={() => { setGoal(g.id); setStep("recommend"); }}>
                <span style={{ fontSize: 28, background: g.color, borderRadius: 12, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{g.icon}</span>
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 16 }}>{g.label}</span>
                  <span style={{ display: "block", fontSize: 13, color: "#69746F" }}>{g.hint}</span>
                </span>
              </button>
            ))}
          </>
        )}

        {step === "recommend" && built && (
          <>
            <div style={{ fontSize: 11, letterSpacing: ".12em", color: "#0F706E", fontWeight: 700, margin: "8px 0 4px" }}>YOUR SPLIT</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>{built.name}</h2>
            <p style={{ color: "#69746F", fontSize: 14, margin: "0 0 16px" }}>{PRESETS[recommended].blurb}</p>
            <SplitPreview built={built} />
            <div style={{ height: 20 }} />
            <button onClick={() => finishWithSplit(built)} disabled={saving}
              style={{ width: "100%", background: "#0F706E", color: "#fff", border: 0, borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? .6 : 1 }}>
              {saving ? "Setting up…" : "Use this split →"}
            </button>
            <div style={{ height: 10 }} />
            <button onClick={() => setStep("browse")}
              style={{ width: "100%", background: "#E6F2F0", color: "#0F706E", border: 0, borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Try another split
            </button>
            <div style={{ height: 16 }} />
            <p style={{ textAlign: "center", color: "#8B948F", fontSize: 13 }}>
              You can always change your split later in the app — nothing here is permanent.
            </p>
          </>
        )}

        {step === "browse" && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 4px" }}>Pick a split</h2>
            <p style={{ color: "#69746F", fontSize: 14, margin: "0 0 16px" }}>You can always change it later in the app.</p>
            {PRESET_ORDER.map((key) => (
              <button key={key} style={choiceStyle(key === recommended)}
                onClick={() => { setPresetKey(key); setStep("recommend"); }}>
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 16 }}>{PRESETS[key].name}</span>
                  <span style={{ display: "block", fontSize: 13, opacity: .7 }}>{PRESETS[key].daysPerWeek} days/week · {PRESETS[key].blurb}</span>
                </span>
              </button>
            ))}
            <button onClick={() => setStep("recommend")}
              style={{ width: "100%", background: "transparent", border: 0, color: "#69746F", padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
