"use client";

import { useEffect, useRef, useState } from "react";
import { demoForExercise } from "../../lib/exerciseDemos";

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
