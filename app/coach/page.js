"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import { loadSplit } from "../../lib/presets";
import { answerCoach, QUICK } from "../../lib/coach";
import ConfigBanner from "../components/ConfigBanner";

function mondayOf(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export default function Coach() {
  const { user } = useAuth();
  const [ctx, setCtx] = useState(null);
  const [messages, setMessages] = useState([
    { me: false, text: "Hey — I'm your coach. Ask me what to train today, how your week is going, or whether your volume is on track." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured || !user) {
      setLoading(false);
      return;
    }
    (async () => {
      const [split, { data: profile }, { data: workouts }] = await Promise.all([
        loadSplit(supabase, user.id),
        supabase.from("profiles").select("weekly_goal").eq("id", user.id).maybeSingle(),
        supabase
          .from("workouts")
          .select("id, started_at, sets(id, reps, weight, exercises(name, muscle_group))")
          .not("ended_at", "is", null)
          .order("started_at", { ascending: false })
          .limit(60),
      ]);
      const weekStart = mondayOf(new Date());
      const week = (workouts ?? []).filter((w) => new Date(w.started_at) >= weekStart);
      const wsets = week.flatMap((w) => w.sets ?? []);
      const ti = (new Date().getDay() + 6) % 7;
      const today = split?.days?.find((d) => d.day_index === ti);
      const muscleSets = {};
      for (const s of wsets) {
        const m = s.exercises?.muscle_group || "Other";
        muscleSets[m] = (muscleSets[m] || 0) + 1;
      }
      const best = new Map();
      for (const w of workouts ?? []) {
        for (const s of w.sets ?? []) {
          const n = s.exercises?.name;
          if (n && Number(s.weight) > 0 && (!best.has(n) || Number(s.weight) > best.get(n))) {
            best.set(n, Number(s.weight));
          }
        }
      }
      const daySet = new Set((workouts ?? []).map((w) => new Date(w.started_at).toDateString()));
      let streak = 0;
      const cursor = new Date();
      if (!daySet.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
      while (daySet.has(cursor.toDateString())) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
      setCtx({
        todayLabel: today && !today.is_rest ? today.label : null,
        isRest: !today || today.is_rest,
        weekWorkouts: week.length,
        weekVolume: wsets.reduce((s, x) => s + (x.reps ?? 0) * Number(x.weight ?? 0), 0),
        weekSets: wsets.length,
        goal: profile?.weekly_goal ?? 4,
        streak,
        prs: [...best.entries()].map(([name, weight]) => ({ name, weight })),
        muscleSets,
      });
      setLoading(false);
    })();
  }, [user]);

  function ask(text) {
    const q = text.trim();
    if (!q) return;
    setMessages((m) => [...m, { me: true, text: q }]);
    setInput("");
    // Answer on the next tick so the question paints first.
    setTimeout(() => {
      setMessages((m) => [...m, { me: false, text: answerCoach(q, ctx ?? {}) }]);
    }, 150);
  }

  const suggestions = useMemo(() => QUICK, []);

  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <p className="kicker">COACH</p>
        <h1 className="large-title">Ask anything</h1>
      </header>

      <div className="screen-body">
        {loading ? (
          <p className="loading">Loading…</p>
        ) : (
          <>
            <div className="chat-wrap">
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble${m.me ? " me" : " them"}`}>{m.text}</div>
              ))}
            </div>
            <div className="spacer-12" />
            <div className="chip-row">
              {suggestions.map((s) => (
                <button key={s} className="chip-btn" onClick={() => ask(s)}>{s}</button>
              ))}
            </div>
            <div className="spacer-12" />
            <form
              className="chat-input-row"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <input
                className="input"
                placeholder="Ask your coach…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button className="btn btn-filled" type="submit">Send</button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
