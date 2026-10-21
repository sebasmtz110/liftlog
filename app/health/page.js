"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

const SEBAS_EMAIL = "sebasmtz110@gmail.com";

// Ring matching the screenshot: thick, large, score inside
function ScoreRing({ score, color }) {
  const size = 140;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = score == null ? 0 : Math.max(0, Math.min(1, score / 100));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      {p > 0 && (
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      )}
      <text x={size/2} y={size/2 + 8} textAnchor="middle"
        style={{ fontSize: 32, fontWeight: 800, fill: "#fff" }}>
        {score ?? "–"}
      </text>
    </svg>
  );
}

function scoreLabel(s) {
  return s == null ? null : s >= 80 ? "Great" : s >= 60 ? "Good" : s >= 40 ? "Fair" : "Low";
}

function sleepScore(hours) {
  if (hours == null) return null;
  return Math.round(Math.sqrt(Math.min(1, hours / 7.5)) * 100);
}

function recoveryScore(today, week) {
  const hrvs = week.map(d => d.hrv).filter(v => v != null);
  const rhrs = week.map(d => d.resting_hr).filter(v => v != null);
  if (!hrvs.length || !rhrs.length || today.hrv == null || today.resting_hr == null) return null;
  const avgHrv = hrvs.reduce((a,b) => a+b, 0) / hrvs.length;
  const avgRhr = rhrs.reduce((a,b) => a+b, 0) / rhrs.length;
  const hrvScore = Math.max(0, Math.min(1, 0.75 + ((today.hrv / avgHrv) - 1) * 2.5));
  const d = today.resting_hr - avgRhr;
  const rhrScore = Math.max(0, Math.min(1, 0.75 - (d > 0 ? d * 0.1 : d * 0.05)));
  return Math.round((hrvScore * 0.6 + rhrScore * 0.4) * 100);
}

export default function Health() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [latestWorkout, setLatestWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email !== SEBAS_EMAIL) { router.replace("/"); return; }
    if (!isConfigured) { setLoading(false); return; }
    (async () => {
      const supabase = await getSupabase();
      if (!supabase) { setLoading(false); return; }
      const { data: health } = await supabase
        .from("health_data").select("*").order("date", { ascending: false }).limit(14);
      if (health?.length) setData(health);
      // Latest workout for the hero card
      const { data: wo } = await supabase
        .from("workouts").select("id,date,name,duration_min").order("date", { ascending: false }).limit(1);
      if (wo?.length) {
        const w = wo[0];
        const { data: sets } = await supabase.from("sets").select("reps,weight").eq("workout_id", w.id);
        setLatestWorkout({ ...w, setCount: sets?.length ?? 0 });
      }
      setLoading(false);
    })();
  }, [user]);

  if (user && user.email !== SEBAS_EMAIL) return null;

  const today = data?.[0] ?? {};
  const week = data ?? [];
  const sleep = sleepScore(today.sleep_hours);
  const recovery = recoveryScore(today, week);
  const updatedStr = today.date
    ? `Updated ${new Date(today.date + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
    : "Apple Watch data";

  const tiles = [
    { icon: "heart", val: today.resting_hr ?? "–", unit: "bpm", label: "Resting HR", color: "#f87171" },
    { icon: "workouts", val: (today.steps ?? 0).toLocaleString(), unit: "", label: "Steps", color: "#a78bfa" },
    { icon: "clock", val: today.sleep_hours != null ? (+today.sleep_hours).toFixed(1) : "–", unit: "h", label: "Sleep", color: "#a78bfa" },
    { icon: "progress", val: today.active_kcal ?? "–", unit: "kcal", label: "Active energy", color: "#f87171" },
  ];

  return (
    <section style={{ background: "#000", minHeight: "100vh", color: "#fff" }}>
      <ConfigBanner />
      <div style={{ padding: "20px 16px 120px" }}>
        {/* Header */}
        <h1 style={{ fontSize: 40, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Health</h1>
        <p style={{ color: "#9aa3ae", fontSize: 16, margin: "0 0 16px" }}>{updatedStr}</p>

        {loading ? (
          <p style={{ color: "#9aa3ae" }}>Loading…</p>
        ) : (
          <>
            {/* Sync row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ color: "#ff2d55", display: "flex" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" />
                </svg>
              </span>
              <span style={{ flex: 1, color: "#9aa3ae", fontSize: 15 }}>Last sync just now</span>
              <button style={{
                background: "#2a2f37", border: 0, borderRadius: 20,
                padding: "10px 20px", color: "#fff", fontSize: 15, fontWeight: 700,
              }}>
                Sync now
              </button>
            </div>

            {/* Score cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {[
                { score: sleep, label: "Sleep score", color: "#a78bfa", needs: "Needs sleep data" },
                { score: recovery, label: "Recovery score", color: "#ff2d55", needs: "Needs HRV / resting HR" },
              ].map((r) => (
                <div key={r.label} style={{
                  background: "#141416", borderRadius: 28, padding: "24px 12px 20px",
                  textAlign: "center",
                }}>
                  <ScoreRing score={r.score} color={r.color} />
                  <div style={{ fontSize: 17, fontWeight: 600, marginTop: 12 }}>{r.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4,
                    color: r.score == null ? "#9aa3ae" : r.color }}>
                    {r.score == null ? r.needs : scoreLabel(r.score)}
                  </div>
                </div>
              ))}
            </div>

            {/* Tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              {tiles.map((t) => (
                <div key={t.label} style={{ background: "#141416", borderRadius: 24, padding: 18 }}>
                  <div style={{ color: t.color, width: 26, height: 26 }}><Icon name={t.icon} /></div>
                  <div style={{ fontSize: 30, fontWeight: 800, marginTop: 10, letterSpacing: "-0.02em" }}>
                    {t.val}
                    {t.unit && <span style={{ fontSize: 14, fontWeight: 500, color: "#9aa3ae" }}> {t.unit}</span>}
                  </div>
                  <div style={{ fontSize: 14, color: "#9aa3ae", marginTop: 2 }}>{t.label}</div>
                </div>
              ))}
            </div>

            {/* Latest workout hero */}
            {latestWorkout && (
              <div style={{
                background: "linear-gradient(135deg, #1a2b1a 0%, #141416 60%)",
                borderRadius: 28, padding: 20, marginBottom: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: "#ff2d55", fontSize: 13, fontWeight: 800, letterSpacing: "0.08em" }}>
                    LATEST WORKOUT · {new Date(latestWorkout.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>
                  {latestWorkout.name || "Workout"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 20, padding: 14 }}>
                    <div style={{ color: "#ff2d55", marginBottom: 8 }}><Icon name="clock" /></div>
                    <div style={{ fontSize: 26, fontWeight: 800 }}>{latestWorkout.duration_min ?? "–"}</div>
                    <div style={{ fontSize: 13, color: "#9aa3ae" }}>min</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 20, padding: 14 }}>
                    <div style={{ color: "#ff2d55", marginBottom: 8 }}><Icon name="workouts" /></div>
                    <div style={{ fontSize: 26, fontWeight: 800 }}>{latestWorkout.setCount}</div>
                    <div style={{ fontSize: 13, color: "#9aa3ae" }}>sets</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 20, padding: 14 }}>
                    <div style={{ color: "#ff2d55", marginBottom: 8 }}><Icon name="progress" /></div>
                    <div style={{ fontSize: 26, fontWeight: 800 }}>{today.active_kcal ?? "–"}</div>
                    <div style={{ fontSize: 13, color: "#9aa3ae" }}>active kcal</div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent days */}
            {week.length > 1 && (
              <div style={{ background: "#141416", borderRadius: 24, padding: 18 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Recent days</div>
                {week.slice(1, 8).map((d) => (
                  <div key={d.date} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "10px 0", borderTop: "1px solid #2a2f37", fontSize: 14,
                  }}>
                    <span>{new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                    <span style={{ color: "#9aa3ae" }}>
                      {(d.steps ?? 0).toLocaleString()} steps
                      {d.sleep_hours ? ` · ${d.sleep_hours}h` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
