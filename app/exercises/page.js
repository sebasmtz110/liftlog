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
  const cls = (id) => (ex.hot?.includes(id) ? "is-hot" : ex.warm?.includes(id) ? "is-warm" : "");

  // Cleaner anatomical muscle model — smooth body silhouette with defined muscle groups
  const bodyFront = `<path fill="#F5F5F4" stroke="#D4D4D4" stroke-width="1.4" d="M70 14c7 0 12 5.5 12 11 0 4.5-2.8 8.2-6.5 9.3 1.8 1.6 5.5 2.6 9.3 3.6 17 4.5 28 18 28 35 0 9-2.8 15-7.5 19l1.8 20c7.5 2.8 12.5 9.5 13.5 17l3.8 34c.9 9.5-5.8 15-14.2 15h-7.5l-3.8-28-5.7 28h-11.4l-5.7-34h-1.9l-5.7 34H54.5l-5.7-28-3.8 28h-7.5c-8.4 0-15.1-5.5-14.2-15l3.8-34c1-7.5 6-14.2 13.5-17l1.8-20c-4.7-4-7.5-10-7.5-19 0-17 11-30.5 28-35 3.8-1 7.5-2 9.3-3.6-3.7-1.1-6.5-4.8-6.5-9.3 0-5.5 5-11 12-11z"/>`;

  const bodyBack = bodyFront; // same silhouette

  const front = `
    <g class="muscle ${cls("shoulders")}"><path d="M42 52c5-3 11-4 16-2 3 4 2 10-2 13-5 2-11 1-14-2-2-4-2-7 0-9z"/><path d="M98 52c-5-3-11-4-16-2-3 4-2 10 2 13 5 2 11 1 14-2 2-4 2-7 0-9z"/></g>
    <g class="muscle ${cls("chest")}"><path d="M52 68c6-2 13-2 18 1 3 6 2 13-3 17-6 2-13 1-16-3-2-6-1-11 1-15z"/><path d="M88 68c-6-2-13-2-18 1-3 6-2 13 3 17 6 2 13 1 16-3 2-6 1-11-1-15z"/></g>
    <g class="muscle ${cls("biceps")}"><path d="M30 78c3-1 6 1 7 5l3 12c1 4-1 7-4 8-3 0-6-2-6-6l-2-12c0-4 0-6 2-7z"/><path d="M110 78c-3-1-6 1-7 5l-3 12c-1 4 1 7 4 8 3 0 6-2 6-6l2-12c0-4 0-6-2-7z"/></g>
    <g class="muscle ${cls("abs")}"><path d="M60 92h20c2 0 4 2 4 4v22c0 2-2 4-4 4H60c-2 0-4-2-4-4V96c0-2 2-4 4-4z"/><line x1="70" y1="92" x2="70" y2="122" stroke="#D4D4D4" stroke-width="1"/><line x1="56" y1="102" x2="84" y2="102" stroke="#D4D4D4" stroke-width="1"/><line x1="56" y1="112" x2="84" y2="112" stroke="#D4D4D4" stroke-width="1"/></g>
    <g class="muscle ${cls("quads")}"><path d="M50 138c4-2 9-2 12 1 2 8 1 18-2 26-4 2-9 1-11-2-1-9 0-18 1-25z"/><path d="M90 138c-4-2-9-2-12 1-2 8-1 18 2 26 4 2 9 1 11-2 1-9 0-18-1-25z"/></g>
    <g class="muscle ${cls("calves")}"><path d="M52 176c2-1 5 0 6 3l2 10c1 3-1 6-3 6-3 0-5-2-5-5l-1-10c0-2 0-3 1-4z"/><path d="M88 176c-2-1-5 0-6 3l-2 10c-1 3 1 6 3 6 3 0 5-2 5-5l1-10c0-2 0-3-1-4z"/></g>`;

  const back = `
    <g class="muscle ${cls("traps")}"><path d="M52 46c6-3 12-4 18-4s12 1 18 4c2 3 1 7-2 9-8 2-16 3-24 3s-16-1-24-3c-3-2-4-6-2-9z"/></g>
    <g class="muscle ${cls("shoulders")}"><path d="M40 54c5-2 10-3 15-1 2 4 1 9-3 11-4 2-10 1-13-2-1-3-1-6 1-8z"/><path d="M100 54c-5-2-10-3-15-1-2 4-1 9 3 11 4 2 10 1 13-2 1-3 1-6-1-8z"/></g>
    <g class="muscle ${cls("lats")}"><path d="M50 72c5-2 11-2 15 1 3 8 2 18-2 25-5 2-11 1-14-3-2-8-1-16 1-23z"/><path d="M90 72c-5-2-11-2-15 1-3 8-2 18 2 25 5 2 11 1 14-3 2-8 1-16-1-23z"/></g>
    <g class="muscle ${cls("triceps")}"><path d="M28 76c3-1 6 1 6 4l2 11c1 4-1 7-4 7-2 0-5-2-5-5l-1-11c0-3 0-5 2-6z"/><path d="M112 76c-3-1-6 1-6 4l-2 11c-1 4 1 7 4 7 2 0 5-2 5-5l1-11c0-3 0-5-2-6z"/></g>
    <g class="muscle ${cls("glutes")}"><path d="M54 116c5-2 11-2 15 1 2 5 1 10-3 13-5 2-11 1-14-2-1-5 0-9 2-12z"/><path d="M86 116c-5-2-11-2-15 1-2 5-1 10 3 13 5 2 11 1 14-2 1-5 0-9-2-12z"/></g>
    <g class="muscle ${cls("hamstrings")}"><path d="M52 142c4-1 8 0 10 3 1 8 0 17-3 24-3 1-8 0-10-3-1-8 1-17 3-24z"/><path d="M88 142c-4-1-8 0-10 3-1 8 0 17 3 24 3 1 8 0 10-3 1-8-1-17-3-24z"/></g>
    <g class="muscle ${cls("calves")}"><path d="M52 176c2-1 5 0 6 3l2 10c1 3-1 6-3 6-3 0-5-2-5-5l-1-10c0-2 0-3 1-4z"/><path d="M88 176c-2-1-5 0-6 3l-2 10c-1 3 1 6 3 6 3 0 5-2 5-5l1-10c0-2 0-3-1-4z"/></g>`;

  return `<svg viewBox="0 0 140 210" aria-hidden="true">${face === "back" ? bodyBack : bodyFront}${face === "back" ? back : front}</svg>`;
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
