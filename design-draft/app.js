(function () {
  const D = window.LiftData;
  const state = {
    screen: "home",
    tab: "home",
    workTab: "week",
    workDay: "2026-10-22",
    workRoutine: "push-a",
    dayPlans: {},
    swap: null,
    progressTab: "history",
    query: "",
    filter: "All",
    detailId: null,
    sessionId: null,
    returnTo: "home",
    picker: false,
    sheet: null,
    menuEx: null,
    live: null,
    done: null,
    custom: [],
    notice: "",
  };

  const phone = document.getElementById("phone");
  const scroll = document.getElementById("scroll");
  const tabs = document.getElementById("tabs");

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function mins(s) {
    return s.durationLabel || s.minutes + " min";
  }
  function fmt(n) {
    return Math.round(n).toLocaleString("en-US");
  }
  function exercise(id) {
    return D.byId[id] || state.custom.find((e) => e.id === id);
  }
  function allExercises() {
    return D.EXERCISES.concat(state.custom);
  }
  function routine(id) {
    return D.routineById(id);
  }
  function session(id) {
    return D.sessions.find((s) => s.id === id);
  }
  function dateLabel(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dt = new Date(y, m - 1, d);
    return { month: names[m - 1], day: days[dt.getDay()], date: d, year: y };
  }
  function bestSet(list, ex) {
    if (!list || !list.length) return null;
    return list.reduce((best, set) => {
      const score = ex && ex.bodyweight ? set.reps : set.lb * 1000 + set.reps;
      const bestScore = ex && ex.bodyweight ? best.reps : best.lb * 1000 + best.reps;
      return score > bestScore ? set : best;
    });
  }
  function historyFor(id) {
    const rows = [];
    D.sessions.forEach((s) => {
      if (!s.exercises) return;
      const found = s.exercises.find((e) => e.id === id);
      if (found) rows.push({ date: s.date, sets: found.sets, sessionId: s.id });
    });
    return rows;
  }
  function lastPerformance(id) {
    const rows = historyFor(id);
    return rows.length ? rows[rows.length - 1] : null;
  }
  function formatSet(ex, set) {
    if (!set) return "—";
    if (ex.bodyweight) return set.reps + " reps";
    if (ex.perHand) return set.lb + "×" + set.reps;
    return set.lb + "×" + set.reps;
  }
  function heaviest(id) {
    let best = null;
    historyFor(id).forEach((row) => {
      row.sets.forEach((set) => {
        const ex = exercise(id);
        if (!best) best = { ...set, date: row.date };
        else if (ex.bodyweight ? set.reps > best.reps : set.lb > best.lb || (set.lb === best.lb && set.reps > best.reps)) {
          best = { ...set, date: row.date };
        }
      });
    });
    return best;
  }

  function go(screen, extra) {
    Object.assign(state, extra || {});
    state.screen = screen;
    if (["home", "workouts", "library", "progress"].includes(screen)) state.tab = screen;
    state.sheet = null;
    render();
    scroll.scrollTop = 0;
  }

  function startRoutine(routineId, sample, exerciseIds) {
    const r = routine(routineId);
    const ids = exerciseIds && exerciseIds.length ? exerciseIds : r.exerciseIds;
    state.live = {
      routineId,
      name: r.name,
      focus: r.focus,
      startedAt: sample ? Date.now() - 18 * 60 * 1000 : Date.now(),
      restUntil: sample ? Date.now() + 72 * 1000 : 0,
      restTotal: 75,
      exercises: ids.map((id, index) => {
        const prev = lastPerformance(id);
        const seed = prev ? prev.sets : [{ lb: exercise(id).bodyweight ? 0 : 45, reps: 8 }];
        return {
          id,
          sets: seed.map((set, setIndex) => ({
            lb: set.lb,
            reps: set.reps,
            done: Boolean(sample && index === 0 && setIndex < 2),
          })),
        };
      }),
    };
    state.done = null;
    go("active");
  }

  function liveVolume(onlyDone) {
    if (!state.live) return 0;
    return state.live.exercises.reduce((sum, ex) => {
      const sets = onlyDone ? ex.sets.filter((s) => s.done) : ex.sets;
      return sum + D.volumeOf(ex.id, sets);
    }, 0);
  }
  function liveCounts() {
    const all = state.live.exercises.reduce((n, ex) => n + ex.sets.length, 0);
    const done = state.live.exercises.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0);
    return { all, done };
  }
  function logged() {
    return state.live && (liveCounts().done > 0 || state.live.touched);
  }

  function finish() {
    const counts = liveCounts();
    if (!counts.done) {
      state.sheet = "empty";
      render();
      return;
    }
    const elapsed = Math.max(0, Math.floor((Date.now() - state.live.startedAt) / 1000));
    const minutes = Math.floor(elapsed / 60);
    const durationLabel = minutes < 1 ? elapsed + " sec" : minutes + " min";
    const exercises = state.live.exercises
      .map((ex) => ({ id: ex.id, sets: ex.sets.filter((s) => s.done).map(({ lb, reps }) => ({ lb, reps })) }))
      .filter((ex) => ex.sets.length);
    const volume = exercises.reduce((sum, ex) => sum + D.volumeOf(ex.id, ex.sets), 0);
    const records = [];
    exercises.forEach((ex) => {
      const meta = exercise(ex.id);
      const prior = heaviest(ex.id);
      const now = bestSet(ex.sets, meta);
      if (!prior) return;
      const beat = meta.bodyweight ? now.reps > prior.reps : now.lb > prior.lb;
      if (beat) records.push({ id: ex.id, set: now, prior });
    });
    const id = "s-" + Date.now();
    D.sessions.push({
      id,
      date: D.TODAY,
      routineId: state.live.routineId,
      name: state.live.name,
      minutes,
      durationLabel,
      exercises,
      volume,
      setCount: counts.done,
      exerciseCount: exercises.length,
    });
    state.done = { id, minutes, durationLabel, volume, setCount: counts.done, exercises, records, name: state.live.name };
    state.live = null;
    go("complete");
  }

  function discard() {
    state.live = null;
    state.sheet = null;
    go("home");
  }

  function icon(name) {
    const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
    const paths = {
      today: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3.5v3M16 3.5v3M4 10h16"/>',
      workouts: '<path d="M5 7h14M5 12h14M5 17h9"/>',
      library: '<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
      progress: '<path d="M4 16l4-5 4 3 6-7"/><path d="M4 19h16"/>',
      check: '<path d="M6 12.5l4 4 8-9"/>',
      more: '<circle cx="6" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1" fill="currentColor" stroke="none"/>',
      signal: '<path d="M3 18h2v-3H3zM8 18h2V11H8zM13 18h2V7h-2zM18 18h2V4h-2z" fill="currentColor" stroke="none"/>',
      play: '<path d="M9 7.5v9l8-4.5-8-4.5z" fill="currentColor" stroke="none"/>',
    };
    return `<svg ${common} aria-hidden="true">${paths[name]}</svg>`;
  }

  function thumb(ex, large) {
    if (ex.photo) return `<img class="${large ? "" : "thumb"}" src="${esc(ex.photo)}" alt="${esc(ex.name)}">`;
    return `<div class="still-empty"${large ? ' style="width:100%;height:100%;border-radius:0"' : ""}>No still</div>`;
  }

  function ringSvg(pct, size, hue) {
    const r = 42;
    const c = 2 * Math.PI * r;
    const dash = Math.max(0, Math.min(1, pct)) * c;
    return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true"><circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--control)" stroke-width="12"/><circle cx="60" cy="60" r="${r}" fill="none" stroke="${hue ? "var(--hue)" : "var(--text)"}" stroke-width="12" stroke-dasharray="${dash.toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 60 60)"/></svg>`;
  }

  function setLine(ex, sets) {
    if (!sets || !sets.length) return "—";
    const body = sets.map((set) => (ex.bodyweight ? `${set.reps} reps` : `${set.lb}×${set.reps}`)).join(", ");
    return ex.perHand ? `${body} / hand` : body;
  }

  function home() {
    const today = D.week.find((d) => d.today);
    const loggedToday = D.sessions.find((s) => s.date === today.date);
    const todayPlan = state.dayPlans[today.date];
    const r = todayPlan ? routine(todayPlan.routineId) : routine(loggedToday ? loggedToday.routineId : today.routineId);
    const todayIds = todayPlan ? todayPlan.exerciseIds : r.exerciseIds;
    const lastSession = [...D.sessions].reverse().find((s) => s.date < today.date);
    const when = dateLabel(today.date);
    const places = [
      { go: "workouts", worktab: "routines", src: "photos/split-bells.jpg", focus: "center", name: "Split", line: "Push, Pull, Legs" },
      { go: "library", src: "photos/library-you.jpg?v=13", focus: "center 39%", name: "Library", line: `${allExercises().length} exercises` },
      { go: "progress", progtab: "history", src: "photos/progress-pullup.jpg", focus: "center 22%", name: "Progress", line: `${fmt(D.thisWeekVolume)} lb this week` },
    ];
    const tiles = places.map((place) => {
      const attrs = [`data-go="${esc(place.go)}"`];
      if (place.worktab) attrs.push(`data-worktab="${esc(place.worktab)}"`);
      if (place.progtab) attrs.push(`data-progtab="${esc(place.progtab)}"`);
      return `<button type="button" class="tile" ${attrs.join(" ")}><img src="${esc(place.src)}" alt="" style="object-position:${esc(place.focus)}"><span class="tile-copy"><span class="name">${esc(place.name)}</span><span class="sets">${esc(place.line)}</span></span></button>`;
    }).join("");
    const lastWhen = lastSession ? dateLabel(lastSession.date) : null;
    const play = loggedToday
      ? `<button class="play" data-session="${esc(loggedToday.id)}" aria-label="View workout">${icon("play")}</button>`
      : `<button class="play" data-action="start" data-routine="${esc(r.id)}" data-date="${esc(today.date)}" aria-label="Start workout">${icon("play")}</button>`;
    const line = loggedToday
      ? `Logged ${esc(mins(loggedToday))}`
      : `${todayIds.length} exercises · ${esc(r.focus)}`;
    const destinations = [
      { go: "workouts", worktab: "routines", icon: "workouts", name: "Routines", line: "The split" },
      { go: "progress", progtab: "history", icon: "progress", name: "History", line: `${D.sessions.length} workouts` },
      { go: "library", icon: "library", name: "Exercises", line: `${allExercises().length} in the library` },
      { session: lastSession && lastSession.id, icon: "today", name: "Last session", line: lastSession ? `${lastSession.name} · ${lastWhen.day} ${lastWhen.date}` : "None yet" },
    ];
    const grid = destinations.map((item) => {
      const attrs = [];
      if (item.session) attrs.push(`data-session="${esc(item.session)}"`);
      else if (item.go) {
        attrs.push(`data-go="${esc(item.go)}"`);
        if (item.worktab) attrs.push(`data-worktab="${esc(item.worktab)}"`);
        if (item.progtab) attrs.push(`data-progtab="${esc(item.progtab)}"`);
      }
      return `<button type="button" class="dest" ${attrs.join(" ")}>${icon(item.icon)}<span><span class="name">${esc(item.name)}</span><span class="sets">${esc(item.line)}</span></span></button>`;
    }).join("");
    return `
      <p class="home-day">${esc(when.day)} ${when.date} ${esc(when.month)}</p>
      <div class="tiles">${tiles}</div>
      <div class="home-picks">${splitPicks(today.date, r.id)}</div>
      <section class="ready">
        <div>
          <p class="ready-label">Ready to train</p>
          <h1>${esc(r.name)}</h1>
          <p class="sub">${line}</p>
        </div>
        ${play}
      </section>
      <div class="dests">${grid}</div>`;
  }

  function homeTrend() {
    const bars = weekSeries().slice(-4);
    const max = 40000;
    const w = 320;
    const h = 128;
    const left = 36;
    const slot = (w - left - 8) / bars.length;
    const innerH = h - 28;
    const rects = bars.map((bar, i) => {
      const bh = Math.max(2, Math.round((innerH * bar.volume) / max));
      const bw = 28;
      const x = left + i * slot + (slot - bw) / 2;
      const y = 8 + innerH - bh;
      return `<rect x="${x.toFixed(1)}" y="${y}" width="${bw}" height="${bh}" fill="${bar.current ? "var(--hue)" : "var(--text)"}"></rect><text class="axis" text-anchor="middle" x="${(x + bw / 2).toFixed(1)}" y="${h - 6}">${esc(bar.label)}</text>`;
    }).join("");
    const ticks = [0, 20000, 40000].map((t) => {
      const y = 8 + innerH - (innerH * t) / max;
      const label = t === 0 ? "0" : `${t / 1000}k`;
      return `<text class="axis" x="0" y="${y + 3}">${label}</text>`;
    }).join("");
    return `<div class="bars"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Loaded volume for the last four weeks, in pounds">${ticks}${rects}</svg></div><p class="cap">Pounds. This week is the colored bar, one session in.</p>`;
  }

  function moveRows(ids, performed, swapDate) {
    const byId = {};
    (performed || []).forEach((ex) => { byId[ex.id] = ex.sets; });
    return ids.map((id, index) => {
      const ex = exercise(id);
      const sets = byId[id] || (lastPerformance(id) && lastPerformance(id).sets);
      const count = sets ? sets.length : 0;
      const top = sets ? bestSet(sets, ex) : null;
      const line = count ? `${count} ${count === 1 ? "set" : "sets"} · ${formatSet(ex, top)}${ex.perHand ? " / hand" : ""}` : "No sets yet";
      const pic = ex.photo ? `<img src="${esc(ex.photo)}" alt="">` : `<span class="move-blank"></span>`;
      const swap = swapDate ? `<button type="button" class="swap" data-swap="${index}" data-date="${esc(swapDate)}">Switch</button>` : "";
      return `<div class="move"><button type="button" class="move-open" data-open="${esc(id)}">${pic}<span class="move-copy"><span class="name">${esc(ex.name)}</span><span class="sets">${esc(line)}</span></span></button>${swap}</div>`;
    }).join("");
  }

  function splitPicks(date, selectedId) {
    return `<div class="picks">${D.ROUTINES.map((r) => {
      const label = r.name === "Push" ? r.detail : r.name;
      return `<button type="button" aria-pressed="${r.id === selectedId}" data-dayroutine="${esc(r.id)}" data-date="${esc(date)}">${esc(label)}</button>`;
    }).join("")}</div>`;
  }

  function planFor(day) {
    if (!state.dayPlans[day.date]) {
      if (day.rest) return null;
      const r = routine(day.routineId);
      state.dayPlans[day.date] = { routineId: r.id, exerciseIds: r.exerciseIds.slice() };
    }
    return state.dayPlans[day.date];
  }

  function workouts() {
    const tabsel = ["week", "routines", "recent"].map((id) => {
      const label = { week: "This week", routines: "Routines", recent: "Recent" }[id];
      return `<button role="tab" aria-selected="${state.workTab === id}" data-work="${id}">${label}</button>`;
    }).join("");
    let body = "";
    if (state.workTab === "week") {
      const selected = D.week.find((d) => d.date === state.workDay) || D.week.find((d) => d.today);
      const strip = D.week.map((d) => {
        const done = D.sessions.some((s) => s.date === d.date);
        return `<button type="button" data-pickday="${esc(d.date)}" aria-pressed="${d.date === selected.date}" data-rest="${d.rest ? "true" : "false"}" data-done="${done ? "true" : "false"}"><span>${esc(d.dow)}</span><span class="date num">${d.day}</span></button>`;
      }).join("");
      const when = dateLabel(selected.date);
      const kicker = selected.today ? "Today" : `${when.day} ${when.date}`;
      const done = D.sessions.find((s) => s.date === selected.date);
      let plan = "";
      if (done) {
        const r = routine(done.routineId);
        plan = `<h2 class="day-title">${esc(r.name)}</h2><p class="day-sub">${esc(kicker)} · <span class="num">${fmt(done.volume)} lb</span> · ${esc(mins(done))} · ${done.setCount} sets</p><div class="moves">${moveRows(done.exercises ? done.exercises.map((ex) => ex.id) : r.exerciseIds, done.exercises)}</div><button class="primary" data-session="${esc(done.id)}">View workout</button>`;
      } else {
        const saved = planFor(selected);
        if (!saved) {
          plan = `${splitPicks(selected.date, "")}<h2 class="day-title">Rest</h2><p class="day-sub">${esc(kicker)}. Choose a workout for this day.</p>`;
        } else {
          const r = routine(saved.routineId);
          plan = `${splitPicks(selected.date, saved.routineId)}<h2 class="day-title">${esc(r.name)}</h2><p class="day-sub">${esc(kicker)} · ${saved.exerciseIds.length} exercises · ${esc(r.focus)}</p><div class="moves">${moveRows(saved.exerciseIds, null, selected.date)}</div><button class="primary" data-action="start" data-routine="${esc(r.id)}" data-date="${esc(selected.date)}">Start workout</button>`;
        }
      }
      body = `<div class="switch" role="group" aria-label="Days">${strip}</div>${plan}`;
    } else if (state.workTab === "routines") {
      const current = routine(state.workRoutine) || D.ROUTINES[0];
      const picks = D.ROUTINES.map((r) => {
        const label = r.name === "Push" ? r.detail : r.name;
        return `<button type="button" aria-pressed="${r.id === current.id}" data-routinepick="${esc(r.id)}">${esc(label)}</button>`;
      }).join("");
      body = `<div class="picks">${picks}</div><h2 class="day-title">${esc(current.name)}</h2><p class="day-sub">${esc(current.detail)} · ${esc(current.focus)}</p><div class="moves">${moveRows(current.exerciseIds)}</div><button class="primary" data-action="start" data-routine="${esc(current.id)}">Start workout</button>`;
    } else {
      let month = "";
      body = D.sessions.slice().reverse().map((s, i) => {
        const when = dateLabel(s.date);
        const head = when.month !== month ? `<h2 class="work-month">${esc(when.month)}</h2>` : "";
        month = when.month;
        return `${head}<button class="log" data-latest="${i === 0 ? "true" : "false"}" data-session="${esc(s.id)}"><span class="log-name">${esc(s.name)}</span><span class="log-vol num">${fmt(s.volume)} lb</span><span class="log-meta">${esc(when.day)} ${when.date} · ${esc(mins(s))} · ${s.setCount} sets</span></button>`;
      }).join("");
    }
    return `<div class="work"><h1>Workouts</h1><div class="seg" role="tablist">${tabsel}</div>${body}</div>`;
  }

  function library() {
    const chips = ["All", "Chest", "Back", "Shoulders", "Arms", "Legs", "Barbell", "Dumbbells", "Cable", "Machine", "Bodyweight"];
    const q = state.query.trim().toLowerCase();
    const list = allExercises().filter((ex) => {
      const hit = !q || ex.name.toLowerCase().includes(q);
      if (!hit) return false;
      if (state.filter === "All") return true;
      return ex.region === state.filter || ex.equipment === state.filter;
    });
    const swapping = state.swap;
    const taken = swapping ? new Set((state.dayPlans[swapping.date] || { exerciseIds: [] }).exerciseIds) : null;
    const rows = list.filter((ex) => !taken || !taken.has(ex.id)).map((ex) => {
      const attr = swapping ? `data-swapto="${esc(ex.id)}"` : `data-open="${esc(ex.id)}"`;
      return `<button class="lib" ${attr}>${thumb(ex)}<span><span class="name">${esc(ex.name)}</span><span class="eq">${esc(ex.primary)} · ${esc(ex.equipment)}</span></span></button>`;
    }).join("");
    const chipHtml = chips.map((c) => `<button type="button" aria-pressed="${state.filter === c}" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
    const back = state.swap
      ? `<button class="back" data-action="back">Back to day</button>`
      : state.picker ? `<button class="back" data-action="back">Back to workout</button>` : "";
    return `
      ${back}
      <h1>${state.swap ? "Switch exercise" : "Library"}</h1>
      <div class="block">
        <input class="search" type="search" placeholder="Search exercises" value="${esc(state.query)}" data-search>
      </div>
      <div class="chips">${chipHtml}</div>
      ${rows || `<p class="empty">No exercise matches that.</p>`}
      <button class="texty" data-action="new-exercise">New exercise</button>`;
  }

  function detail() {
    const ex = exercise(state.detailId);
    const rows = historyFor(ex.id);
    const best = heaviest(ex.id);
    const inLive = state.live && state.live.exercises.some((e) => e.id === ex.id);
    const action = state.picker
      ? (inLive ? "" : `<button class="primary" data-action="add-live" data-id="${esc(ex.id)}">Add to workout</button>`)
      : (inLive ? `<p class="meta">Already in this workout.</p>` : `<button class="primary" data-action="add-today" data-id="${esc(ex.id)}">Add to Thursday</button>`);
    const hist = rows.slice().reverse().map((row) => {
      const top = bestSet(row.sets, ex);
      const when = dateLabel(row.date);
      return `<button class="hist" data-session="${esc(row.sessionId)}"><div class="top"><span>${when.date} ${esc(when.month)}</span><span class="num">${esc(formatSet(ex, top))}</span></div><p class="sub">${row.sets.length} sets</p></button>`;
    }).join("");
    const chart = chartFor(ex);
    return `
      <button class="back" data-action="back">Back</button>
      <div class="hero-still">${ex.photo ? `<img src="${esc(ex.photo)}" alt="${esc(ex.name)}">` : `<p>${esc(ex.photoNote || "No still")}</p>`}</div>
      <h1>${esc(ex.name)}</h1>
      <p class="sub">${esc(ex.primary)}${ex.secondary ? " · " + esc(ex.secondary) : ""}</p>
      <p class="meta">${esc(ex.equipment)}${ex.perHand ? " · weight is per hand" : ""}${ex.bodyweight ? " · body weight, reps only" : ""}</p>
      ${ex.photoNote ? `<p class="note">${esc(ex.photoNote)}</p>` : ""}
      ${best ? `<p class="meta">Heaviest so far ${esc(formatSet(ex, best))} on ${dateLabel(best.date).date} ${esc(dateLabel(best.date).month)}.</p>` : `<p class="meta">No sets logged for this exercise in the sample.</p>`}
      ${action}
      <h2 class="block" style="font-size:16px">How to set up</h2>
      <ol class="steps">${ex.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      ${chart}
      ${hist ? `<h2 class="block" style="font-size:16px">Recent sets</h2>${hist}` : ""}`;
  }

  function chartFor(ex) {
    const rows = historyFor(ex.id);
    if (rows.length < 2 || ex.bodyweight) return "";
    const values = rows.map((row) => Math.max(...row.sets.map((s) => s.lb)));
    const max = Math.max(...values, 1);
    const w = 320;
    const h = 140;
    const pad = 28;
    const gap = 18;
    const bw = (w - pad - gap) / values.length - 8;
    const bars = values.map((v, i) => {
      const bh = Math.round(((h - 36) * v) / max);
      const x = pad + i * ((w - pad) / values.length);
      const y = h - 22 - bh;
      const hue = i === values.length - 1;
      return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${hue ? "var(--hue)" : "var(--text)"}"></rect><text class="axis" x="${x}" y="${h - 6}">${dateLabel(rows[i].date).date}</text>`;
    }).join("");
    return `<h2 class="block" style="font-size:16px">Heaviest weight</h2><div class="bars"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Heaviest weight in pounds">${bars}<text class="axis" x="0" y="12">${fmt(max)} lb</text></svg></div><p class="cap">Pounds${ex.perHand ? " per hand" : ""}. The latest session is marked.</p>`;
  }

  function weekSeries() {
    const fromSessions = {};
    D.sessions.forEach((s) => {
      const start = weekStart(s.date);
      fromSessions[start] = (fromSessions[start] || 0) + s.volume;
    });
    const bars = D.earlierWeeks.map((w) => ({ label: w.label, volume: w.volume, current: false }));
    Object.keys(fromSessions).sort().forEach((start) => {
      const [, m, d] = start.split("-");
      bars.push({ label: `${Number(d)} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(m) - 1]}`, volume: fromSessions[start], current: start === "2026-10-19" });
    });
    return bars;
  }
  function weekStart(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    const day = (dt.getDay() + 6) % 7;
    dt.setDate(dt.getDate() - day);
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${dt.getFullYear()}-${mm}-${dd}`;
  }

  function volumeChart() {
    const bars = weekSeries();
    const max = 40000;
    const w = 340;
    const h = 180;
    const left = 44;
    const bottom = 28;
    const innerW = w - left - 8;
    const innerH = h - bottom - 12;
    const slot = innerW / bars.length;
    const rects = bars.map((bar, i) => {
      const bh = Math.round((innerH * bar.volume) / max);
      const bw = Math.min(28, slot - 10);
      const x = left + i * slot + (slot - bw) / 2;
      const y = 12 + innerH - bh;
      return `<rect x="${x.toFixed(1)}" y="${y}" width="${bw.toFixed(1)}" height="${bh}" fill="${bar.current ? "var(--hue)" : "var(--text)"}"></rect><text class="axis" text-anchor="middle" x="${(x + bw / 2).toFixed(1)}" y="${h - 8}">${esc(bar.label.split(" ")[0])}</text>`;
    }).join("");
    const ticks = [0, 20000, 40000].map((t) => {
      const y = 12 + innerH - (innerH * t) / max;
      return `<text class="axis" x="0" y="${y + 4}">${t === 0 ? "0" : fmt(t / 1000) + "k"}</text><line x1="${left}" y1="${y}" x2="${w - 8}" y2="${y}" stroke="var(--rule)"></line>`;
    }).join("");
    const current = bars.find((b) => b.current);
    const doneDays = D.week.filter((d) => !d.rest && D.sessions.some((s) => s.date === d.date)).length;
    const planned = D.week.filter((d) => !d.rest).length;
    return `<div class="figure">${fmt(current.volume)}<span>lb</span></div><p class="meta">Loaded volume this week, ${doneDays} of ${planned} sessions. Last full week was ${fmt(D.lastWeekVolume)} lb.</p><div class="bars"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Weekly loaded volume in pounds">${ticks}${rects}</svg></div><p class="cap">Thousands of pounds. This week is the only colored bar. Pull-ups are excluded.</p>`;
  }

  function records() {
    const ids = ["barbell-bench-press", "back-squat", "barbell-deadlift", "shoulder-press"];
    return ids.map((id) => {
      const ex = exercise(id);
      const best = heaviest(id);
      if (!best) return "";
      const when = dateLabel(best.date);
      return `<button class="pr" data-open="${esc(id)}"><span>${esc(ex.short)}<span class="eq"> · ${when.date} ${esc(when.month)}</span></span><b>${esc(formatSet(ex, best))}${ex.perHand ? " / hand" : ""}</b></button>`;
    }).join("");
  }

  function progress() {
    const tabsel = ["history", "strength"].map((id) => `<button role="tab" aria-selected="${state.progressTab === id}" data-progress="${id}">${id === "history" ? "History" : "Strength"}</button>`).join("");
    if (state.progressTab === "strength") {
      return `<h1>Progress</h1><div class="seg" role="tablist">${tabsel}</div><section class="block"><h2 style="font-size:16px">Weekly volume</h2>${volumeChart()}</section><section class="block"><h2 style="font-size:16px">Heaviest sets</h2><div style="margin-top:8px">${records()}</div><p class="cap">From sessions that include a set list. Earlier days in the chart are weekly totals.</p></section>`;
    }
    const groups = {};
    D.sessions.forEach((s) => {
      const key = s.date.slice(0, 7);
      (groups[key] || (groups[key] = [])).push(s);
    });
    const html = Object.keys(groups).sort().reverse().map((key) => {
      const rows = groups[key].slice().reverse();
      const total = rows.reduce((sum, s) => sum + s.volume, 0);
      const [y, m] = key.split("-");
      const name = dateLabel(`${key}-01`).month;
      const items = rows.map((s) => {
        const when = dateLabel(s.date);
        return `<button class="hist" data-session="${esc(s.id)}"><div class="top"><span>${esc(s.name)}</span><span class="num">${fmt(s.volume)} lb</span></div><p class="sub">${esc(when.day)} ${when.date} · ${esc(mins(s))} · ${s.exerciseCount} exercises</p></button>`;
      }).join("");
      return `<p class="month">${esc(name)} ${y} · ${rows.length} workouts · ${fmt(total)} lb</p>${items}`;
    }).join("");
    return `<h1>Progress</h1><div class="seg" role="tablist">${tabsel}</div>${html}`;
  }

  function sessionView() {
    const s = session(state.sessionId);
    const when = dateLabel(s.date);
    let body;
    if (!s.exercises) {
      body = `<p class="meta">Set list was not included for this day. Loaded volume is ${fmt(s.volume)} lb across ${s.exerciseCount} exercises.</p>`;
    } else {
      body = s.exercises.map((ex) => {
        const meta = exercise(ex.id);
        const lines = ex.sets.map((set, i) => `<div class="set"><span class="num">${i + 1}</span><span class="prev"></span><span class="num">${meta.bodyweight ? "BW" : set.lb}</span><span class="num">${set.reps}</span><span></span></div>`).join("");
        return `<section class="lift"><div class="lift-head">${thumb(meta)}<div><strong>${esc(meta.name)}</strong><p class="eq">${fmt(D.volumeOf(ex.id, ex.sets))} lb</p></div></div><div class="cols"><span>#</span><span></span><span>${meta.perHand ? "lb/hand" : "lb"}</span><span>Reps</span><span></span></div>${lines}</section>`;
      }).join("");
    }
    return `<button class="back" data-action="back">Back</button><h1>${esc(s.name)}</h1><p class="date">${esc(when.day)} ${when.date} ${esc(when.month)}</p><div class="summary"><div><div class="k">Duration</div><div class="v">${esc(mins(s))}</div></div><div><div class="k">Sets</div><div class="v">${s.setCount}</div></div><div><div class="k">Volume</div><div class="v">${fmt(s.volume)}<span> lb</span></div></div></div>${body}`;
  }

  function active() {
    const live = state.live;
    const counts = liveCounts();
    const elapsed = Math.floor((Date.now() - live.startedAt) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const ss = String(elapsed % 60).padStart(2, "0");
    const blocks = live.exercises.map((ex, exIndex) => {
      const meta = exercise(ex.id);
      const prev = lastPerformance(ex.id);
      const sets = ex.sets.map((set, i) => {
        const previous = prev && prev.sets[i] ? formatSet(meta, prev.sets[i]) : "—";
        const current = !set.done && ex.sets.slice(0, i).every((s) => s.done);
        return `<div class="set${current ? " current" : ""}">
          <span class="num">${i + 1}</span>
          <span class="prev">${esc(previous)}</span>
          ${meta.bodyweight ? `<span class="num">BW</span>` : `<input inputmode="decimal" aria-label="Weight, set ${i + 1}" value="${set.lb}" data-lb="${exIndex}:${i}">`}
          <input inputmode="numeric" aria-label="Reps, set ${i + 1}" value="${set.reps}" data-reps="${exIndex}:${i}">
          <button class="check" aria-pressed="${set.done}" aria-label="${set.done ? "Completed" : "Complete"} set ${i + 1}" data-check="${exIndex}:${i}">${set.done ? icon("check") : ""}</button>
        </div>`;
      }).join("");
      return `<section class="lift">
        <div class="lift-head">${thumb(meta)}<button class="back" style="text-align:left" data-open="${esc(ex.id)}"><strong>${esc(meta.name)}</strong><span class="eq">${esc(meta.equipment)}${meta.perHand ? " · per hand" : ""}</span></button><button class="more" aria-label="Exercise actions" data-menu="${exIndex}">${icon("more")}</button></div>
        <div class="cols"><span>#</span><span>Previous</span><span>${meta.perHand ? "lb/hand" : "lb"}</span><span>Reps</span><span></span></div>
        ${sets}
        <button class="addset" data-add-set="${exIndex}">Add set</button>
      </section>`;
    }).join("");
    const ratio = counts.all ? Math.round((counts.done / counts.all) * 100) : 0;
    return `
      <div class="workout-head">
        <button class="texty" data-action="end">End</button>
        <h1>${esc(live.name)}</h1>
        <div class="clock" data-clock>${mm}:${ss}</div>
      </div>
      <div class="progress-line" aria-hidden="true"><span style="width:${ratio}%"></span></div>
      <p class="count">${counts.done} of ${counts.all} sets · ${fmt(liveVolume(true))} lb logged</p>
      ${blocks}
      <button class="texty" data-action="add">Add exercise</button>`;
  }

  function restDock() {
    if (!state.live || !state.live.restUntil || state.live.restUntil <= Date.now()) return "";
    const left = Math.ceil((state.live.restUntil - Date.now()) / 1000);
    const m = Math.floor(left / 60);
    const s = String(left % 60).padStart(2, "0");
    return `<div class="rest" role="status"><div class="line"><span>Rest</span><span class="remain" data-rest>${m}:${s}</span></div><div class="tools"><button type="button" data-rest-bump="-15">−15 sec</button><button type="button" data-rest-bump="15">+15 sec</button><button type="button" data-action="skip-rest">Skip</button></div></div>`;
  }

  function complete() {
    const d = state.done;
    const when = dateLabel(D.TODAY);
    const rows = d.exercises.map((ex) => {
      const meta = exercise(ex.id);
      const top = bestSet(ex.sets, meta);
      return `<button class="ex" data-open="${esc(ex.id)}"><span class="name">${esc(meta.name)}</span><span class="last num">${esc(formatSet(meta, top))}</span></button>`;
    }).join("");
    const pr = d.records.length
      ? `<h2 class="block" style="font-size:16px">Personal best</h2>` + d.records.map((r) => `<p class="meta">${esc(exercise(r.id).name)} · ${esc(formatSet(exercise(r.id), r.set))}${exercise(r.id).perHand ? " / hand" : ""} · heaviest, up from ${esc(formatSet(exercise(r.id), r.prior))}</p>`).join("")
      : `<p class="block meta">No personal bests. The top sets matched or stayed under the sample history.</p>`;
    return `
      <h1>${esc(d.name)}</h1>
      <p class="date">${esc(when.day)} ${when.date} ${esc(when.month)}</p>
      <div class="summary">
        <div><div class="k">Duration</div><div class="v">${esc(d.durationLabel || d.minutes + " min")}</div></div>
        <div><div class="k">Sets</div><div class="v">${d.setCount}</div></div>
        <div><div class="k">Volume</div><div class="v">${fmt(d.volume)}<span> lb</span></div></div>
      </div>
      <div class="plan">${rows}</div>
      ${pr}
      <div class="row-actions">
        <button class="secondary" data-session="${esc(d.id)}">View workout</button>
        <button class="primary" data-action="done">Done</button>
      </div>`;
  }

  function sheet() {
    if (state.sheet === "end") {
      return `<div class="sheet"><div class="panel" role="dialog" aria-labelledby="sheet-title"><h2 id="sheet-title">End workout?</h2><p class="meta">Logged sets stay only if you finish.</p><button class="texty" data-action="finish">Finish workout</button><button class="danger" data-action="ask-discard">Discard workout</button><button class="texty" data-action="close-sheet">Keep going</button></div></div>`;
    }
    if (state.sheet === "discard") {
      return `<div class="sheet"><div class="panel" role="dialog"><h2>Discard this workout?</h2><p class="meta">Logged sets will not be saved.</p><button class="danger" data-action="discard">Discard</button><button class="texty" data-action="close-sheet">Keep going</button></div></div>`;
    }
    if (state.sheet === "empty") {
      return `<div class="sheet"><div class="panel" role="dialog"><h2>No sets logged</h2><p class="meta">Finish needs at least one completed set.</p><button class="danger" data-action="discard">Discard workout</button><button class="texty" data-action="close-sheet">Keep going</button></div></div>`;
    }
    if (state.sheet === "menu") {
      const ex = state.live.exercises[state.menuEx];
      const meta = exercise(ex.id);
      return `<div class="sheet"><div class="panel" role="dialog" aria-label="${esc(meta.name)}"><h2>${esc(meta.name)}</h2><button class="texty" data-action="up">Move up</button><button class="texty" data-action="down">Move down</button><button class="texty" data-action="drop-set">Remove last set</button><button class="danger" data-action="ask-remove">Remove exercise</button><button class="texty" data-action="close-sheet">Close</button></div></div>`;
    }
    if (state.sheet === "remove") {
      const meta = exercise(state.live.exercises[state.menuEx].id);
      return `<div class="sheet"><div class="panel" role="dialog"><h2>Remove ${esc(meta.name)}?</h2><p class="meta">Its sets leave this workout.</p><button class="danger" data-action="remove">Remove</button><button class="texty" data-action="close-sheet">Cancel</button></div></div>`;
    }
    if (state.sheet === "new") {
      return `<div class="sheet"><form class="panel" data-form="custom"><h2>New exercise</h2><label class="field">Name<input name="name" required maxlength="40"></label><label class="field">Muscle<select name="region"><option>Chest</option><option>Back</option><option>Shoulders</option><option>Arms</option><option>Legs</option></select></label><label class="field">Equipment<select name="equipment"><option>Barbell</option><option>Dumbbells</option><option>Cable</option><option>Machine</option><option>Bodyweight</option></select></label><button class="primary" type="submit">Save exercise</button><button class="texty" type="button" data-action="close-sheet">Cancel</button></form></div>`;
    }
    return "";
  }

  function render() {
    const cover = state.screen === "active" || state.screen === "complete";
    phone.dataset.mode = cover ? "workout" : "browse";
    phone.dataset.cover = cover || state.picker ? "true" : "false";
    const resting = Boolean(state.live && state.live.restUntil > Date.now() && state.screen === "active");
    phone.dataset.rest = resting ? "true" : "false";
    tabs.hidden = cover || state.picker;
    const views = { home, workouts, library, progress, detail, session: sessionView, active, complete };
    scroll.innerHTML = (views[state.screen] || home)() + (state.screen === "active" ? restDock() : "") + sheet();
    tabs.querySelectorAll("button").forEach((b) => {
      if (b.dataset.tab === state.tab) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    document.querySelectorAll(".index button").forEach((b) => {
      if (b.dataset.jump === state.screen) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    bind();
  }

  function bind() {
    scroll.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", () => {
      const extra = {};
      if (el.dataset.worktab) extra.workTab = el.dataset.worktab;
      if (el.dataset.progtab) extra.progressTab = el.dataset.progtab;
      go(el.dataset.go, extra);
    }));
    scroll.querySelectorAll("[data-open]").forEach((el) => el.addEventListener("click", () => {
      state.returnTo = state.screen;
      go("detail", { detailId: el.dataset.open });
    }));
    scroll.querySelectorAll("[data-session]").forEach((el) => el.addEventListener("click", () => {
      state.returnTo = state.screen === "complete" ? "progress" : state.screen;
      go("session", { sessionId: el.dataset.session });
    }));
    scroll.querySelectorAll("[data-action]").forEach((el) => el.addEventListener("click", () => onAction(el)));
    scroll.querySelectorAll("[data-work]").forEach((el) => el.addEventListener("click", () => { state.workTab = el.dataset.work; render(); }));
    scroll.querySelectorAll("[data-pickday]").forEach((el) => el.addEventListener("click", () => { state.workDay = el.dataset.pickday; render(); }));
    scroll.querySelectorAll("[data-routinepick]").forEach((el) => el.addEventListener("click", () => { state.workRoutine = el.dataset.routinepick; render(); }));
    scroll.querySelectorAll("[data-dayroutine]").forEach((el) => el.addEventListener("click", () => {
      const source = routine(el.dataset.dayroutine);
      state.dayPlans[el.dataset.date] = { routineId: source.id, exerciseIds: source.exerciseIds.slice() };
      render();
    }));
    scroll.querySelectorAll("[data-swap]").forEach((el) => el.addEventListener("click", () => {
      state.swap = { date: el.dataset.date, index: Number(el.dataset.swap) };
      state.picker = true;
      state.query = "";
      state.filter = "All";
      go("library");
    }));
    scroll.querySelectorAll("[data-swapto]").forEach((el) => el.addEventListener("click", () => {
      const plan = state.dayPlans[state.swap.date];
      if (plan && !plan.exerciseIds.includes(el.dataset.swapto)) plan.exerciseIds[state.swap.index] = el.dataset.swapto;
      state.swap = null;
      state.picker = false;
      go("workouts");
    }));
    scroll.querySelectorAll("[data-progress]").forEach((el) => el.addEventListener("click", () => { state.progressTab = el.dataset.progress; render(); }));
    scroll.querySelectorAll("[data-filter]").forEach((el) => el.addEventListener("click", () => { state.filter = el.dataset.filter; render(); }));
    scroll.querySelectorAll("[data-day]").forEach((el) => el.addEventListener("click", () => openDay(el.dataset.day)));
    const search = scroll.querySelector("[data-search]");
    if (search) {
      search.addEventListener("input", () => {
        state.query = search.value;
        const list = scroll.querySelectorAll(".lib, .empty");
        const q = state.query.trim().toLowerCase();
        allExercises().forEach((ex, i) => {
          const node = scroll.querySelector(`.lib[data-open="${CSS.escape(ex.id)}"], .lib[data-swapto="${CSS.escape(ex.id)}"]`);
          if (!node) return;
          const hit = (!q || ex.name.toLowerCase().includes(q)) && (state.filter === "All" || ex.region === state.filter || ex.equipment === state.filter);
          node.hidden = !hit;
        });
        const any = [...scroll.querySelectorAll(".lib")].some((n) => !n.hidden);
        let empty = scroll.querySelector(".empty");
        if (!any && !empty) {
          empty = document.createElement("p");
          empty.className = "empty";
          empty.textContent = "No exercise matches that.";
          search.closest(".block").after(empty);
        }
        if (empty) empty.hidden = any;
      });
    }
    scroll.querySelectorAll("[data-lb], [data-reps]").forEach((input) => {
      input.addEventListener("input", () => {
        const [exIndex, setIndex] = (input.dataset.lb || input.dataset.reps).split(":").map(Number);
        const set = state.live.exercises[exIndex].sets[setIndex];
        const value = Math.max(0, Number(input.value) || 0);
        if (input.dataset.lb) set.lb = value;
        else set.reps = value;
        state.live.touched = true;
      });
    });
    scroll.querySelectorAll("[data-check]").forEach((el) => el.addEventListener("click", () => {
      const [exIndex, setIndex] = el.dataset.check.split(":").map(Number);
      const ex = state.live.exercises[exIndex];
      const set = ex.sets[setIndex];
      set.done = !set.done;
      const meta = exercise(ex.id);
      if (set.done) {
        state.live.restTotal = meta.rest;
        state.live.restUntil = Date.now() + meta.rest * 1000;
      }
      render();
    }));
    scroll.querySelectorAll("[data-add-set]").forEach((el) => el.addEventListener("click", () => {
      const ex = state.live.exercises[Number(el.dataset.addSet)];
      const last = ex.sets[ex.sets.length - 1];
      ex.sets.push({ lb: last.lb, reps: last.reps, done: false });
      render();
    }));
    scroll.querySelectorAll("[data-menu]").forEach((el) => el.addEventListener("click", () => {
      state.menuEx = Number(el.dataset.menu);
      state.sheet = "menu";
      render();
    }));
    scroll.querySelectorAll("[data-rest-bump]").forEach((el) => el.addEventListener("click", () => {
      state.live.restUntil += Number(el.dataset.restBump) * 1000;
      if (state.live.restUntil < Date.now()) state.live.restUntil = 0;
      render();
    }));
    const form = scroll.querySelector("[data-form]");
    if (form) form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name")).trim();
      if (!name) return;
      const id = "custom-" + Date.now();
      const region = String(data.get("region"));
      const equipment = String(data.get("equipment"));
      state.custom.push({
        id, name, short: name, region, equipment, primary: region, secondary: "",
        rest: 90, photo: "", photoNote: "Custom exercise. No photograph yet.",
        steps: ["Add your own setup notes when this leaves the draft."],
        bodyweight: equipment === "Bodyweight",
        perHand: equipment === "Dumbbells",
      });
      D.byId[id] = state.custom[state.custom.length - 1];
      state.sheet = null;
      go("detail", { detailId: id, returnTo: "library" });
    });
  }

  function onAction(el) {
    const action = el.dataset.action;
    if (action === "start") {
      const plan = el.dataset.date && state.dayPlans[el.dataset.date];
      startRoutine(el.dataset.routine, false, plan && plan.routineId === el.dataset.routine ? plan.exerciseIds : null);
    }
    if (action === "back") {
      if (state.swap) {
        state.swap = null;
        state.picker = false;
        go("workouts");
        return;
      }
      if (state.picker && state.screen === "library") {
        state.picker = false;
        go("active");
        return;
      }
      const dest = state.returnTo || "home";
      go(dest);
    }
    if (action === "end") {
      state.sheet = logged() ? "end" : "discard";
      render();
    }
    if (action === "finish") finish();
    if (action === "ask-discard") { state.sheet = "discard"; render(); }
    if (action === "discard") discard();
    if (action === "close-sheet") { state.sheet = null; render(); }
    if (action === "skip-rest") { state.live.restUntil = 0; render(); }
    if (action === "done") go("home");
    if (action === "add") { state.picker = true; state.returnTo = "active"; go("library"); }
    if (action === "add-live") addExercise(el.dataset.id, true);
    if (action === "add-today") addExercise(el.dataset.id, false);
    if (action === "new-exercise") { state.sheet = "new"; render(); }
    if (action === "up" || action === "down") moveExercise(action === "up" ? -1 : 1);
    if (action === "drop-set") {
      const ex = state.live.exercises[state.menuEx];
      if (ex.sets.length > 1) ex.sets.pop();
      state.sheet = null;
      render();
    }
    if (action === "ask-remove") { state.sheet = "remove"; render(); }
    if (action === "remove") {
      state.live.exercises.splice(state.menuEx, 1);
      state.sheet = null;
      if (!state.live.exercises.length) state.sheet = "empty";
      render();
    }
  }

  function addExercise(id, toLive) {
    if (toLive && state.live && !state.live.exercises.some((e) => e.id === id)) {
      const prev = lastPerformance(id);
      const meta = exercise(id);
      const seed = prev ? prev.sets : [{ lb: meta.bodyweight ? 0 : 45, reps: 8 }];
      state.live.exercises.push({ id, sets: seed.map((set) => ({ lb: set.lb, reps: set.reps, done: false })) });
      state.picker = false;
      go("active");
      return;
    }
    const today = D.week.find((d) => d.today);
    const r = routine(today.routineId);
    if (!r.exerciseIds.includes(id)) r.exerciseIds.push(id);
    state.picker = false;
    go("home");
  }

  function moveExercise(dir) {
    const i = state.menuEx;
    const j = i + dir;
    const list = state.live.exercises;
    if (j < 0 || j >= list.length) return;
    const [item] = list.splice(i, 1);
    list.splice(j, 0, item);
    state.menuEx = j;
    state.sheet = null;
    render();
  }

  function openDay(iso) {
    const done = D.sessions.find((s) => s.date === iso);
    if (done) {
      state.returnTo = state.screen;
      go("session", { sessionId: done.id });
      return;
    }
    const day = D.week.find((d) => d.date === iso);
    if (day) {
      state.workDay = iso;
      state.workTab = "week";
      go("workouts");
    }
  }

  document.getElementById("tabs").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.picker = false;
    go(button.dataset.tab);
  });
  document.querySelector(".index").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.jump === "active") {
      if (!state.live) startRoutine("push-b", button.dataset.sample === "mid");
      else go("active");
      return;
    }
    if (button.dataset.jump === "complete" && !state.done) {
      startRoutine("push-b", true);
      state.live.exercises.forEach((ex) => ex.sets.forEach((set) => { set.done = true; }));
      const shoulder = state.live.exercises[0].sets[0];
      shoulder.lb = 60;
      finish();
      return;
    }
    state.picker = false;
    go(button.dataset.jump);
  });

  setInterval(() => {
    if (state.screen !== "active" || !state.live) return;
    const clock = scroll.querySelector("[data-clock]");
    if (clock) {
      const elapsed = Math.floor((Date.now() - state.live.startedAt) / 1000);
      clock.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
    }
    const rest = scroll.querySelector("[data-rest]");
    if (state.live.restUntil > Date.now()) {
      if (!rest) render();
      else {
        const left = Math.ceil((state.live.restUntil - Date.now()) / 1000);
        rest.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      }
    } else if (rest) {
      state.live.restUntil = 0;
      render();
    }
  }, 1000);

  render();
})();
