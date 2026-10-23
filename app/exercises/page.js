"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, isConfigured, ACTIVE_WORKOUT_KEY } from "../../lib/supabase";
import { useSearchParams } from "next/navigation";
import { EXERCISES, FILTERS, catalogById, ensureCatalog, matchesFilter } from "../../lib/catalog";
import { loadDayPlans, saveDayPlan } from "../../lib/dayPlans";
import { useAuth } from "../components/AuthContext";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

const TABS = ["Instructions", "Tips", "Sets & Reps"];

const BODY_IMG = {
  front: "/assets/body-front.jpg",
  back: "/assets/body-back.jpg"
};

const HIGHLIGHTS = {
  front: {
    chest: [{cx:122,cy:130,rx:26,ry:24},{cx:178,cy:130,rx:26,ry:24}],
    shoulders: [{cx:105,cy:118,rx:20,ry:24},{cx:195,cy:118,rx:20,ry:24}],
    biceps: [{cx:88,cy:172,rx:11,ry:22},{cx:212,cy:172,rx:11,ry:22}],
    triceps: [],
    lats: [],
    abs: [{cx:150,cy:205,rx:20,ry:46}],
    traps: [{cx:150,cy:80,rx:34,ry:16}],
    quads: [{cx:126,cy:332,rx:24,ry:52},{cx:174,cy:332,rx:24,ry:52}],
    hamstrings: [],
    glutes: [],
    calves: [{cx:122,cy:472,rx:15,ry:32},{cx:178,cy:472,rx:15,ry:32}]
  },
  back: {
    chest: [],
    shoulders: [{cx:92,cy:118,rx:19,ry:22},{cx:208,cy:118,rx:19,ry:22}],
    biceps: [],
    triceps: [{cx:74,cy:168,rx:11,ry:26},{cx:226,cy:168,rx:11,ry:26}],
    lats: [{cx:106,cy:168,rx:24,ry:38},{cx:194,cy:168,rx:24,ry:38}],
    abs: [],
    traps: [{cx:150,cy:92,rx:42,ry:30}],
    quads: [],
    hamstrings: [{cx:125,cy:352,rx:22,ry:42},{cx:175,cy:352,rx:22,ry:42}],
    glutes: [{cx:125,cy:278,rx:24,ry:28},{cx:175,cy:278,rx:24,ry:28}],
    calves: [{cx:120,cy:460,rx:15,ry:32},{cx:180,cy:460,rx:15,ry:32}]
  }
};

let __hlUid = 0;
function muscleMarkup(ex) {
  const face = ex.view === "back" ? "back" : "front";
  const img = BODY_IMG[face];
  const hl = HIGHLIGHTS[face] || {};
  const hot = ex.hot?.[0] || "";
  const warms = (ex.warm || []).filter((w) => w && w !== hot);
  const uid = ++__hlUid;
  const dots = (names, grad) => names.flatMap((n) => hl[n] || []).map(
    (e) => `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="url(#${grad}-${uid})"/>`
  ).join("");
  return `<div style="position:relative;width:92px;height:184px;overflow:hidden;border-radius:12px;background:#f5f5f4;">`
    + `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    + `<svg viewBox="0 0 300 600" style="position:absolute;inset:0;width:100%;height:100%;" aria-hidden="true">`
    + `<defs>`
    + `<radialGradient id="hotGrad-${uid}"><stop offset="0%" stop-color="rgba(240,55,45,.85)"/><stop offset="70%" stop-color="rgba(240,55,45,.35)"/><stop offset="100%" stop-color="rgba(240,55,45,0)"/></radialGradient>`
    + `<radialGradient id="warmGrad-${uid}"><stop offset="0%" stop-color="rgba(255,150,50,.6)"/><stop offset="70%" stop-color="rgba(255,150,50,.22)"/><stop offset="100%" stop-color="rgba(255,150,50,0)"/></radialGradient>`
    + `</defs>`
    + (warms.length ? dots(warms, "warmGrad") : "")
    + (hot ? dots([hot], "hotGrad") : "")
    + `</svg></div>`;
}






export default function Exercises() {
  return (
    <Suspense fallback={<section className="page"><p className="loading">Loading…</p></section>}>
      <ExercisesInner />
    </Suspense>
  );
}

function ExercisesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const swapDate = params.get("swap");
  const swapIndex = Number(params.get("index") || 0);
  const openName = params.get("open");
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [ids, setIds] = useState({});
  const [openId, setOpenId] = useState(null);
  const [tab, setTab] = useState("Instructions");
  const [motion, setMotion] = useState(false);
  const [motionTime, setMotionTime] = useState(12);
  const [startError, setStartError] = useState("");

  useEffect(() => {
    if (!isConfigured || !user) return;
    getSupabase().then((sb) => ensureCatalog(sb)).then((rows) => {
      const map = {};
      for (const row of rows || []) map[row.name.toLowerCase()] = row.id;
      setIds(map);
    });
  }, [user]);

  useEffect(() => {
    if (!openName) return;
    const hit = EXERCISES.find((e) => e.name === openName);
    if (hit) setOpenId(hit.id);
  }, [openName]);

  const taken = useMemo(() => {
    if (!swapDate || !user) return new Set();
    const plan = loadDayPlans(user.id)[swapDate];
    return new Set(plan?.exerciseIds || []);
  }, [swapDate, user, ids]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      const facet = matchesFilter(e, filter);
      const text = !q || `${e.name} ${e.region} ${e.equipment} ${e.type}`.toLowerCase().includes(q);
      if (swapDate && taken.has(ids[e.name.toLowerCase()])) return false;
      return facet && text;
    });
  }, [query, filter, swapDate, taken, ids]);

  function openRow(ex) {
    if (swapDate && user) {
      const exerciseId = ids[ex.name.toLowerCase()];
      const plan = loadDayPlans(user.id)[swapDate];
      if (!exerciseId || !plan) return;
      const exerciseIds = plan.exerciseIds.slice();
      exerciseIds[swapIndex] = exerciseId;
      saveDayPlan(user.id, swapDate, { ...plan, exerciseIds });
      router.push(`/workout?day=${swapDate}`);
      return;
    }
    setOpenId(ex.id);
  }

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
    setStartError("");
    const supabase = await getSupabase();
    if (!supabase) {
      setStartError("That workout didn't start. Try again.");
      return;
    }
    let exerciseId = ids[ex.name.toLowerCase()];
    if (!exerciseId) {
      const { data } = await supabase.from("exercises").select("id").eq("name", ex.name).maybeSingle();
      exerciseId = data?.id;
    }
    if (!exerciseId) {
      setStartError("That workout didn't start. Try again.");
      return;
    }
    const { data, error } = await supabase
      .from("workouts")
      .insert({ started_at: new Date().toISOString(), user_id: user.id })
      .select("id")
      .single();
    if (error || !data) {
      setStartError("That workout didn't start. Try again.");
      return;
    }
    localStorage.setItem("liftlog-template-exercises", JSON.stringify([exerciseId]));
    localStorage.setItem(ACTIVE_WORKOUT_KEY, data.id);
    router.push("/session");
  }

  if (motion && open) {
    const phase = motionTime < 8 ? "setup" : motionTime < 22 ? "movement" : "finish";
    const cues = open.cues || open.steps;
    const cue = phase === "setup" ? cues[0] : phase === "movement" ? (cues[1] || cues[0]) : cues.at(-1);
    return (
      <section className={`library-keep screen screen-fill motion${open.cinematic ? "" : " is-framed"} is-${phase}`}>
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
      <section className="library-keep screen" data-screen="detail">
        <header className="subhead">
          <button type="button" aria-label="Back" onClick={() => { setOpenId(null); setTab("Instructions"); setStartError(""); }}>
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
          {startError ? <p className="err" role="alert">{startError}</p> : null}
          <button className="btn btn-ink btn-block" type="button" onClick={() => startExercise(open)}>Start Workout</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page draft-lib">
      <ConfigBanner />
      {swapDate ? <button className="text-btn" type="button" onClick={() => router.push(`/workout?day=${swapDate}`)}>Back to day</button> : null}
      <h1>{swapDate ? "Switch exercise" : "Library"}</h1>
      <form className="search-wrap" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="search">
          <img src="/photos/split-bells.jpg" alt="" />
          <input type="search" placeholder="Search exercises..." value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" enterKeyHint="search" />
        </label>
      </form>
      <div className="chips">
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>
      <div>
        {rows.length === 0 ? (
          <p className="empty">No exercise matches that.</p>
        ) : rows.map((e) => (
          <button key={e.id} className="lib" type="button" onClick={() => openRow(e)}>
            <img className="thumb" src={e.thumb} alt="" />
            <span><span className="name">{e.name}</span><span className="eq">{e.primary} · {e.equipment}</span></span>
          </button>
        ))}
      </div>
    </section>
  );
}
