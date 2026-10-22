"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import ConfigBanner from "../components/ConfigBanner";

const SEBAS_EMAIL = "sebasmtz110@gmail.com";

function cell(value, suffix) {
  if (value == null || value === "") return "—";
  return suffix ? `${value} ${suffix}` : String(value);
}

export default function Health() {
  const router = useRouter();
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email !== SEBAS_EMAIL) { router.replace("/"); return; }
    if (!isConfigured) { setLoading(false); return; }
    (async () => {
      const supabase = await getSupabase();
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase.from("health_data").select("*").order("date", { ascending: false }).limit(14);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [user, router]);

  if (user && user.email !== SEBAS_EMAIL) return null;
  const today = rows?.[0];
  const when = today?.date
    ? new Date(today.date + "T12:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric" })
    : null;

  return (
    <section className="page">
      <ConfigBanner />
      <h1>Health</h1>
      <p className="lede">{when ? `Latest entry ${when}.` : "No health rows yet."}</p>
      {loading ? <p className="loading">Loading…</p> : !today ? (
        <p className="empty">Sleep, resting heart rate, and HRV show up here when a row exists.</p>
      ) : (
        <>
          <div className="strip">
            <div><span>Sleep</span><strong className="num">{cell(today.sleep_hours, "h")}</strong></div>
            <div><span>Resting heart rate</span><strong className="num">{cell(today.resting_hr, "bpm")}</strong></div>
            <div><span>HRV</span><strong className="num">{cell(today.hrv, "ms")}</strong></div>
          </div>
          <div className="strip">
            <div><span>Steps</span><strong className="num">{today.steps == null ? "—" : Number(today.steps).toLocaleString()}</strong></div>
            <div><span>Active energy</span><strong className="num">{cell(today.active_kcal, "kcal")}</strong></div>
            <div><span>Entries</span><strong className="num">{rows.length}</strong></div>
          </div>
          <section className="panel" style={{ marginTop: 16 }}>
            <h2>Recent days</h2>
            {rows.slice(1).map((d) => (
              <div key={d.date} className="lift">
                <span className="lift-copy">
                  <strong>{new Date(d.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</strong>
                  <small>
                    {d.sleep_hours != null ? `${d.sleep_hours} h sleep` : "No sleep"}
                    {d.resting_hr != null ? ` · ${d.resting_hr} bpm` : ""}
                  </small>
                </span>
                <span className="scheme num">{d.steps == null ? "—" : Number(d.steps).toLocaleString()}</span>
              </div>
            ))}
          </section>
        </>
      )}
    </section>
  );
}
