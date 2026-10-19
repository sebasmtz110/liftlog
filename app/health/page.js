"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

const SEBAS_EMAIL = "sebasmtz110@gmail.com";

// Exact copy of SebasFit's ring() function
function Ring({ pct, color, val }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <svg viewBox="0 0 84 84" style={{ width: 104, height: 104 }}>
      <circle cx="42" cy="42" r={r} stroke="rgba(255,255,255,.07)" strokeWidth="9" fill="none" />
      <circle
        cx="42" cy="42" r={r} stroke={color} strokeWidth="9" fill="none"
        strokeLinecap="round" strokeDasharray={`${c * p} ${c}`}
        strokeOpacity={p > 0 ? 1 : 0}
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="49" textAnchor="middle" style={{ fontSize: 21, fontWeight: 800, fill: "#eef1f5" }}>
        {val}
      </text>
    </svg>
  );
}

function scoreLabel(s) {
  return s == null ? "No data" : s >= 80 ? "Great" : s >= 60 ? "Good" : s >= 40 ? "Fair" : "Low";
}

function sleepScore(hours) {
  if (hours == null) return null;
  const dur = Math.sqrt(Math.min(1, hours / 7.5));
  return Math.round(dur * 100);
}

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

  // SebasFit tile helper - exact structure
  const tiles = [
    { icon: "heart", val: today.resting_hr ?? "–", unit: "bpm", label: "Resting HR today", color: "#f87171" },
    { icon: "workouts", val: (today.steps ?? 0).toLocaleString(), unit: "", label: "Steps today", color: "#9aa3ae" },
    { icon: "clock", val: today.sleep_hours != null ? (+today.sleep_hours).toFixed(1) : "–", unit: "h", label: "Sleep last night", color: "#a78bfa" },
    { icon: "progress", val: today.active_kcal ?? "–", unit: "kcal", label: "Active energy", color: "#d92d20" },
  ];

  return (
    <section className="screen" data-screen="health" style={{ background: "#0d0f12", minHeight: "100vh", color: "#eef1f5" }}>
      <ConfigBanner />
      <div style={{ padding: "20px 16px 100px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 2px", color: "#eef1f5" }}>Health</h1>
        <p style={{ color: "#9aa3ae", fontSize: 15, margin: "0 0 12px" }}>Apple Watch data</p>

        {loading ? (
          <p style={{ color: "#9aa3ae" }}>Loading…</p>
        ) : !data ? (
          <div style={{ background: "#171a1f", border: "1px solid #2a2f37", borderRadius: 16, padding: 14, margin: "10px 0", textAlign: "center" }}>
            <p style={{ color: "#eef1f5", fontWeight: 600 }}>No Watch data yet</p>
            <p style={{ color: "#9aa3ae", fontSize: 15 }}>Your Watch stats will appear here automatically.</p>
          </div>
        ) : (
          <>
            {/* Rings - exact SebasFit .rings.rings2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              {[
                { score: sleep, label: "Sleep score", color: "#a78bfa" },
                { score: recovery, label: "Recovery score", color: "#d92d20" },
              ].map((r) => (
                <div key={r.label} style={{
                  background: "#171a1f", border: "1px solid #2a2f37",
                  borderRadius: 26, padding: "16px 6px 14px", textAlign: "center",
                }}>
                  <Ring pct={(r.score || 0) / 100} color={r.color} val={r.score ?? "–"} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#eef1f5", opacity: 0.85, marginTop: 4 }}>{r.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: r.score == null ? "#9aa3ae" : r.color }}>
                    {r.score == null ? "Needs data" : scoreLabel(r.score)}
                  </div>
                </div>
              ))}
            </div>

            {/* Tiles - exact SebasFit .tiles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "12px 0" }}>
              {tiles.map((t) => (
                <div key={t.label} style={{
                  background: "#171a1f", border: "1px solid #2a2f37",
                  borderRadius: 16, padding: 16,
                }}>
                  <div style={{ color: t.color, width: 22, height: 22 }}>
                    <Icon name={t.icon} />
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.03em", marginTop: 8, color: "#eef1f5" }}>
                    {t.val}<span style={{ fontSize: 13, color: "#9aa3ae", fontWeight: 600 }}> {t.unit}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#9aa3ae", marginTop: 2 }}>{t.label}</div>
                </div>
              ))}
            </div>

            {/* Recent days */}
            {week.length > 1 && (
              <div style={{ background: "#171a1f", border: "1px solid #2a2f37", borderRadius: 16, padding: 14, margin: "10px 0" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 8px", color: "#eef1f5" }}>Recent days</h3>
                {week.slice(1, 8).map((d) => (
                  <div key={d.date} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "8px 0", borderTop: "1px solid #2a2f37", fontSize: 14,
                  }}>
                    <span style={{ color: "#eef1f5" }}>
                      {new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span style={{ color: "#9aa3ae" }}>
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
