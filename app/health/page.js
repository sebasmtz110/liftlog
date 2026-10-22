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

// Rows arrive newest-date first; a metric can be missing on the newest row
// (sleep lands when the night ends, steps tick all day), so each ring reads
// the newest row that actually has its value.
function newestWith(rows, field) {
  return rows?.find((r) => r[field] != null) ?? null;
}

function shortDate(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Ring({ value, target, color, center, name, sub }) {
  const C = 2 * Math.PI * 30;
  const frac = value == null || !target ? 0 : Math.min(1, value / target);
  return (
    <div className="ring">
      <svg viewBox="0 0 72 72" role="img" aria-label={name}>
        <circle className="ring-track" cx="36" cy="36" r="30" />
        <circle
          className="ring-arc"
          cx="36"
          cy="36"
          r="30"
          style={{ stroke: color, strokeDasharray: C, strokeDashoffset: C * (1 - frac) }}
          transform="rotate(-90 36 36)"
        />
        <text className="ring-value" x="36" y="37" textAnchor="middle">{value == null ? "—" : center}</text>
      </svg>
      <div className="ring-name">{name}</div>
      <div className="ring-sub">{sub}</div>
    </div>
  );
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

  const stepsRow = newestWith(rows, "steps");
  const sleepRow = newestWith(rows, "sleep_hours");
  const exerciseRow = newestWith(rows, "exercise_min");
  const standRow = newestWith(rows, "stand_hrs");
  const hrRow = newestWith(rows, "resting_hr");
  const hrvRow = newestWith(rows, "hrv");
  const kcalRow = newestWith(rows, "active_kcal");
  const steps = stepsRow?.steps ?? null;
  const sleep = sleepRow?.sleep_hours ?? null;
  const exercise = exerciseRow?.exercise_min ?? null;
  const stand = standRow?.stand_hrs ?? null;

  return (
    <section className="page">
      <ConfigBanner />
      <h1>Health</h1>
      <p className="lede">{when ? `Latest entry ${when}.` : "No health rows yet."}</p>
      {loading ? <p className="loading">Loading…</p> : !today ? (
        <p className="empty">Sleep, resting heart rate, and HRV show up here when a row exists.</p>
      ) : (
        <>
          <div className="panel rings-panel">
            <div className="rings">
              <Ring
                value={steps}
                target={10000}
                color="#8D3B2E"
                center={steps == null ? "" : steps >= 1000 ? `${(steps / 1000).toFixed(1).replace(/\.0$/, "")}k` : `${steps}`}
                name="Steps"
                sub={steps == null ? "No data" : `${Number(steps).toLocaleString()} of 10,000`}
              />
              <Ring
                value={sleep}
                target={8}
                color="#565D8C"
                center={sleep == null ? "" : `${sleep}h`}
                name="Sleep"
                sub={sleep == null ? "No data" : `${shortDate(sleepRow.date)} · of 8 h`}
              />
              <Ring
                value={exercise}
                target={30}
                color="#0F706E"
                center={exercise == null ? "" : `${exercise}m`}
                name="Exercise"
                sub={exercise == null ? "No data" : `${exercise} of 30 min`}
              />
              <Ring
                value={stand}
                target={12}
                color="#B07D2B"
                center={stand == null ? "" : `${stand}h`}
                name="Stand"
                sub={stand == null ? "No data" : `${stand} of 12 h`}
              />
            </div>
          </div>
          <div className="strip">
            <div><span>Resting heart rate</span><strong className="num">{cell(hrRow?.resting_hr, "bpm")}</strong></div>
            <div><span>HRV</span><strong className="num">{cell(hrvRow?.hrv, "ms")}</strong></div>
            <div><span>Active energy</span><strong className="num">{cell(kcalRow?.active_kcal, "kcal")}</strong></div>
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
