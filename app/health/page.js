"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

const SEBAS_EMAIL = "sebasmtz110@gmail.com";

function StatCard({ icon, value, label, accent }) {
  return (
    <div style={{
      background: accent ? "#d92d20" : "#111",
      borderRadius: 16,
      padding: "16px 8px",
      textAlign: "center",
    }}>
      {icon && <div style={{ marginBottom: 4, color: accent ? "#fff" : "#d92d20" }}><Icon name={icon} /></div>}
      <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{value}</div>
      <div style={{ fontSize: 11, color: accent ? "#ffd9d6" : "#888", marginTop: 2 }}>{label}</div>
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
        .limit(8);
      if (health && health.length > 0) setData(health);
      setLoading(false);
    })();
  }, [user]);

  if (user && user.email !== SEBAS_EMAIL) return null;

  const today = data?.[0] ?? {};
  const week = (data ?? []).slice(1);

  return (
    <section className="screen" data-screen="health">
      <ConfigBanner />
      <header className="page-head">
        <h1>Health</h1>
        <p className="note">Apple Watch stats, synced automatically</p>
      </header>
      {loading ? (
        <p className="loading">Loading…</p>
      ) : !data ? (
        <div className="empty">
          <Icon name="heart" />
          <p>No health data yet</p>
          <p className="note">Your Apple Watch stats will appear here.</p>
        </div>
      ) : (
        <div className="pad">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            <StatCard icon="heart" value={today.resting_hr ?? "–"} label="Resting HR" />
            <StatCard value={(today.steps ?? 0).toLocaleString()} label="Steps" />
            <StatCard value={today.active_kcal ?? "–"} label="Active kcal" />
            <StatCard value={today.sleep_hours ?? "–"} label="Sleep (hrs)" />
            <StatCard value={today.workouts ?? 0} label="Workouts" accent />
            <StatCard value={today.hrv ?? "–"} label="HRV (ms)" />
          </div>
          {week.length > 0 && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "4px 0 12px" }}>This Week</h2>
              {week.map((d) => (
                <div key={d.date} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", borderTop: "1px solid #f0f0f0",
                }}>
                  <strong style={{ fontSize: 15 }}>
                    {new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </strong>
                  <span style={{ fontSize: 14, color: "#555" }}>
                    {(d.steps ?? 0).toLocaleString()} steps · {d.active_kcal ?? "–"} kcal
                    {d.sleep_hours ? ` · ${d.sleep_hours}h sleep` : ""}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}
