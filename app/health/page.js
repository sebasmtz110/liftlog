"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

const SEBAS_EMAIL = "sebasmtz110@gmail.com";

function ScoreRing({ score, label, color }) {
  const size = 120;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = score == null ? 0 : Math.max(0, Math.min(1, score / 100));
  return (
    <div style={{ textAlign: "center", cursor: "pointer" }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#222" strokeWidth={stroke} />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - p)}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 800, color: "#fff",
        }}>
          {score ?? "–"}
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 8 }}>{label}</div>
      <div style={{ fontSize: 12, color: color }}>
        {score == null ? "Needs data" : score >= 80 ? "Great" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Low"}
      </div>
    </div>
  );
}

// Simplified sleep score: 50% duration (7.5h goal), 30% consistency (placeholder), 20% interruptions (placeholder)
// Uses real sleep hours; consistency/interruptions need more history
function sleepScore(hours) {
  if (hours == null) return null;
  const dur = Math.sqrt(Math.min(1, hours / 7.5)); // diminishing returns
  return Math.round(dur * 100);
}

// Simplified recovery: based on HRV and resting HR vs their 7-day averages
function recoveryScore(today, week) {
  const hrvs = week.map(d => d.hrv).filter(v => v != null);
  const rhrs = week.map(d => d.resting_hr).filter(v => v != null);
  if (!hrvs.length || !rhrs.length || today.hrv == null || today.resting_hr == null) return null;
  const avgHrv = hrvs.reduce((a,b) => a+b, 0) / hrvs.length;
  const avgRhr = rhrs.reduce((a,b) => a+b, 0) / rhrs.length;
  const hrvScore = Math.max(0, Math.min(1, 0.75 + ((today.hrv / avgHrv) - 1) * 2.5));
  const rhrDiff = today.resting_hr - avgRhr;
  const rhrScore = Math.max(0, Math.min(1, 0.75 - (rhrDiff > 0 ? rhrDiff * 0.1 : rhrDiff * 0.05)));
  return Math.round((hrvScore * 0.6 + rhrScore * 0.4) * 100);
}

function Tile({ icon, value, unit, label, color }) {
  return (
    <div style={{
      background: "#111", borderRadius: 16, padding: "16px 12px",
      textAlign: "center",
    }}>
      <div style={{ color, marginBottom: 6, display: "flex", justifyContent: "center" }}>
        <Icon name={icon} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
        {value}<span style={{ fontSize: 13, fontWeight: 400, color: "#888" }}> {unit}</span>
      </div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function Health() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email !== SEBAS_EMAIL) {
      router.replace("/");
      return;
    }
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: health } = await supabase
        .from("health_data")
        .select("*")
        .order("date", { ascending: false })
        .limit(14);
      if (health && health.length > 0) setData(health);
      setLoading(false);
    })();
  }, [user]);

  if (user && user.email !== SEBAS_EMAIL) return null;

  const today = data?.[0] ?? {};
  const week = data ?? [];
  const sleep = sleepScore(today.sleep_hours);
  const recovery = recoveryScore(today, week);

  return (
    <section className="screen" data-screen="health" style={{ background: "#000", minHeight: "100vh" }}>
      <ConfigBanner />
      <div className="pad" style={{ paddingTop: 20 }}>
        <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: "0 0 4px" }}>Health</h1>
        <p style={{ color: "#888", fontSize: 14, margin: "0 0 20px" }}>Apple Watch data</p>

        {loading ? (
          <p className="loading" style={{ color: "#888" }}>Loading…</p>
        ) : !data ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#888" }}>
            <Icon name="heart" />
            <p style={{ color: "#fff", fontWeight: 600 }}>No Watch data yet</p>
            <p style={{ fontSize: 14 }}>Your Watch stats will appear here automatically.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 24 }}>
              <ScoreRing score={sleep} label="Sleep score" color="#a78bfa" />
              <ScoreRing score={recovery} label="Recovery score" color="#d92d20" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              <Tile icon="heart" value={today.resting_hr ?? "–"} unit="bpm" label="Resting HR today" color="#d92d20" />
              <Tile icon="workouts" value={(today.steps ?? 0).toLocaleString()} unit="" label="Steps today" color="#888" />
              <Tile icon="clock" value={today.sleep_hours ?? "–"} unit="h" label="Sleep last night" color="#a78bfa" />
              <Tile icon="progress" value={today.active_kcal ?? "–"} unit="kcal" label="Active energy" color="#d92d20" />
            </div>

            {week.length > 1 && (
              <div style={{ background: "#111", borderRadius: 16, padding: "16px" }}>
                <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Recent days</h3>
                {week.slice(1, 8).map((d) => (
                  <div key={d.date} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "8px 0", borderTop: "1px solid #222",
                    fontSize: 14,
                  }}>
                    <span style={{ color: "#fff" }}>
                      {new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span style={{ color: "#888" }}>
                      {(d.steps ?? 0).toLocaleString()} steps
                      {d.sleep_hours ? ` · ${d.sleep_hours}h sleep` : ""}
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
