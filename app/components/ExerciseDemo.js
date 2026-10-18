"use client";

import { useEffect, useRef, useState } from "react";
import { demoForExercise } from "../../lib/exerciseDemos";
import { guideFor } from "../../lib/exerciseGuides";

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
  return (
    <video
      className={`demo-thumb ${className}`.trim()}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
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
          <p className="title-2">{name}</p>
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
export function GuideSheet({ name, muscleGroup, onClose }) {
  const src = demoForExercise(name);
  const guide = guideFor(name);
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
          <p className="title-2">{name}</p>
          <button className="btn btn-plain" onClick={onClose}>
            Done
          </button>
        </div>
        {src && (
          <>
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
            <div className="spacer-8" />
          </>
        )}
        {muscleGroup && (
          <span className="muscle-tag">{muscleGroup}</span>
        )}
        {guide ? (
          <>
            <p className="guide-sec">SETUP</p>
            <p className="body">{guide.setup}</p>
            <p className="guide-sec">FORM CUES</p>
            <ol className="guide-list">
              {guide.cues.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ol>
            <p className="guide-sec">COMMON MISTAKES</p>
            <ul className="guide-list">
              {guide.mistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
            <div className="spacer-16" />
          </>
        ) : (
          <>
            <div className="spacer-8" />
            <p className="footnote">No form guide for this exercise yet.</p>
            <div className="spacer-16" />
          </>
        )}
      </div>
    </div>
  );
}
