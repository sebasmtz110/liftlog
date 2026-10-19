"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

const SEBAS_EMAIL = "sebasmtz110@gmail.com";

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
        .limit(7);
      if (health && health.length > 0) setData(health);
      setLoading(false);
    })();
  }, [user]);

  if (user && user.email !== SEBAS_EMAIL) return null;

  const today = data?.[0] ?? {};

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
          <p className="note">Connect your Apple Watch to start syncing.</p>
        </div>
      ) : (
        <div className="pad">
          <div className="health-grid">
            <div className="health-card">
              <Icon name="heart" />
              <strong>{today.resting_hr ?? "–"}</strong>
              <span>Resting HR</span>
            </div>
            <div className="health-card">
              <strong>{today.steps?.toLocaleString() ?? "–"}</strong>
              <span>Steps</span>
            </div>
            <div className="health-card">
              <strong>{today.active_kcal ?? "–"}</strong>
              <span>Active kcal</span>
            </div>
            <div className="health-card">
              <strong>{today.sleep_hours ?? "–"}</strong>
              <span>Sleep (hrs)</span>
            </div>
            <div className="health-card">
              <strong>{today.workouts ?? "–"}</strong>
              <span>Workouts</span>
            </div>
            <div className="health-card">
              <strong>{today.hrv ?? "–"}</strong>
              <span>HRV (ms)</span>
            </div>
          </div>
          {data.length > 1 && (
            <>
              <h2 style={{ marginTop: 24, marginBottom: 12 }}>This Week</h2>
              {data.slice(1).map((d) => (
                <div className="day-line" key={d.date}>
                  <strong>{new Date(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</strong>
                  <span>{d.steps?.toLocaleString() ?? "–"} steps · {d.active_kcal ?? "–"} kcal</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}
