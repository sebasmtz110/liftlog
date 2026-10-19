"use client";

import { useRouter } from "next/navigation";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

export default function Settings() {
  const router = useRouter();
  return (
    <section className="screen" data-screen="settings">
      <ConfigBanner />
      <header className="subhead">
        <button type="button" aria-label="Back" onClick={() => router.back()}><Icon name="back" /></button>
        <h1>Settings</h1>
        <span />
      </header>
      <div className="pad settings">
        <h2>Weight unit</h2>
        <div className="seg" role="group" aria-label="Weight unit">
          <button type="button" className="is-on">lb</button>
          <button type="button" disabled>kg</button>
        </div>
        <p className="note">Sets are stored in pounds. Progress photos and your profile picture stay on this device and are never uploaded.</p>
        <h2>Account</h2>
        <p className="note">Sign out from your profile. Email confirmation is off, so a new account opens a session right away.</p>
      </div>
    </section>
  );
}
