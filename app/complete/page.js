"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase, isConfigured } from "../../lib/supabase";
import ConfigBanner from "../components/ConfigBanner";
import { volumeOf } from "../../lib/volume";

function fmtDur(ms) {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
  return `${min} min`;
}

export default function Complete() {
  return (
    <Suspense fallback={<section className="page"><p className="loading">Loading…</p></section>}>
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
      let name = "Session";
      if (workout.template_id) {
        const { data: tpl } = await supabase.from("workout_templates").select("name").eq("id", workout.template_id).single();
        if (tpl?.name) name = tpl.name;
      }
      const exCount = new Set((sets ?? []).map((x) => x.exercise_id)).size;
      const volume = volumeOf(sets);
      const durMs = workout.started_at && workout.ended_at
        ? new Date(workout.ended_at) - new Date(workout.started_at)
        : 0;
      setData({ name, exCount, durMs, sets: (sets ?? []).length, volume: Math.round(volume) });
      setLoading(false);
    })();
  }, [id]);

  return (
    <section className="page">
      <ConfigBanner />
      {loading ? <p className="loading">Loading the session…</p> : !data ? (
        <>
          <p className="empty">That session isn't available.</p>
          <button className="btn btn-line" type="button" onClick={() => router.push("/")}>Back to today</button>
        </>
      ) : (
        <>
          <h1>{data.name}</h1>
          <p className="lede">Session finished. {fmtDur(data.durMs)}.</p>
          <div className="strip">
            <div><span>Exercises</span><strong className="num">{data.exCount}</strong></div>
            <div><span>Sets</span><strong className="num">{data.sets}</strong></div>
            <div><span>Volume</span><strong className="num">{data.volume.toLocaleString()}<small>lb</small></strong></div>
          </div>
          <div className="title-actions" style={{ marginTop: 18 }}>
            <button className="btn btn-primary" type="button" onClick={() => router.push(`/history?id=${id}`)}>View session</button>
            <button className="btn btn-line" type="button" onClick={() => router.push("/")}>Back to today</button>
          </div>
        </>
      )}
    </section>
  );
}
