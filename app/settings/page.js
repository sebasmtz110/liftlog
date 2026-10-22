"use client";

import ConfigBanner from "../components/ConfigBanner";

export default function Settings() {
  return (
    <section className="page">
      <ConfigBanner />
      <h1>Settings</h1>
      <p className="lede">Sets are stored in pounds. Kilograms stays off until that is an explicit change.</p>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Weight unit</h2>
        <div className="seg" role="group" aria-label="Weight unit" style={{ marginTop: 10 }}>
          <button type="button" className="is-on">Pounds</button>
          <button type="button" disabled>Kilograms</button>
        </div>
        <p className="note" style={{ marginTop: 12 }}>Progress photos and the profile picture stay on this device.</p>
      </section>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Account</h2>
        <p className="note">Sign out from Profile. A new account opens a session right away.</p>
      </section>
    </section>
  );
}
