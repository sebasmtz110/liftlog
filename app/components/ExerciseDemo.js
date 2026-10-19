"use client";

import { useEffect, useRef, useState } from "react";
import { demoForExercise } from "../../lib/exerciseDemos";
import { visualForExercise } from "../../lib/exerciseVisuals";
import { guideFor } from "../../lib/exerciseGuides";

/**
 * Premium exercise visual for the workout screen — photorealistic dark
 * cinematic still (concept-board style). A small play button opens the
 * V7 mannequin clip as a form demo, preserving the instructional value.
 */
export function ExerciseVisual({ name }) {
  const photo = visualForExercise(name);
  const hasVideo = Boolean(demoForExercise(name));
  const [showDemo, setShowDemo] = useState(false);
  if (!photo) {
    // Fall back to the mannequin clip when no premium visual exists.
    return hasVideo ? (
      <div className="exercise-visual">
        <DemoThumb name={name} className="large" />
      </div>
    ) : null;
  }
  return (
    <>
      <div className="exercise-visual">
        <img src={photo} alt={`${name} demonstration`} />
        {hasVideo && (
          <button className="visual-play" aria-label="Play form demo" onClick={() => setShowDemo(true)}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </button>
        )}
      </div>
      {showDemo && <DemoModal name={name} onClose={() => setShowDemo(false)} />}
    </>
  );
}

/**
 * Small looping muted preview for an exercise row.
 * Renders nothing when the exercise has no clip (or the clip fails to load),
 * so rows without animations never show a broken video element.
 * Mirrors SebasFit's demo player: autoplay muted loop playsinline;
 * reduced-motion starts paused; errors hide the video.
 */
export function DemoThumb({ name, className = "" }) {
  const src = demoForExercise(name);
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (!src || failed) return null;
  // NOTE: muted is set via ref — React doesn't reliably apply the muted
  // *property* (iOS Safari blocks autoplay without it), and preload="auto"
  // (not "metadata") so iOS fetches enough to actually render frames.
  return (
    <video
      ref={(el) => {
        if (el) el.muted = true;
      }}
      className={`demo-thumb ${className}`.trim()}
      src={src}
      loop
      playsInline
      preload="auto"
      autoPlay={!reduced}
      aria-label={`${name} demonstration`}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Large demo player in a native-style sheet (grabber + Done button).
 * Tapped from an exercise row's preview thumbnail.
 */
export function DemoModal({ name, onClose }) {
  const src = demoForExercise(name);
  const videoRef = useRef(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Pause when the page is backgrounded, like SebasFit does.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {}
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!src) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${name} demonstration`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grabber" />
        <div className="sheet-head">
          <div style={{ flex: 1 }}>
            <p className="title-2">{name}</p>
            {muscleGroup && <p className="footnote" style={{ marginTop: 2 }}>{muscleGroup}</p>}
          </div>
          <button className="btn btn-plain" onClick={onClose}>
            Done
          </button>
        </div>
        <div className="demo-stage">
          <video
            ref={videoRef}
            className="demo-large"
            src={src}
            muted
            loop
            playsInline
            preload="auto"
            autoPlay={!reduced}
            controls={reduced}
            aria-label={`${name} demonstration video`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
        <p className="demo-note">Demo animation — form reference only.</p>
      </div>
    </div>
  );
}

/**
 * Full exercise detail sheet: animation (kept from DemoModal) plus the
 * form guide — setup, cues, and common mistakes.
 */
export function GuideSheet({ name, muscleGroup, onClose, onEdit, onDelete }) {
  const src = demoForExercise(name);
  const guide = guideFor(name);
  const videoRef = useRef(null);
  const [reduced, setReduced] = useState(false);
  const [tab, setTab] = useState("instructions");

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${name} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grabber" />
        <div className="sheet-head">
          <div style={{ flex: 1 }}>
            <p className="title-2">{name}</p>
            {muscleGroup && <p className="footnote" style={{ marginTop: 2 }}>{muscleGroup}</p>}
          </div>
          <button className="btn btn-plain" onClick={onClose}>
            Done
          </button>
        </div>
        {(() => {
          const photo = visualForExercise(name);
          return (photo || src) && (
            <>
              <div className="demo-stage">
                {photo ? (
                  <img src={photo} alt={`${name} demonstration`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ) : (
                  <video
                    ref={videoRef}
                    className="demo-large"
                    src={src}
                    muted
                    loop
                    playsInline
                    preload="auto"
                    autoPlay={!reduced}
                    controls={reduced}
                    aria-label={`${name} demonstration video`}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </div>
              <div className="spacer-8" />
            </>
          );
        })()}
        {guide ? (
          <>
            {/* Muscles — prototype: Primary / Secondary */}
            {muscleGroup && (
              <div className="guide-muscles">
                <div>
                  <p className="footnote">Primary Muscles</p>
                  <p className="headline" style={{ fontSize: 18 }}>{muscleGroup}</p>
                </div>
              </div>
            )}
            <div className="mini-tabs" role="tablist" aria-label="Guide sections">
              <button role="tab" aria-selected={tab === "instructions"}
                className={tab === "instructions" ? "on" : ""} onClick={() => setTab("instructions")}>
                Instructions
              </button>
              <button role="tab" aria-selected={tab === "sets"}
                className={tab === "sets" ? "on" : ""} onClick={() => setTab("sets")}>
                Sets & Reps
              </button>
              <button role="tab" aria-selected={tab === "tips"}
                className={tab === "tips" ? "on" : ""} onClick={() => setTab("tips")}>
                Tips
              </button>
            </div>
            {tab === "instructions" ? (
              <>
                <p className="body" style={{ margin: "12px 0 4px" }}>{guide.setup}</p>
                <ol className="steps">
                  {guide.cues.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ol>
              </>
            ) : tab === "sets" ? (
              <div className="sets-reps">
                <div className="sr-row">
                  <span className="body">Working sets</span>
                  <span className="headline">4</span>
                </div>
                <div className="sr-row">
                  <span className="body">Reps per set</span>
                  <span className="headline">8–12</span>
                </div>
                <div className="sr-row">
                  <span className="body">Rest between sets</span>
                  <span className="headline">90s</span>
                </div>
                <p className="footnote" style={{ marginTop: 12 }}>
                  A solid starting point. Add weight when you hit 12 reps on all sets.
                </p>
              </div>
            ) : (
              <ul className="steps">
                {guide.mistakes.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
            <div className="spacer-16" />
          </>
        ) : (
          <>
            <div className="spacer-8" />
            <p className="footnote">No form guide for this exercise yet.</p>
            <div className="spacer-16" />
          </>
        )}
        {(onEdit || onDelete) && (
          <div className="guide-actions">
            {onEdit && (
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onEdit}>
                Edit
              </button>
            )}
            {onDelete && (
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
