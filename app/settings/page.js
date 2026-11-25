"use client";

import { useEffect, useState } from "react";
import ConfigBanner from "../components/ConfigBanner";
import { getSupabase, isConfigured } from "../../lib/supabase";
import { useAuth } from "../components/AuthContext";
import { getRestDefault, setRestDefault, REST_OPTIONS } from "../../lib/prefs";

export default function Settings() {
  const { user } = useAuth();
  const [rest, setRest] = useState(90);
  const [goal, setGoal] = useState(4);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalMsg, setGoalMsg] = useState("");

  useEffect(() => {
    setRest(getRestDefault());
  }, []);

  useEffect(() => {
    if (!user || !isConfigured) return;
    (async () => {
      const supabase = await getSupabase();
      if (!supabase) return;
      const { data } = await supabase.from("profiles").select("weekly_goal").eq("id", user.id).maybeSingle();
      if (data?.weekly_goal) setGoal(data.weekly_goal);
    })();
  }, [user]);

  function chooseRest(seconds) {
    setRest(seconds);
    setRestDefault(seconds);
  }

  async function saveGoal(next) {
    if (!user || !isConfigured) return;
    setGoal(next);
    setSavingGoal(true);
    setGoalMsg("");
    const supabase = await getSupabase();
    if (!supabase) {
      setSavingGoal(false);
      setGoalMsg("That didn't save. Try again.");
      return;
    }
    const { error } = await supabase.from("profiles").upsert({ id: user.id, weekly_goal: next });
    setSavingGoal(false);
    setGoalMsg(error ? "That didn't save. Try again." : "Saved.");
    if (!error) setTimeout(() => setGoalMsg(""), 2000);
  }

  return (
    <section className="page">
      <ConfigBanner />
      <h1>Settings</h1>
      <p className="lede">Sets are stored in pounds. Kilograms stays off until that is an explicit change.</p>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Default rest</h2>
        <p className="note" style={{ marginTop: 6 }}>Used when you log a set. You can still nudge ±15s in the session.</p>
        <div className="seg" role="group" aria-label="Default rest" style={{ marginTop: 10 }}>
          {REST_OPTIONS.map((sec) => (
            <button
              key={sec}
              type="button"
              className={rest === sec ? "is-on" : ""}
              onClick={() => chooseRest(sec)}
            >
              {`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`}
            </button>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Weekly goal</h2>
        <p className="note" style={{ marginTop: 6 }}>How many sessions Coach treats as the week&apos;s target.</p>
        <div className="seg" role="group" aria-label="Weekly goal" style={{ marginTop: 10 }}>
          {[3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              className={goal === n ? "is-on" : ""}
              disabled={savingGoal}
              onClick={() => saveGoal(n)}
            >
              {n}
            </button>
          ))}
        </div>
        {goalMsg ? <p className="note" style={{ marginTop: 10 }} role="status">{goalMsg}</p> : null}
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Weight unit</h2>
        <div className="seg" role="group" aria-label="Weight unit" style={{ marginTop: 10 }}>
          <button type="button" className="is-on">Pounds</button>
          <button type="button" disabled>Kilograms</button>
        </div>
        <p className="note" style={{ marginTop: 12 }}>Progress photos and the profile picture stay on this device.</p>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Account</h2>
        <p className="note">Sign out from Profile. Edit your display name there too.</p>
      </section>
    </section>
  );
}
