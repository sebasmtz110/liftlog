"use client";

import { useRouter } from "next/navigation";
import ConfigBanner from "../components/ConfigBanner";

export default function Help() {
  const router = useRouter();
  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <button className="back-btn" onClick={() => router.back()} aria-label="Back">‹</button>
        <h1 className="title-2">Help & Support</h1>
      </header>
      <div className="screen-body">
        <div className="card">
          <p className="headline">Getting started</p>
          <div className="spacer-8" />
          <div className="steps">
            <div className="step"><span>1</span><p>Take the onboarding quiz to build your split.</p></div>
            <div className="step"><span>2</span><p>Tap Start on today's workout to begin logging sets.</p></div>
            <div className="step"><span>3</span><p>Check Progress to see your strength trends over time.</p></div>
          </div>
        </div>
        <div className="spacer-16" />
        <div className="card">
          <p className="headline">Your data</p>
          <div className="spacer-8" />
          <p className="footnote">Your workouts are private to your account. Progress photos stay on this device and are never uploaded.</p>
        </div>
      </div>
    </>
  );
}
