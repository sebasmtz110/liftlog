"use client";

import { useEffect, useState } from "react";
import { supabase, isConfigured } from "../../lib/supabase";
import { startOfWeek } from "../../lib/format";
import ConfigBanner from "../components/ConfigBanner";

/** Simple stats: totals plus this-week activity. */
export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id, started_at")
        .not("ended_at", "is", null);
      const { data: sets } = await supabase
        .from("sets")
        .select("id, reps, weight, workouts!inner(started_at)");

      const weekStart = startOfWeek();
      const weekSets = (sets ?? []).filter(
        (s) => new Date(s.workouts.started_at) >= weekStart
      );
      const weekVolume = weekSets.reduce(
        (sum, s) => sum + (s.reps ?? 0) * Number(s.weight ?? 0),
        0
      );

      setStats({
        totalWorkouts: (workouts ?? []).length,
        totalSets: (sets ?? []).length,
        weekSets: weekSets.length,
        weekVolume: Math.round(weekVolume),
      });
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <h1 className="large-title">Stats</h1>
      </header>

      <div className="screen-body">
        {loading ? (
          <p className="loading">Loading…</p>
        ) : !stats ? (
          <div className="empty">
            <p className="headline">No data yet</p>
          </div>
        ) : (
          <>
            <p className="section-label">This week</p>
            <div className="stat-grid">
              <div className="stat-card">
                <p className="stat-value">{stats.weekSets}</p>
                <p className="stat-label">Sets this week</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{stats.weekVolume.toLocaleString()}</p>
                <p className="stat-label">Volume (lb) this week</p>
              </div>
            </div>
            <div className="spacer-24" />
            <p className="section-label">All time</p>
            <div className="stat-grid">
              <div className="stat-card">
                <p className="stat-value">{stats.totalWorkouts}</p>
                <p className="stat-label">Total workouts</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{stats.totalSets}</p>
                <p className="stat-label">Total sets</p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
