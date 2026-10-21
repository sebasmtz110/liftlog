"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase, isConfigured } from "../../lib/supabase";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

function fmtDur(ms) {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
  return `${min} min`;
}

export default function Complete() {
  return (
    <Suspense fallback={<p className="loading" style={{ margin: "auto" }}>Loading…</p>}>
      <CompleteInner />
    </Suspense>
  );
}

function CompleteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !isConfigured) {
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = await getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }
      const [{ data: workout }, { data: sets }] = await Promise.all([
        supabase.from("workouts").select("id, started_at, ended_at, template_id").eq("id", id).single(),
        supabase.from("sets").select("reps, weight, exercise_id").eq("workout_id", id),
      ]);
      if (!workout) {
        setLoading(false);
        return;
      }
      let name = "Workout";
      if (workout.template_id) {
        const { data: tpl } = await supabase
          .from("workout_templates")
          .select("name")
          .eq("id", workout.template_id)
          .single();
        if (tpl?.name) name = tpl.name;
      }
      const exCount = new Set((sets ?? []).map((x) => x.exercise_id)).size;
      const durMs =
        workout.started_at && workout.ended_at
          ? new Date(workout.ended_at) - new Date(workout.started_at)
          : 0;
      setData({ name, exCount, durMs });
      setLoading(false);
    })();
  }, [id]);

  const minutes = Math.max(1, Math.round((data?.durMs || 0) / 60000));
  const calories = Math.round(minutes * 11.5);

  return (
    <section className="screen screen-fill complete">
      <ConfigBanner />
      {loading || !data ? (
        <p className="loading">Loading…</p>
      ) : (
        <div className="complete-inner">
          <div className="burst" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
          <div className="check"><Icon name="check" /></div>
          <h1>Workout Complete!</h1>
          <p className="complete-name">{data.name}</p>
          <p className="complete-meta">{data.exCount} exercises · {fmtDur(data.durMs)}</p>
          <div className="complete-card">
            <div><span>Exercises</span><strong>{data.exCount}</strong></div>
            <div><span>Calories</span><strong>{calories}</strong></div>
            <div><span>Active Time</span><strong>{minutes} min</strong></div>
          </div>
          <button className="btn btn-ink btn-block" type="button" onClick={() => router.push("/history")}>View Workout</button>
          <button className="btn btn-line btn-block" type="button" onClick={() => router.push("/workout")}>Back to Split</button>
          <button className="done-link" type="button" onClick={() => router.push("/")}>Done</button>
        </div>
      )}
    </section>
  );
}
