"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isConfigured } from "../../lib/supabase";
import ConfigBanner from "../components/ConfigBanner";

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

  return (
    <div style={{ background: "#fff", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <ConfigBanner />
      {loading || !data ? (
        <p className="loading" style={{ margin: "auto" }}>Loading…</p>
      ) : (
        <div className="screen-body" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 64 }}>
          {/* Celebration check — prototype: teal circle + confetti */}
          <div className="complete-check-proto" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          </div>
          <div className="spacer-24" />
          <h1 style={{ fontSize: 32, lineHeight: "40px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Workout Complete!
          </h1>
          <div className="spacer-12" />
          <p className="headline" style={{ fontSize: 18 }}>{data.name}</p>
          <p className="footnote" style={{ marginTop: 4, fontSize: 16 }}>
            {data.exCount} {data.exCount === 1 ? "exercise" : "exercises"} · {fmtDur(data.durMs)}
          </p>

          <div className="spacer-24" />
          <div style={{ width: "100%", height: 1, background: "var(--bd)" }} />

          <div style={{ flex: 1 }} />

          <button className="btn btn-dark btn-block" style={{ minHeight: 56, fontSize: 17, borderRadius: 999 }}
            onClick={() => router.push("/history")}>
            View Workout
          </button>
          <div className="spacer-12" />
          <button className="btn btn-block"
            style={{ minHeight: 56, fontSize: 17, borderRadius: 999, background: "#fff", color: "var(--tx)", boxShadow: "inset 0 0 0 1.5px var(--bd)" }}
            onClick={() => router.push("/workout")}>
            Save to Library
          </button>
          <div className="spacer-16" />
          <button className="btn btn-plain" style={{ color: "var(--mu)", fontSize: 16 }}
            onClick={() => router.push("/")}>
            Done
          </button>
          <div className="spacer-24" />
        </div>
      )}
    </div>
  );
}
