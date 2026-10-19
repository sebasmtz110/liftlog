"use client";

import { useRouter } from "next/navigation";
import ConfigBanner from "../components/ConfigBanner";

export default function Settings() {
  const router = useRouter();
  return (
    <>
      <ConfigBanner />
      <header className="screen-head">
        <button className="back-btn" onClick={() => router.back()} aria-label="Back">‹</button>
        <h1 className="title-2">Settings</h1>
      </header>
      <div className="screen-body">
        <div className="card">
          <div className="row-2" style={{ padding: "4px 0" }}>
            <div>
              <p className="headline">Units</p>
              <p className="footnote">Weights are logged in pounds</p>
            </div>
            <p className="body" style={{ color: "var(--mu)" }}>lb</p>
          </div>
        </div>
        <div className="spacer-16" />
        <div className="card">
          <p className="headline">About</p>
          <div className="spacer-8" />
          <p className="footnote">LiftLog · Build. Improve. Repeat.</p>
        </div>
      </div>
    </>
  );
}
