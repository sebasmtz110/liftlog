"use client";

import { useRouter } from "next/navigation";
import ConfigBanner from "../components/ConfigBanner";
import Icon from "../components/Icon";

export default function Help() {
  const router = useRouter();
  return (
    <section className="screen" data-screen="help">
      <ConfigBanner />
      <header className="subhead">
        <button type="button" aria-label="Back" onClick={() => router.back()}><Icon name="back" /></button>
        <h1>Help &amp; Support</h1>
        <span />
      </header>
      <div className="pad help">
        <article>
          <h2>How do I log a set?</h2>
          <p>Open today&apos;s workout and tap Start. Minus and plus change the weight or the reps. Log Set saves the set, then the rest timer takes over. Skip Rest ends it immediately.</p>
        </article>
        <article>
          <h2>Where do photos go?</h2>
          <p>Your profile picture and progress photos stay in this browser. They are not sent to the server.</p>
        </article>
        <article>
          <h2>How does movement connect?</h2>
          <p>The active set and the movement screen are marked with data-muse-slot=&quot;exercise-motion&quot;. Assign window.ALDER_MOTION_MOUNT and it is called with that element. The page emits alder:motion with the exercise, phase, time, and duration.</p>
        </article>
      </div>
    </section>
  );
}
