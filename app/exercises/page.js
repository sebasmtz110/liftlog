"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isConfigured, ACTIVE_WORKOUT_KEY } from "../../lib/supabase";
import { EXERCISES, FILTERS, catalogById, ensureCatalog } from "../../lib/catalog";
import { useAuth } from "../components/AuthContext";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

const TABS = ["Instructions", "Tips", "Sets & Reps"];

function muscleMarkup(ex) {
  const face = ex.view === "back" ? "back" : "front";
  const hot = ex.hot?.[0] || "";
  const label = hot ? hot.charAt(0).toUpperCase() + hot.slice(1) : "";
  return `<div style="position:relative;width:92px;height:120px;overflow:hidden;border-radius:12px;">
    <img src="/assets/muscle-${face}.jpg?v=1" alt="" style="width:100%;height:100%;object-fit:cover;object-position:top;" />
    ${label ? `<div style="position:absolute;bottom:4px;left:4px;right:4px;background:rgba(240,55,45,.92);color:#fff;font-size:10px;font-weight:700;text-align:center;padding:3px 6px;border-radius:8px;">${label}</div>` : ""}
  </div>`;
}




export default function Exercises() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [ids, setIds] = useState({});
  const [openId, setOpenId] = useState(null);
  const [tab, setTab] = useState("Instructions");
  const [motion, setMotion] = useState(false);
  const [motionTime, setMotionTime] = useState(12);

  useEffect(() => {
    if (!isConfigured || !user) return;
    ensureCatalog(supabase).then((rows) => {
      const map = {};
      for (const row of rows || []) map[row.name.toLowerCase()] = row.id;
      setIds(map);
    });
  }, [user]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      const facet = filter === "all" || e.filter === filter;
      const text = !q || `${e.name} ${e.region} ${e.equipment} ${e.type}`.toLowerCase().includes(q);
      return facet && text;
    });
  }, [query, filter]);

  const open = openId ? catalogById(openId) : null;

  useEffect(() => {
    if (!motion || !open) return;
    const slot = document.getElementById("motion-slot");
    if (slot && typeof window.ALDER_MOTION_MOUNT === "function" && slot.dataset.mounted !== open.id) {
      slot.dataset.exerciseId = open.id;
      window.ALDER_MOTION_MOUNT(slot);
      slot.dataset.mounted = open.id;
    }
  }, [motion, open]);

  useEffect(() => {
    if (!motion || !open) return;
    const phase = motionTime < 8 ? "setup" : motionTime < 22 ? "movement" : "finish";
    document.dispatchEvent(new CustomEvent("alder:motion", {
      detail: { exerciseId: open.id, phase, time: motionTime, duration: 30 },
    }));
  }, [motion, motionTime, open]);

  async function startExercise(ex) {
    if (!user || !isConfigured) return;
    let exerciseId = ids[ex.name.toLowerCase()];
    if (!exerciseId) {
      const { data } = await supabase.from("exercises").select("id").eq("name", ex.name).maybeSingle();
      exerciseId = data?.id;
    }
    if (!exerciseId) return;
    const { data, error } = await supabase
      .from("workouts")
      .insert({ started_at: new Date().toISOString(), user_id: user.id })
      .select("id")
      .single();
    if (error || !data) return;
    localStorage.setItem("liftlog-template-exercises", JSON.stringify([exerciseId]));
    localStorage.setItem(ACTIVE_WORKOUT_KEY, data.id);
    router.push("/session");
  }

  if (motion && open) {
    const phase = motionTime < 8 ? "setup" : motionTime < 22 ? "movement" : "finish";
    const cues = open.cues || open.steps;
    const cue = phase === "setup" ? cues[0] : phase === "movement" ? (cues[1] || cues[0]) : cues.at(-1);
    return (
      <section className={`screen screen-fill motion${open.cinematic ? "" : " is-framed"} is-${phase}`}>
        <div className="motion-stage" id="motion-slot" data-muse-slot="exercise-motion" data-exercise-id={open.id}>
          <img src={open.motion || open.still || open.thumb} alt={open.motionName || open.name} />
          <div className="motion-shade" />
        </div>
        <header className="motion-top">
          <button className="icon-btn light" type="button" aria-label="Close" onClick={() => setMotion(false)}>
            <Icon name="close" />
          </button>
          <span />
        </header>
        <div className="motion-copy">
          <h1>{open.motionName || open.name}</h1>
          <p>{open.region} · {open.type}</p>
        </div>
        <div className="motion-controls">
          <div className="scrub">
            <span>{Math.floor(motionTime / 60)}:{String(Math.floor(motionTime % 60)).padStart(2, "0")}</span>
            <input type="range" min="0" max="30" step="0.1" value={motionTime} aria-label="Movement timeline" onChange={(e) => setMotionTime(Number(e.target.value))} />
            <span>0:30</span>
          </div>
          <div className="phases">
            {["setup", "movement", "finish"].map((p, i) => (
              <button key={p} type="button" className={phase === p ? "is-on" : ""} onClick={() => setMotionTime([2, 14, 26][i])}>
                {i + 1} {p[0].toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <p className="cue">{cue}</p>
        </div>
      </section>
    );
  }

  if (open) {
    return (
      <section className="screen" data-screen="detail">
        <header className="subhead">
          <button type="button" aria-label="Back" onClick={() => { setOpenId(null); setTab("Instructions"); }}>
            <Icon name="back" />
          </button>
          <span />
          <span />
        </header>
        <div className="detail-intro">
          <h1>{open.name}</h1>
          <p className="detail-sub">{open.region} · {open.type}</p>
        </div>
        <div className="detail-still">
          <img src={open.still || open.thumb} alt={`${open.name} demonstration`} />
          <button className="play" type="button" aria-label="Play movement" onClick={() => setMotion(true)}>
            <Icon name="play" />
          </button>
        </div>
        <div className="muscle-card">
          <div className="muscle-fig" dangerouslySetInnerHTML={{ __html: muscleMarkup(open) }} />
          <div>
            <p className="fine">Primary Muscles</p>
            <p className="strong">{open.primary}</p>
            {open.secondary && (
              <>
                <p className="fine">Secondary Muscles</p>
                <p className="strong">{open.secondary}</p>
              </>
            )}
          </div>
        </div>
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" className={tab === t ? "is-on" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="pad">
          {tab === "Instructions" && (
            <ol className="steps">
              {open.steps.map((s, i) => (
                <li key={i}><span className="num">{i + 1}</span><span>{s}</span></li>
              ))}
            </ol>
          )}
          {tab === "Tips" && (
            <ul className="tips">
              {(open.tips || []).map((t) => <li key={t}>{t}</li>)}
            </ul>
          )}
          {tab === "Sets & Reps" && (
            <div className="rx">
              <div><strong>{open.sets} sets</strong><span>Working sets</span></div>
              <div><strong>{open.reps} reps</strong><span>Target</span></div>
              <div><strong>{open.bodyweight && open.weight < 0.5 ? "BW" : `${open.weight} lb`}</strong><span>{open.bodyweight ? "Added load" : "Working weight"}</span></div>
              <div><strong>{open.rest} sec</strong><span>Rest · {open.tempo} tempo</span></div>
              <div><strong>{open.equipment}</strong><span>Equipment</span></div>
            </div>
          )}
        </div>
        <div className="sticky-cta">
          <button className="btn btn-ink btn-block" type="button" onClick={() => startExercise(open)}>Start Workout</button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen" data-screen="library">
      <ConfigBanner />
      <header className="page-head library-head">
        <p className="eyebrow">Build a stronger you</p>
        <h1>Exercise<br />Library</h1>
      </header>
      <form className="search-wrap" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="search">
          <Icon name="search" />
          <input type="search" placeholder="Search exercises..." value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" enterKeyHint="search" />
        </label>
      </form>
      <div className="chips">
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" className={filter === id ? "is-on" : ""} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      <div className="stack">
        {rows.length === 0 ? (
          <div className="empty">
            <p>No exercises found</p>
            <button type="button" onClick={() => { setQuery(""); setFilter("all"); }}>Clear search</button>
          </div>
        ) : rows.map((e) => (
          <button key={e.id} className="ex-row" type="button" onClick={() => setOpenId(e.id)}>
            <img className="thumb" src={e.thumb} alt="" />
            <span className="ex-copy"><strong>{e.name}</strong><small>{e.region} · {e.type}</small></span>
            <Icon name="chevron" />
          </button>
        ))}
      </div>
    </section>
  );
}
